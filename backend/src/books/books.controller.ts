import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberRole } from '../members/entities/member.entity';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'Browse the book catalog' })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'clean code',
    description: 'Optional title or author search term.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    example: 'general',
    description: 'Optional category filter.',
  })
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.booksService.findAll(search, category);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get one book by slug' })
  @ApiParam({ name: 'slug', example: 'clean-code' })
  findBySlug(@Param('slug') slug: string) {
    return this.booksService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one book by id' })
  @ApiParam({ name: 'id', example: 'book-uuid-here' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a book to the catalog' })
  @ApiBody({
    type: CreateBookDto,
    examples: {
      default: {
        summary: 'Add book example',
        value: {
          title: 'Clean Code',
          author: 'Robert C. Martin',
          isbn: '9780132350884',
          category: 'general',
          shelfCode: 'GEN-A12',
          summary: 'A practical guide to writing maintainable software.',
          publishedYear: 2008,
          totalCopies: 5,
        },
      },
    },
  })
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a catalog book' })
  @ApiParam({ name: 'id', example: 'book-uuid-here' })
  @ApiBody({
    type: UpdateBookDto,
    examples: {
      default: {
        summary: 'Update book example',
        value: {
          title: 'Clean Code - Updated Edition',
          shelfCode: 'GEN-A15',
          totalCopies: 7,
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(MemberRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book from the catalog' })
  @ApiParam({ name: 'id', example: 'book-uuid-here' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
