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
  const bookSeedData = [
    {
      slug: 'the-midnight-archive',
      title: 'The Midnight Archive',
      author: 'Lena Kestrel',
      isbn: '9781402894626',
      category: 'novel',
      shelfCode: 'NOV-1001',
      summary:
        'A literary mystery about a city library preserving memories inside handwritten catalogs.',
      publishedYear: 2021,
      totalCopies: 6,
      availableCopies: 5,
      status: 'available',
    },
    {
      slug: 'harbor-of-last-lanterns',
      title: 'Harbor of Last Lanterns',
      author: 'Mira Solene',
      isbn: '9781402894627',
      category: 'novel',
      shelfCode: 'NOV-1002',
      summary:
        'A coastal town faces its past when a retired mapmaker uncovers letters hidden in lighthouse walls.',
      publishedYear: 2020,
      totalCopies: 5,
      availableCopies: 5,
      status: 'available',
    },
    {
      slug: 'the-cartographers-daughter',
      title: "The Cartographer's Daughter",
      author: 'Jonas Vale',
      isbn: '9781402894628',
      category: 'novel',
      shelfCode: 'NOV-1003',
      summary:
        'A coming-of-age journey across shifting borders where family maps rewrite themselves overnight.',
      publishedYear: 2018,
      totalCopies: 4,
      availableCopies: 4,
      status: 'available',
    },
    {
      slug: 'winter-beneath-the-station',
      title: 'Winter Beneath the Station',
      author: 'Elia Marrow',
      isbn: '9781402894629',
      category: 'novel',
      shelfCode: 'NOV-1004',
      summary:
        'Commuters form an unlikely refuge community in the unused tunnels beneath a snowbound city.',
      publishedYear: 2023,
      totalCopies: 5,
      availableCopies: 5,
      status: 'available',
    },
    {
      slug: 'seven-letters-for-august',
      title: 'Seven Letters for August',
      author: 'Priya Dastan',
      isbn: '9781402894630',
      category: 'novel',
      shelfCode: 'NOV-1005',
      summary:
        'A family reunion unravels through seven unsent letters discovered in an attic trunk.',
      publishedYear: 2022,
      totalCopies: 6,
      availableCopies: 6,
      status: 'available',
    },
    {
      slug: 'designing-human-systems',
      title: 'Designing Human Systems',
      author: 'M. A. Velasquez',
      isbn: '9781603095186',
      category: 'general',
      shelfCode: 'GEN-2001',
      summary:
        'Practical methods for service design, operational mapping, and feedback-driven iteration.',
      publishedYear: 2019,
      totalCopies: 4,
      availableCopies: 3,
      status: 'available',
    },
    {
      slug: 'civic-gardens-atlas',
      title: 'Civic Gardens Atlas',
      author: 'Paige Rowan',
      isbn: '9781891830853',
      category: 'general',
      shelfCode: 'GEN-2002',
      summary:
        'Profiles of urban gardens, seed libraries, and neighborhood stewardship programs.',
      publishedYear: 2020,
      totalCopies: 5,
      availableCopies: 4,
      status: 'available',
    },
    {
      slug: 'small-room-leadership',
      title: 'Small Room Leadership',
      author: 'Denise Acker',
      isbn: '9781603095187',
      category: 'general',
      shelfCode: 'GEN-2003',
      summary:
        'A practical guide to leading teams through tight budgets, unclear ownership, and steady change.',
      publishedYear: 2021,
      totalCopies: 4,
      availableCopies: 4,
      status: 'available',
    },
    {
      slug: 'the-long-weekend-kitchen',
      title: 'The Long Weekend Kitchen',
      author: 'Rafael Bloom',
      isbn: '9781603095188',
      category: 'general',
      shelfCode: 'GEN-2004',
      summary:
        'Flexible meal plans and prep routines for households that cook in batches and share leftovers.',
      publishedYear: 2017,
      totalCopies: 3,
      availableCopies: 3,
      status: 'available',
    },
    {
      slug: 'neighborhood-makers-manual',
      title: 'Neighborhood Makers Manual',
      author: 'Cass Wu',
      isbn: '9781603095189',
      category: 'general',
      shelfCode: 'GEN-2005',
      summary:
        'Project blueprints for local workshops, repair cafes, and beginner-friendly fabrication spaces.',
      publishedYear: 2024,
      totalCopies: 5,
      availableCopies: 5,
      status: 'available',
    },
    {
      slug: 'quiet-physics-of-light',
      title: 'Quiet Physics of Light',
      author: 'Dr. Suri Halden',
      isbn: '9781250301202',
      category: 'textbook',
      shelfCode: 'TXT-3001',
      summary:
        'An accessible guide to optics and photonics with experiments suited for library makerspaces.',
      publishedYear: 2024,
      totalCopies: 3,
      availableCopies: 2,
      status: 'available',
    },
    {
      slug: 'exam-mastery-blueprint',
      title: 'Exam Mastery Blueprint',
      author: 'Narin Vachira',
      isbn: '9786169456728',
      category: 'textbook',
      shelfCode: 'TXT-3002',
      summary:
        'A structured study companion with timed drills, review checklists, and exam planning templates.',
      publishedYear: 2022,
      totalCopies: 4,
      availableCopies: 4,
      status: 'available',
    },
    {
      slug: 'calculus-for-city-planners',
      title: 'Calculus for City Planners',
      author: 'Prof. Irene Moss',
      isbn: '9781250301203',
      category: 'textbook',
      shelfCode: 'TXT-3003',
      summary:
        'Applied differential models for transit demand, growth forecasting, and land-use scenarios.',
      publishedYear: 2019,
      totalCopies: 4,
      availableCopies: 4,
      status: 'available',
    },
    {
      slug: 'applied-data-notebooks',
      title: 'Applied Data Notebooks',
      author: 'Kaito Mercer',
      isbn: '9781250301204',
      category: 'textbook',
      shelfCode: 'TXT-3004',
      summary:
        'A workbook-style introduction to data analysis with case studies, prompts, and reflection pages.',
      publishedYear: 2023,
      totalCopies: 5,
      availableCopies: 5,
      status: 'available',
    },
    {
      slug: 'foundations-of-public-biology',
      title: 'Foundations of Public Biology',
      author: 'Dr. Salma Nordin',
      isbn: '9781250301205',
      category: 'textbook',
      shelfCode: 'TXT-3005',
      summary:
        'Core biology concepts explained through public health, ecology, and community lab examples.',
      publishedYear: 2021,
      totalCopies: 4,
      availableCopies: 4,
      status: 'available',
    },
  ] as const;

  const books = await Promise.all(
    bookSeedData.map((book) =>
      prisma.book.create({
        data: book,
      }),
    ),
  );

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
