import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookCategory } from '../entities/book.entity';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsEnum(BookCategory)
  category?: BookCategory;

  @IsOptional()
  @IsString()
  shelfCode?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  publishedYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;
}
