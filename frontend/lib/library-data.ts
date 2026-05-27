export type BookStatus = "Available" | "Checked Out" | "Reserved";

export type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  shelf: string;
  isbn: string;
  status: BookStatus;
  copiesOwned: number;
  copiesAvailable: number;
  summary: string;
};

export type MemberTier = "Student" | "Faculty" | "Community";

export type Member = {
  id: string;
  name: string;
  tier: MemberTier;
  email: string;
  loansActive: number;
  joinedOn: string;
};

export type Loan = {
  id: string;
  bookSlug: string;
  memberId: string;
  borrowedOn: string;
  dueOn: string;
  status: "On Time" | "Due Soon" | "Overdue";
};

export type Activity = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

export const books: Book[] = [
  {
    id: "BK-1001",
    slug: "the-midnight-archive",
    title: "The Midnight Archive",
    author: "Lena Kestrel",
    category: "Fiction",
    shelf: "A1-04",
    isbn: "978-1-4028-9462-6",
    status: "Checked Out",
    copiesOwned: 6,
    copiesAvailable: 0,
    summary: "A literary mystery about a city library preserving memories inside handwritten catalogs."
  },
  {
    id: "BK-1002",
    slug: "designing-human-systems",
    title: "Designing Human Systems",
    author: "M. A. Velasquez",
    category: "Design",
    shelf: "B2-11",
    isbn: "978-1-60309-518-6",
    status: "Available",
    copiesOwned: 4,
    copiesAvailable: 2,
    summary: "Practical methods for service design, operational mapping, and feedback-driven iteration."
  },
  {
    id: "BK-1003",
    slug: "quiet-physics-of-light",
    title: "Quiet Physics of Light",
    author: "Dr. Suri Halden",
    category: "Science",
    shelf: "C3-02",
    isbn: "978-1-25030-120-2",
    status: "Reserved",
    copiesOwned: 3,
    copiesAvailable: 1,
    summary: "An accessible guide to optics and photonics with experiments suited for library makerspaces."
  },
  {
    id: "BK-1004",
    slug: "civic-gardens-atlas",
    title: "Civic Gardens Atlas",
    author: "Paige Rowan",
    category: "Community",
    shelf: "D5-08",
    isbn: "978-1-891830-85-3",
    status: "Available",
    copiesOwned: 5,
    copiesAvailable: 4,
    summary: "Profiles of urban gardens, seed libraries, and neighborhood stewardship programs."
  }
];

export const members: Member[] = [
  {
    id: "MB-201",
    name: "Sonia Patel",
    tier: "Student",
    email: "sonia.patel@example.edu",
    loansActive: 2,
    joinedOn: "2025-08-16"
  },
  {
    id: "MB-202",
    name: "Marcus Reed",
    tier: "Faculty",
    email: "marcus.reed@example.edu",
    loansActive: 1,
    joinedOn: "2024-11-02"
  },
  {
    id: "MB-203",
    name: "Ada Moreno",
    tier: "Community",
    email: "ada.moreno@example.org",
    loansActive: 3,
    joinedOn: "2026-01-20"
  },
  {
    id: "MB-204",
    name: "Lila Chen",
    tier: "Student",
    email: "lila.chen@example.edu",
    loansActive: 0,
    joinedOn: "2026-03-12"
  }
];

export const loans: Loan[] = [
  {
    id: "LN-9001",
    bookSlug: "the-midnight-archive",
    memberId: "MB-201",
    borrowedOn: "2026-05-14",
    dueOn: "2026-05-28",
    status: "Due Soon"
  },
  {
    id: "LN-9002",
    bookSlug: "designing-human-systems",
    memberId: "MB-202",
    borrowedOn: "2026-05-08",
    dueOn: "2026-06-01",
    status: "On Time"
  },
  {
    id: "LN-9003",
    bookSlug: "quiet-physics-of-light",
    memberId: "MB-203",
    borrowedOn: "2026-05-02",
    dueOn: "2026-05-20",
    status: "Overdue"
  }
];

export const activities: Activity[] = [
  {
    id: "AC-1",
    title: "Returns Cart Cleared",
    detail: "18 returned items were re-shelved before the afternoon rush.",
    time: "08:15"
  },
  {
    id: "AC-2",
    title: "New Membership Batch",
    detail: "12 community members were approved for weekend borrowing access.",
    time: "10:40"
  },
  {
    id: "AC-3",
    title: "Reservation Ready",
    detail: "The reserved copy of Quiet Physics of Light is staged at the front desk.",
    time: "13:05"
  }
];

export function getBookBySlug(slug: string) {
  return books.find((book) => book.slug === slug);
}

export function getMemberById(id: string) {
  return members.find((member) => member.id === id);
}

export function getBookForLoan(bookSlug: string) {
  return books.find((book) => book.slug === bookSlug);
}

export const dashboardStats = [
  {
    label: "Collection Size",
    value: books.reduce((total, book) => total + book.copiesOwned, 0).toString(),
    detail: "Total copies managed in circulation."
  },
  {
    label: "Active Loans",
    value: loans.length.toString(),
    detail: "Checked-out titles currently in member hands."
  },
  {
    label: "Available Copies",
    value: books.reduce((total, book) => total + book.copiesAvailable, 0).toString(),
    detail: "Copies ready for same-day borrowing."
  },
  {
    label: "Overdue Items",
    value: loans.filter((loan) => loan.status === "Overdue").length.toString(),
    detail: "Loans needing immediate follow-up."
  }
];
