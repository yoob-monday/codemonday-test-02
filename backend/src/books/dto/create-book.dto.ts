import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BookCategory } from '../entities/book.entity';

export class CreateBookDto {
  @ApiProperty({ example: 'Clean Code' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Robert C. Martin' })
  @IsString()
  @IsNotEmpty()
  author!: string;

  @ApiPropertyOptional({ example: '9780132350884' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiProperty({ enum: BookCategory, example: BookCategory.GENERAL })
  @IsEnum(BookCategory)
  category!: BookCategory;

  @ApiPropertyOptional({ example: 'GEN-A12' })
  @IsOptional()
  @IsString()
  shelfCode?: string;

  @ApiPropertyOptional({
    example: 'A practical guide to writing maintainable software.',
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ example: 2008, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  publishedYear?: number;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  totalCopies!: number;
}
