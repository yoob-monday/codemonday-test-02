import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MemberRole } from '../members/entities/member.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.MEMBER)
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('scope') scope?: string,
  ) {
    return this.loansService.findForMember(user.sub, scope);
  }

  @Get('overdue')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  findOverdue() {
    return this.loansService.findAll(undefined, 'overdue');
  }

  @Get('overdue/report.pdf')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  async downloadOverdueReport(@Res() response: Response) {
    const reportBuffer = await this.loansService.getOverdueReportBuffer();

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="overdue-report.pdf"',
    );

    response.send(reportBuffer);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  findAll(
    @Query('memberId') memberId?: string,
    @Query('status') status?: string,
  ) {
    return this.loansService.findAll(memberId, status);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.MEMBER)
  create(
    @CurrentUser() user: AuthUser,
    @Body() createLoanDto: CreateLoanDto,
  ) {
    return this.loansService.create(user.sub, createLoanDto);
  }

  @Post(':id/return')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  returnBook(@Param('id') id: string) {
    return this.loansService.returnBook(id);
  }
}
