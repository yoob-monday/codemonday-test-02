import { Controller, Get } from '@nestjs/common';
import { BooksService } from './books/books.service';
import { LoanStatus } from './loans/entities/loan.entity';
import { LoansService } from './loans/loans.service';
import { MemberStatus } from './members/entities/member.entity';
import { MembersService } from './members/members.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly booksService: BooksService,
    private readonly membersService: MembersService,
    private readonly loansService: LoansService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getRoot() {
    return {
      name: 'Library Lending System API',
      version: '0.1.0',
      endpoints: {
        books: '/api/books',
        members: '/api/members',
        loans: '/api/loans',
        summary: '/api/summary',
        health: '/api/health',
      },
    };
  }

  @Get('health')
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('summary')
  async getSummary() {
    const books = await this.booksService.findAll();
    const members = await this.membersService.findAll();
    const loans = await this.loansService.findAll();

    return {
      books: {
        totalTitles: books.length,
        totalCopies: books.reduce((sum, book) => sum + book.totalCopies, 0),
        availableCopies: books.reduce(
          (sum, book) => sum + book.availableCopies,
          0,
        ),
      },
      members: {
        total: members.length,
        active: members.filter((member) => member.status === MemberStatus.ACTIVE)
          .length,
      },
      loans: {
        active: loans.filter((loan) => loan.status === LoanStatus.BORROWED).length,
        overdue: loans.filter((loan) => loan.status === LoanStatus.OVERDUE).length,
        returned: loans.filter((loan) => loan.status === LoanStatus.RETURNED).length,
      },
    };
  }
}
