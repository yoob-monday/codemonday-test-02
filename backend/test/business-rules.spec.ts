import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import { AuthService } from '../src/auth/auth.service';
import { BookCategory } from '../src/books/entities/book.entity';
import { LoansService } from '../src/loans/loans.service';
import { LoanStatus } from '../src/loans/entities/loan.entity';
import {
  MemberRole,
  MemberStatus,
  MemberTier,
} from '../src/members/entities/member.entity';

function createConfigService(
  overrides: Record<string, string | undefined> = {},
) {
  return {
    get: jest.fn((key: string) => {
      const values: Record<string, string | undefined> = {
        LIBRARIAN_USERNAME: 'librarian',
        LIBRARIAN_PASSWORD: 'change-me-please',
        LIBRARIAN_EMAIL: undefined,
        LOAN_PERIOD_TEXTBOOK_DAYS: '3',
        LOAN_PERIOD_GENERAL_DAYS: '7',
        LOAN_PERIOD_NOVEL_DAYS: '14',
        FINE_PER_OVERDUE_WEEKDAY: '20',
        MAX_ACTIVE_LOANS: '3',
        REPORT_PDF_FONT_PATH: undefined,
        ...overrides,
      };

      return values[key];
    }),
  };
}

function createJwtService() {
  return {
    sign: jest.fn(() => 'signed-token'),
  } as unknown as JwtService;
}

function createMembersService() {
  return {
    findByEmail: jest.fn() as any,
    findByIdentifier: jest.fn() as any,
    create: jest.fn() as any,
  };
}

function createPrismaMock() {
  const tx = {
    member: {
      findUnique: jest.fn() as any,
    },
    book: {
      findUnique: jest.fn() as any,
      update: jest.fn() as any,
    },
    loan: {
      findMany: jest.fn() as any,
      findFirst: jest.fn() as any,
      count: jest.fn() as any,
      create: jest.fn() as any,
      findUnique: jest.fn() as any,
      update: jest.fn() as any,
    },
  };

  const prisma = {
    loan: {
      findMany: jest.fn() as any,
    },
    $transaction: (jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ) as any),
  };

  return { prisma, tx };
}

function memberFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '0812345678',
    tier: MemberTier.STUDENT,
    membershipNumber: 'MBR-0001',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function bookFixture(
  category: BookCategory,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'book-1',
    title: 'Sample Book',
    author: 'Author',
    slug: 'sample-book',
    category,
    availableCopies: 5,
    totalCopies: 5,
    ...overrides,
  };
}

function loanRecordFixture(overrides: Record<string, unknown> = {}) {
  const book = bookFixture(BookCategory.GENERAL);
  const member = memberFixture();

  return {
    id: 'loan-1',
    loanCode: 'LN-0001',
    bookId: book.id,
    memberId: member.id,
    loanDate: new Date('2026-05-01T09:00:00.000Z'),
    dueDate: new Date('2026-05-08T09:00:00.000Z'),
    returnedAt: null,
    status: LoanStatus.BORROWED,
    fineAmount: 0,
    book,
    member,
    ...overrides,
  };
}

