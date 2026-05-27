import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookCategory } from '../entities/book.entity';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Clean Code - Revised Edition' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Robert Martin' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: '9780132350884' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ enum: BookCategory, example: BookCategory.GENERAL })
  @IsOptional()
  @IsEnum(BookCategory)
  category?: BookCategory;

  @ApiPropertyOptional({ example: 'GEN-A15' })
  @IsOptional()
  @IsString()
  shelfCode?: string;

  @ApiPropertyOptional({
    example: 'Updated library edition with refreshed metadata.',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 2010, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  publishedYear?: number;

  @ApiPropertyOptional({ example: 7, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCopies?: number;
}
