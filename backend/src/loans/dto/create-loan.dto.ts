import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({
    example: 'book-uuid-here',
    description: 'Book id returned from the catalog endpoints.',
  })
  @IsString()
  @IsNotEmpty()
  bookId!: string;
}
