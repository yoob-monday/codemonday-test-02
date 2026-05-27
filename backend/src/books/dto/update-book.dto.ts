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
  @IsEnum(BookCategory)
  category?: BookCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  copies?: number;
}
