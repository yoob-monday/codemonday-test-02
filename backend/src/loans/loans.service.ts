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

const LOAN_PERIOD_DAYS: Record<BookCategory, number> = {
  [BookCategory.TEXTBOOK]: 3,
  [BookCategory.GENERAL]: 7,
  [BookCategory.NOVEL]: 14,
};

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
        LOAN_PERIOD_DAYS[book.category as BookCategory] ??
          LOAN_PERIOD_DAYS.general,
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
      const doc = new PDFDocument({ margin: 40 });
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
        : this.calculateFine(loan.dueDate, new Date());

    return {
      ...loan,
      status,
      daysOverdue: this.countDaysOverdue(loan.dueDate, loan.returnedAt ?? new Date()),
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

  private calculateFine(dueDate: Date, settledAt: Date) {
    return this.countDaysOverdue(dueDate, settledAt) * this.finePerDay();
  }

  private countDaysOverdue(dueDate: Date, settledAt: Date) {
    const due = this.startOfDay(dueDate);
    const settled = this.startOfDay(settledAt);

    if (settled.getTime() <= due.getTime()) {
      return 0;
    }

    return Math.ceil((settled.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
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

  private finePerDay() {
    return Number(this.configService.get('FINE_PER_DAY', '10'));
  }

  private formatCurrency(amount: number) {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
