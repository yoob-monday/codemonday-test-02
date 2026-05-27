import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.member.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  const books = await Promise.all([
    prisma.book.create({
      data: {
        slug: 'the-midnight-archive',
        title: 'The Midnight Archive',
        author: 'Lena Kestrel',
        isbn: '9781402894626',
        category: 'novel',
        shelfCode: 'A1-04',
        summary:
          'A literary mystery about a city library preserving memories inside handwritten catalogs.',
        publishedYear: 2021,
        totalCopies: 6,
        availableCopies: 5,
        status: 'available',
      },
    }),
    prisma.book.create({
      data: {
        slug: 'designing-human-systems',
        title: 'Designing Human Systems',
        author: 'M. A. Velasquez',
        isbn: '9781603095186',
        category: 'general',
        shelfCode: 'B2-11',
        summary:
          'Practical methods for service design, operational mapping, and feedback-driven iteration.',
        publishedYear: 2019,
        totalCopies: 4,
        availableCopies: 3,
        status: 'available',
      },
    }),
    prisma.book.create({
      data: {
        slug: 'quiet-physics-of-light',
        title: 'Quiet Physics of Light',
        author: 'Dr. Suri Halden',
        isbn: '9781250301202',
        category: 'textbook',
        shelfCode: 'C3-02',
        summary:
          'An accessible guide to optics and photonics with experiments suited for library makerspaces.',
        publishedYear: 2024,
        totalCopies: 3,
        availableCopies: 2,
        status: 'available',
      },
    }),
    prisma.book.create({
      data: {
        slug: 'civic-gardens-atlas',
        title: 'Civic Gardens Atlas',
        author: 'Paige Rowan',
        isbn: '9781891830853',
        category: 'general',
        shelfCode: 'D5-08',
        summary:
          'Profiles of urban gardens, seed libraries, and neighborhood stewardship programs.',
        publishedYear: 2020,
        totalCopies: 5,
        availableCopies: 4,
        status: 'available',
      },
    }),
  ]);

  const members = await Promise.all([
    prisma.member.create({
      data: {
        name: 'Sonia Patel',
        email: 'sonia.patel@example.edu',
        phone: '0812345678',
        tier: 'Student',
        membershipNumber: 'MBR-0001',
        passwordHash,
        status: 'active',
        role: 'member',
      },
    }),
    prisma.member.create({
      data: {
        name: 'Marcus Reed',
        email: 'marcus.reed@example.edu',
        phone: '0823456789',
        tier: 'Faculty',
        membershipNumber: 'MBR-0002',
        passwordHash,
        status: 'active',
        role: 'member',
      },
    }),
    prisma.member.create({
      data: {
        name: 'Ada Moreno',
        email: 'ada.moreno@example.org',
        phone: '0834567890',
        tier: 'Community',
        membershipNumber: 'MBR-0003',
        passwordHash,
        status: 'active',
        role: 'member',
      },
    }),
    prisma.member.create({
      data: {
        name: 'Lila Chen',
        email: 'lila.chen@example.edu',
        phone: '0845678901',
        tier: 'Student',
        membershipNumber: 'MBR-0004',
        passwordHash,
        status: 'active',
        role: 'member',
      },
    }),
  ]);

  await prisma.loan.create({
    data: {
      loanCode: 'LN-0001',
      bookId: books[0].id,
      memberId: members[0].id,
      loanDate: addDays(now, -5),
      dueDate: addDays(now, 9),
      status: 'borrowed',
      fineAmount: 0,
    },
  });

  await prisma.loan.create({
    data: {
      loanCode: 'LN-0002',
      bookId: books[1].id,
      memberId: members[1].id,
      loanDate: addDays(now, -6),
      dueDate: addDays(now, 1),
      status: 'borrowed',
      fineAmount: 0,
    },
  });

  await prisma.loan.create({
    data: {
      loanCode: 'LN-0003',
      bookId: books[2].id,
      memberId: members[2].id,
      loanDate: addDays(now, -7),
      dueDate: addDays(now, -4),
      status: 'borrowed',
      fineAmount: 0,
    },
  });

  await prisma.loan.create({
    data: {
      loanCode: 'LN-0004',
      bookId: books[3].id,
      memberId: members[3].id,
      loanDate: addDays(now, -2),
      dueDate: addDays(now, 5),
      returnedAt: addDays(now, -2),
      status: 'returned',
      fineAmount: 0,
    },
  });

  console.log('Seed data created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
