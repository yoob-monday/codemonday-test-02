import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { BookCategory } from '../entities/book.entity';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @IsEnum(BookCategory)
  category!: BookCategory;

  @IsString()
  @IsNotEmpty()
  shelfCode!: string;

  @IsString()
  summary!: string;

  @IsInt()
  @Min(0)
  publishedYear!: number;

  @IsInt()
  @Min(1)
  totalCopies!: number;
}
