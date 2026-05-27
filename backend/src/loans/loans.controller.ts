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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MemberRole } from '../members/entities/member.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoansService } from './loans.service';

@ApiTags('Loans')
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current member loans' })
  @ApiQuery({
    name: 'scope',
    required: false,
    example: 'active',
    description: 'Optional scope: all, active, history, overdue.',
  })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('scope') scope?: string,
  ) {
    return this.loansService.findForMember(user.sub, scope);
  }

  @Get('overdue')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List overdue loans' })
  findOverdue() {
    return this.loansService.findAll(undefined, 'overdue');
  }

  @Get('overdue/report.pdf')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download overdue loans PDF report' })
  @ApiProduces('application/pdf')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List loans with optional filters' })
  @ApiQuery({
    name: 'memberId',
    required: false,
    example: 'member-uuid-here',
    description: 'Optional member id filter.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'overdue',
    description: 'Optional status filter: active, overdue, returned.',
  })
  findAll(
    @Query('memberId') memberId?: string,
    @Query('status') status?: string,
  ) {
    return this.loansService.findAll(memberId, status);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one loan by id' })
  @ApiParam({ name: 'id', example: 'loan-uuid-here' })
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Borrow a book' })
  @ApiBody({
    type: CreateLoanDto,
    examples: {
      default: {
        summary: 'Borrow book example',
        value: {
          bookId: 'book-uuid-here',
        },
      },
    },
  })
  create(
    @CurrentUser() user: AuthUser,
    @Body() createLoanDto: CreateLoanDto,
  ) {
    return this.loansService.create(user.sub, createLoanDto);
  }

  @Post(':id/return')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a loan as returned' })
  @ApiParam({ name: 'id', example: 'loan-uuid-here' })
  returnBook(@Param('id') id: string) {
    return this.loansService.returnBook(id);
  }
}
