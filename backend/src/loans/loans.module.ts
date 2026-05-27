import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { MembersModule } from '../members/members.module';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  imports: [BooksModule, MembersModule],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
