import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { BookCategory } from '../books/entities/book.entity';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanStatus } from './entities/loan.entity';

type LoanRecord = {
  id: string;
  loanCode: string;
  bookId: string;
  memberId: string;
  loanDate: Date;
  dueDate: Date;
  returnedAt: Date | null;
  status: string;
  fineAmount: number;
  book: {
    id: string;
    title: string;
    author: string;
    slug: string;
    category: BookCategory;
  };
  member: {
    id: string;
    name: string;
    email: string;
    phone: string;
    membershipNumber: string;
    tier: string;
  };
};

@Injectable()
export class LoansService {
  private readonly loanInclude = {
    book: {
      select: {
        id: true,
        title: true,
        author: true,
        slug: true,
        category: true,
      },
    },
    member: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        membershipNumber: true,
        tier: true,
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(memberId?: string, status?: string) {
    const loans = (await this.prisma.loan.findMany({
      where: {
        ...(memberId ? { memberId } : {}),
        ...(status === 'returned'
          ? { returnedAt: { not: null } }
          : status === 'active' || status === 'overdue'
            ? { returnedAt: null }
            : {}),
      },
      include: this.loanInclude,
      orderBy: {
        loanDate: 'desc',
      },
    })) as LoanRecord[];

    const decorated = loans.map((loan) => this.decorateLoan(loan));

    if (status === 'overdue') {
      return decorated.filter((loan) => loan.status === LoanStatus.OVERDUE);
    }

    if (status === 'active') {
      return decorated.filter((loan) =>
        [LoanStatus.BORROWED, LoanStatus.OVERDUE].includes(loan.status),
      );
    }

    return decorated;
  }

  async findForMember(memberId: string, scope = 'all') {
    const loans = await this.findAll(memberId);

    if (scope === 'active') {
      return loans.filter((loan) =>
        [LoanStatus.BORROWED, LoanStatus.OVERDUE].includes(loan.status),
      );
    }

    if (scope === 'history') {
      return loans.filter((loan) => loan.returnedAt !== null);
    }

    if (scope === 'overdue') {
      return loans.filter((loan) => loan.status === LoanStatus.OVERDUE);
    }

    return loans;
  }

  async findOne(id: string) {
    const loan = (await this.prisma.loan.findUnique({
      where: { id },
      include: this.loanInclude,
    })) as LoanRecord | null;

    if (!loan) {
      throw new NotFoundException(`Loan with id "${id}" was not found.`);
    }

    return this.decorateLoan(loan);
  }

  async create(memberId: string, createLoanDto: CreateLoanDto) {
    const loanDate = new Date();

    const loan = (await this.prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        throw new NotFoundException(`Member with id "${memberId}" was not found.`);
      }

      if (member.status !== 'active') {
        throw new BadRequestException('Only active members can borrow books.');
      }

      const activeLoans = await tx.loan.findMany({
        where: {
          memberId,
          returnedAt: null,
        },
      });

      if (activeLoans.length >= this.maxActiveLoans()) {
        throw new BadRequestException(
          `A member can hold at most ${this.maxActiveLoans()} active loans.`,
        );
      }

      if (activeLoans.some((loanItem) => this.isOverdue(loanItem.dueDate))) {
        throw new BadRequestException(
          'A member with any overdue loan cannot borrow more.',
        );
      }

      const book = await tx.book.findUnique({
        where: { id: createLoanDto.bookId },
      });

      if (!book) {
        throw new NotFoundException(
          `Book with id "${createLoanDto.bookId}" was not found.`,
        );
      }

      if (book.availableCopies <= 0) {
        throw new BadRequestException('This book is currently unavailable.');
      }

      const activeLoan = await tx.loan.findFirst({
        where: {
          bookId: createLoanDto.bookId,
          memberId,
          returnedAt: null,
        },
      });

      if (activeLoan) {
        throw new BadRequestException(
          'This member already has an active loan for the same book.',
        );
      }

      const loanCount = await tx.loan.count();
      const dueDate = this.addDays(
        loanDate,
        this.loanPeriodDays(book.category as BookCategory),
      );

      await tx.book.update({
        where: { id: book.id },
        data: {
          availableCopies: {
            decrement: 1,
          },
          status: book.availableCopies - 1 > 0 ? 'available' : 'unavailable',
        },
      });

      return tx.loan.create({
        data: {
          loanCode: `LN-${String(loanCount + 1).padStart(4, '0')}`,
          bookId: createLoanDto.bookId,
          memberId,
          loanDate,
          dueDate,
          returnedAt: null,
          status: LoanStatus.BORROWED,
          fineAmount: 0,
        },
        include: this.loanInclude,
      });
    })) as LoanRecord;

    return this.decorateLoan(loan);
  }

  async returnBook(id: string) {
    const returnDate = new Date();

    const loan = (await this.prisma.$transaction(async (tx) => {
      const loanRecord = await tx.loan.findUnique({
        where: { id },
        include: this.loanInclude,
      });

      if (!loanRecord) {
        throw new NotFoundException(`Loan with id "${id}" was not found.`);
      }

      if (loanRecord.returnedAt) {
        throw new BadRequestException('This loan has already been returned.');
      }

      const book = await tx.book.findUnique({
        where: { id: loanRecord.bookId },
      });

      if (!book) {
        throw new NotFoundException(`Book with id "${loanRecord.bookId}" was not found.`);
      }

      await tx.book.update({
        where: { id: loanRecord.bookId },
        data: {
          availableCopies: {
            increment: 1,
          },
          status: 'available',
        },
      });

      return tx.loan.update({
        where: { id },
        data: {
          returnedAt: returnDate,
          status: LoanStatus.RETURNED,
          fineAmount: this.calculateFine(
            loanRecord.loanDate,
            loanRecord.dueDate,
            returnDate,
          ),
        },
        include: this.loanInclude,
      });
    })) as LoanRecord;

    return this.decorateLoan(loan);
  }

  async getOverdueReportBuffer() {
    const overdueLoans = await this.findAll(undefined, 'overdue');

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, compress: false });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Overdue Loans Report');
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown();

      if (overdueLoans.length === 0) {
        doc.fontSize(12).text('No overdue loans at the time of generation.');
      } else {
        overdueLoans.forEach((loan, index) => {
          doc.fontSize(12).text(
            `${index + 1}. ${loan.member.name} (${loan.member.membershipNumber})`,
          );
          doc.fontSize(10).text(`Email: ${loan.member.email}`);
          doc.text(`Book: ${loan.book.title} by ${loan.book.author}`);
          doc.text(`Loan code: ${loan.loanCode}`);
          doc.text(`Due date: ${loan.dueDate.toISOString().slice(0, 10)}`);
          doc.text(`Fine: ${this.formatCurrency(loan.currentFine)}`);
          doc.moveDown();
        });
      }

      doc.end();
    });
  }

  private decorateLoan(loan: LoanRecord) {
    const status = this.resolveStatus(loan);
    const currentFine =
      status === LoanStatus.RETURNED
        ? loan.fineAmount
        : this.calculateFine(loan.loanDate, loan.dueDate, new Date());

    return {
      ...loan,
      status,
      daysOverdue: this.countOverdueWeekdays(
        loan.dueDate,
        loan.returnedAt ?? new Date(),
      ),
      currentFine,
    };
  }

  private resolveStatus(loan: LoanRecord) {
    if (loan.returnedAt) {
      return LoanStatus.RETURNED;
    }

    if (this.isOverdue(loan.dueDate)) {
      return LoanStatus.OVERDUE;
    }

    return LoanStatus.BORROWED;
  }

  private calculateFine(loanDate: Date, dueDate: Date, settledAt: Date) {
    if (this.isSameDay(loanDate, settledAt)) {
      return 0;
    }

    return (
      this.countOverdueWeekdays(dueDate, settledAt) * this.finePerOverdueWeekday()
    );
  }

  private countOverdueWeekdays(dueDate: Date, settledAt: Date) {
    const due = this.startOfDay(dueDate);
    const settled = this.startOfDay(settledAt);

    if (settled.getTime() <= due.getTime()) {
      return 0;
    }

    let days = 0;
    const cursor = this.addDays(due, 1);

    while (cursor.getTime() <= settled.getTime()) {
      const day = cursor.getDay();

      if (day !== 0 && day !== 6) {
        days += 1;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  private isOverdue(dueDate: Date) {
    return this.startOfDay(new Date()).getTime() > this.startOfDay(dueDate).getTime();
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private isSameDay(left: Date, right: Date) {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  private formatCurrency(amount: number) {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private loanPeriodDays(category: BookCategory) {
    const fallbackPeriods: Record<BookCategory, number> = {
      [BookCategory.TEXTBOOK]: 3,
      [BookCategory.GENERAL]: 7,
      [BookCategory.NOVEL]: 14,
    };

    const envKeys: Record<BookCategory, string> = {
      [BookCategory.TEXTBOOK]: 'LOAN_PERIOD_TEXTBOOK_DAYS',
      [BookCategory.GENERAL]: 'LOAN_PERIOD_GENERAL_DAYS',
      [BookCategory.NOVEL]: 'LOAN_PERIOD_NOVEL_DAYS',
    };

    return Number(
      this.configService.get(envKeys[category]) ?? fallbackPeriods[category],
    );
  }

  private finePerOverdueWeekday() {
    return Number(this.configService.get('FINE_PER_OVERDUE_WEEKDAY') ?? 20);
  }

  private maxActiveLoans() {
    return Number(this.configService.get('MAX_ACTIVE_LOANS') ?? 3);
  }
}
