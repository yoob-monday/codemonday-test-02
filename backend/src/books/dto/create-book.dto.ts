import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { BookCategory } from '../entities/book.entity';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsEnum(BookCategory)
  category: BookCategory;

  @IsInt()
  @Min(1)
  copies: number;
}
