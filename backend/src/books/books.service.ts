import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, BookStatus } from './entities/book.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(search?: string, category?: string) {
    return this.prisma.book.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  author: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
        ...(category
          ? {
              category: {
                equals: category,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<Book[]>;
  }

  async findOne(id: string) {
    const book = (await this.prisma.book.findUnique({
      where: { id },
    })) as Book | null;

    if (!book) {
      throw new NotFoundException(`Book with id "${id}" was not found.`);
    }

    return book;
  }

  async findBySlug(slug: string) {
    const book = (await this.prisma.book.findUnique({
      where: { slug },
    })) as Book | null;

    if (!book) {
      throw new NotFoundException(`Book with slug "${slug}" was not found.`);
    }

    return book;
  }

  create(createBookDto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        ...createBookDto,
        slug: this.buildSlug(createBookDto.title),
        summary: createBookDto.summary,
        totalCopies: createBookDto.totalCopies,
        availableCopies: createBookDto.totalCopies,
        status: BookStatus.AVAILABLE,
      },
    }) as Promise<Book>;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);
    const borrowedCopies = book.totalCopies - book.availableCopies;

    if (
      updateBookDto.totalCopies !== undefined &&
      updateBookDto.totalCopies < borrowedCopies
    ) {
      throw new BadRequestException(
        'Total copies cannot be less than the number of borrowed copies.',
      );
    }

    const totalCopies = updateBookDto.totalCopies ?? book.totalCopies;
    return this.prisma.book.update({
      where: { id },
      data: {
        ...updateBookDto,
        ...(updateBookDto.title
          ? {
              slug: this.buildSlug(updateBookDto.title),
            }
          : {}),
        totalCopies,
        availableCopies: totalCopies - borrowedCopies,
        status:
          totalCopies - borrowedCopies > 0
            ? BookStatus.AVAILABLE
            : BookStatus.UNAVAILABLE,
      },
    }) as Promise<Book>;
  }

  async lendCopy(id: string) {
    const book = await this.findOne(id);

    if (book.availableCopies <= 0) {
      throw new BadRequestException('This book is currently unavailable.');
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        availableCopies: {
          decrement: 1,
        },
        status:
          book.availableCopies - 1 > 0
            ? BookStatus.AVAILABLE
            : BookStatus.UNAVAILABLE,
      },
    }) as Promise<Book>;
  }

  async receiveCopy(id: string) {
    const book = await this.findOne(id);

    if (book.availableCopies >= book.totalCopies) {
      throw new BadRequestException('All copies are already in the library.');
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        availableCopies: {
          increment: 1,
        },
        status: BookStatus.AVAILABLE,
      },
    }) as Promise<Book>;
  }

  private buildSlug(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'book';
  }
}