function formatThb(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

describe('Library lending business rules', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('1. sign up + login as member, browse catalog, borrow a novel book -> due date is today + 14 days', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const configService = createConfigService();
    const jwtService = createJwtService();
    const membersService = createMembersService();
    const createdMember = memberFixture();
    const hashedPassword = await bcrypt.hash('securepass123', 10);
    const catalogBook = bookFixture(BookCategory.NOVEL, {
      id: 'novel-1',
      title: 'The Midnight Archive',
    });

    membersService.findByEmail.mockResolvedValue(null);
    membersService.create.mockResolvedValue(createdMember);
    membersService.findByIdentifier.mockResolvedValue({
      ...createdMember,
      passwordHash: hashedPassword,
    });

    const authService = new AuthService(
      configService as never,
      jwtService,
      membersService as never,
    );

    const signup = await authService.signup({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '0812345678',
      password: 'securepass123',
    });

    const login = await authService.login({
      identifier: 'alice@example.com',
      password: 'securepass123',
    });

    expect(signup.accessToken).toBe('signed-token');
    expect(login.accessToken).toBe('signed-token');

    const { prisma, tx } = createPrismaMock();
    tx.member.findUnique.mockResolvedValue(
      memberFixture({ id: createdMember.id, status: MemberStatus.ACTIVE }),
    );
    tx.loan.findMany.mockResolvedValue([]);
    tx.book.findUnique.mockResolvedValue(catalogBook);
    tx.loan.findFirst.mockResolvedValue(null);
    tx.loan.count.mockResolvedValue(0);
    tx.book.update.mockResolvedValue(undefined);
    tx.loan.create.mockImplementation(async (input: { data: any }) =>
      loanRecordFixture({
        id: 'loan-1',
        loanCode: input.data.loanCode,
        bookId: input.data.bookId,
        memberId: input.data.memberId,
        loanDate: input.data.loanDate,
        dueDate: input.data.dueDate,
        returnedAt: input.data.returnedAt,
        status: input.data.status,
        fineAmount: input.data.fineAmount,
        book: catalogBook,
        member: createdMember,
      }),
    );

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );
    const catalog = [catalogBook];
    const borrowed = await loansService.create(createdMember.id, {
      bookId: catalog[0].id,
    });

    expect(catalog[0].title).toBe('The Midnight Archive');
    expect(borrowed.loanCode).toBe('LN-0001');
    expect(borrowed.dueDate.toISOString()).toBe('2026-06-15T09:00:00.000Z');
  });

  test('2. textbook loan due date is today + 3 days', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const member = memberFixture();
    const textbook = bookFixture(BookCategory.TEXTBOOK, { id: 'textbook-1' });

    tx.member.findUnique.mockResolvedValue(member);
    tx.loan.findMany.mockResolvedValue([]);
    tx.book.findUnique.mockResolvedValue(textbook);
    tx.loan.findFirst.mockResolvedValue(null);
    tx.loan.count.mockResolvedValue(1);
    tx.book.update.mockResolvedValue(undefined);
    tx.loan.create.mockImplementation(async (input: { data: any }) =>
      loanRecordFixture({
        id: 'loan-2',
        loanCode: input.data.loanCode,
        bookId: input.data.bookId,
        memberId: input.data.memberId,
        loanDate: input.data.loanDate,
        dueDate: input.data.dueDate,
        returnedAt: input.data.returnedAt,
        status: input.data.status,
        fineAmount: input.data.fineAmount,
        book: textbook,
        member,
      }),
    );

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );
    const borrowed = await loansService.create(member.id, { bookId: textbook.id });

    expect(borrowed.dueDate.toISOString()).toBe('2026-06-04T09:00:00.000Z');
  });

  test('borrowing the same active book again returns the existing loan without creating a new one', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const member = memberFixture();
    const textbook = bookFixture(BookCategory.TEXTBOOK, { id: 'textbook-1' });
    const existingLoan = loanRecordFixture({
      id: 'loan-existing',
      loanCode: 'LN-0007',
      bookId: textbook.id,
      memberId: member.id,
      dueDate: new Date('2026-06-04T09:00:00.000Z'),
      book: textbook,
      member,
    });

    tx.member.findUnique.mockResolvedValue(member);
    tx.loan.findMany.mockResolvedValue([
      {
        dueDate: existingLoan.dueDate,
      },
    ]);
    tx.book.findUnique.mockResolvedValue(textbook);
    tx.loan.findFirst.mockResolvedValue(existingLoan);

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );
    const borrowed = await loansService.create(member.id, { bookId: textbook.id });

    expect(borrowed.id).toBe(existingLoan.id);
    expect(tx.book.update).not.toHaveBeenCalled();
    expect(tx.loan.count).not.toHaveBeenCalled();
    expect(tx.loan.create).not.toHaveBeenCalled();
  });

  test('3. borrowed today and returned today -> fine is 0 THB', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const loan = loanRecordFixture({
      loanDate: new Date('2026-06-01T09:00:00.000Z'),
      dueDate: new Date('2026-06-08T09:00:00.000Z'),
      returnedAt: null,
    });

    tx.loan.findUnique.mockResolvedValue(loan);
    tx.book.findUnique.mockResolvedValue(
      bookFixture(BookCategory.NOVEL, { id: loan.bookId }),
    );
    tx.book.update.mockResolvedValue(undefined);
    tx.loan.update.mockImplementation(async (input: { data: any }) => ({
      ...loan,
      returnedAt: input.data.returnedAt,
      status: input.data.status,
      fineAmount: input.data.fineAmount,
    }));

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );
    const returned = await loansService.returnBook(loan.id);

    expect(returned.fineAmount).toBe(0);
  });

  test('4. due_date = last Friday, return_date = this Monday -> fine is 20 THB', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const lastFriday = new Date('2026-05-29T09:00:00.000Z');
    const loan = loanRecordFixture({
      loanDate: lastFriday,
      dueDate: lastFriday,
      returnedAt: null,
    });

    tx.loan.findUnique.mockResolvedValue(loan);
    tx.book.findUnique.mockResolvedValue(
      bookFixture(BookCategory.GENERAL, { id: loan.bookId }),
    );
    tx.book.update.mockResolvedValue(undefined);
    tx.loan.update.mockImplementation(async (input: { data: any }) => ({
      ...loan,
      returnedAt: input.data.returnedAt,
      status: input.data.status,
      fineAmount: input.data.fineAmount,
    }));

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );
    const returned = await loansService.returnBook(loan.id);

    expect(returned.fineAmount).toBe(20);
  });

  test('5. member with 3 active loans cannot borrow a 4th', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const member = memberFixture();

    tx.member.findUnique.mockResolvedValue(member);
    tx.loan.findMany.mockResolvedValue([
      { dueDate: new Date('2026-06-10T09:00:00.000Z') },
      { dueDate: new Date('2026-06-11T09:00:00.000Z') },
      { dueDate: new Date('2026-06-12T09:00:00.000Z') },
    ]);

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );

    await expect(
      loansService.create(member.id, { bookId: 'book-4' }),
    ).rejects.toThrow('A member can hold at most 3 active loans.');
  });

  test('6. wrong password on member login is rejected', async () => {
    const configService = createConfigService();
    const jwtService = createJwtService();
    const membersService = createMembersService();
    const hashedPassword = await bcrypt.hash('correct-password', 10);

    membersService.findByIdentifier.mockResolvedValue(
      memberFixture({ passwordHash: hashedPassword }),
    );

    const authService = new AuthService(
      configService as never,
      jwtService,
      membersService as never,
    );

    await expect(
      authService.login({
        identifier: 'alice@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  test('7. member with a loan past due date cannot borrow a new book', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const member = memberFixture();

    tx.member.findUnique.mockResolvedValue(member);
    tx.loan.findMany.mockResolvedValue([
      {
        dueDate: new Date('2026-05-16T09:00:00.000Z'),
      },
    ]);

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );

    await expect(
      loansService.create(member.id, { bookId: 'book-new' }),
    ).rejects.toThrow('A member with any overdue loan cannot borrow more.');
  });

  test('8. due_date = 3 weeks ago Wednesday, return_date = today -> fine counts only weekdays', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const dueWednesday = new Date('2026-05-13T09:00:00.000Z');
    const loan = loanRecordFixture({
      loanDate: new Date('2026-05-13T09:00:00.000Z'),
      dueDate: dueWednesday,
      returnedAt: null,
    });

    tx.loan.findUnique.mockResolvedValue(loan);
    tx.book.findUnique.mockResolvedValue(
      bookFixture(BookCategory.GENERAL, { id: loan.bookId }),
    );
    tx.book.update.mockResolvedValue(undefined);
    tx.loan.update.mockImplementation(async (input: { data: any }) => ({
      ...loan,
      returnedAt: input.data.returnedAt,
      status: input.data.status,
      fineAmount: input.data.fineAmount,
    }));

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );
    const returned = await loansService.returnBook(loan.id);

    expect(returned.fineAmount).toBe(260);
  });

  test('fine calculation supports decimal per-weekday rates with big.js', async () => {
    jest.setSystemTime(new Date('2026-06-02T09:00:00.000Z'));

    const { prisma, tx } = createPrismaMock();
    const dueFriday = new Date('2026-05-29T09:00:00.000Z');
    const loan = loanRecordFixture({
      loanDate: dueFriday,
      dueDate: dueFriday,
      returnedAt: null,
    });

    tx.loan.findUnique.mockResolvedValue(loan);
    tx.book.findUnique.mockResolvedValue(
      bookFixture(BookCategory.GENERAL, { id: loan.bookId }),
    );
    tx.book.update.mockResolvedValue(undefined);
    tx.loan.update.mockImplementation(async (input: { data: any }) => ({
      ...loan,
      returnedAt: input.data.returnedAt,
      status: input.data.status,
      fineAmount: input.data.fineAmount,
    }));

    const loansService = new LoansService(
      prisma as never,
      createConfigService({
        FINE_PER_OVERDUE_WEEKDAY: '20.5',
      }) as never,
    );
    const returned = await loansService.returnBook(loan.id);

    expect(returned.fineAmount).toBe(41);
  });

  test('report PDF prefers a configured font path when it exists', () => {
    const { prisma } = createPrismaMock();
    const configuredFontPath = `${process.cwd()}/package.json`;
    const loansService = new LoansService(
      prisma as never,
      createConfigService({
        REPORT_PDF_FONT_PATH: configuredFontPath,
      }) as never,
    );

    expect((loansService as any).resolvePdfFontPath()).toBe(configuredFontPath);
  });

  test('9. overdue report PDF includes all overdue members with correct fines', async () => {
    jest.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));

    const { prisma } = createPrismaMock();
    const textSpy = jest.spyOn(PDFDocument.prototype as any, 'text');

    prisma.loan.findMany.mockResolvedValue([
      loanRecordFixture({
        id: 'loan-a',
        member: memberFixture({
          id: 'member-a',
          name: 'Sonia Patel',
          membershipNumber: 'MBR-0001',
          email: 'sonia@example.com',
        }),
        book: bookFixture(BookCategory.GENERAL, {
          id: 'book-a',
          title: 'Designing Human Systems',
          author: 'M. A. Velasquez',
        }),
        dueDate: new Date('2026-05-29T09:00:00.000Z'),
      }),
      loanRecordFixture({
        id: 'loan-b',
        member: memberFixture({
          id: 'member-b',
          name: 'Marcus Reed',
          membershipNumber: 'MBR-0002',
          email: 'marcus@example.com',
        }),
        book: bookFixture(BookCategory.TEXTBOOK, {
          id: 'book-b',
          title: 'Quiet Physics of Light',
          author: 'Dr. Suri Halden',
        }),
        dueDate: new Date('2026-05-28T09:00:00.000Z'),
      }),
    ]);

    const loansService = new LoansService(
      prisma as never,
      createConfigService() as never,
    );
    const overdueLoans = await loansService.findAll(undefined, 'overdue');
    const pdf = await loansService.getOverdueReportBuffer();
    const renderedText = textSpy.mock.calls.map(([value]) => value);

    expect(overdueLoans).toHaveLength(2);
    expect(overdueLoans.map((loan) => loan.currentFine)).toEqual([20, 40]);
    expect(pdf.toString('latin1').startsWith('%PDF')).toBe(true);
    expect(renderedText).toContain('Member');
    expect(renderedText).toContain('Overdue Book');
    expect(renderedText).toContain('Due Date');
    expect(renderedText).toContain('Fine');
    expect(renderedText).toContain(`Total Fine: ${formatThb(60)}`);
    expect(renderedText).toContain('Sonia Patel\nMBR-0001');
    expect(renderedText).toContain('Marcus Reed\nMBR-0002');
    expect(renderedText).toContain('Designing Human Systems\nM. A. Velasquez');
    expect(renderedText).toContain('Quiet Physics of Light\nDr. Suri Halden');
    expect(renderedText).toContain('2026-05-29');
    expect(renderedText).toContain('2026-05-28');
    expect(renderedText).toContain(formatThb(20));
    expect(renderedText).toContain(formatThb(40));
  });
});
