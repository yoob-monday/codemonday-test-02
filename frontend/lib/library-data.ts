export type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  isbn: string;
  category: "textbook" | "general" | "novel";
  shelfCode: string;
  summary: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  status: "available" | "unavailable";
  createdAt: string;
  updatedAt: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: "Student" | "Faculty" | "Community";
  membershipNumber: string;
  status: "active" | "suspended";
  role: "member" | "librarian";
  createdAt: string;
  updatedAt: string;
  activeLoansCount: number;
};

export type Loan = {
  id: string;
  loanCode: string;
  bookId: string;
  memberId: string;
  loanDate: string;
  dueDate: string;
  returnedAt: string | null;
  status: "borrowed" | "returned" | "overdue";
  fineAmount: number;
  currentFine: number;
  daysOverdue: number;
  book: {
    id: string;
    title: string;
    author: string;
    slug: string;
    category: Book["category"];
  };
  member: {
    id: string;
    name: string;
    email: string;
    phone: string;
    membershipNumber: string;
    tier: Member["tier"];
  };
};

export type LibrarySummary = {
  books: {
    totalTitles: number;
    totalCopies: number;
    availableCopies: number;
  };
  members: {
    total: number;
    active: number;
  };
  loans: {
    active: number;
    overdue: number;
    returned: number;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

async function fetchFromApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getBooks() {
  return fetchFromApi<Book[]>("/books");
}

export function getBookBySlug(slug: string) {
  return fetchFromApi<Book>(`/books/slug/${slug}`);
}

export function getMembers() {
  return fetchFromApi<Member[]>("/members");
}

export function getLoans() {
  return fetchFromApi<Loan[]>("/loans");
}

export function getSummary() {
  return fetchFromApi<LibrarySummary>("/summary");
}

export function formatBookCategory(category: Book["category"]) {
  switch (category) {
    case "textbook":
      return "Textbook";
    case "general":
      return "General";
    case "novel":
      return "Novel";
    default:
      return category;
  }
}

export function formatBookStatus(status: Book["status"], availableCopies: number) {
  if (status === "unavailable" || availableCopies === 0) {
    return "Checked Out";
  }

  return "Available";
}

export function formatLoanStatus(loan: Loan) {
  if (loan.status === "returned") {
    return "Returned";
  }

  if (loan.status === "overdue") {
    return "Overdue";
  }

  const dueDate = new Date(loan.dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysUntilDue <= 2) {
    return "Due Soon";
  }

  return "On Time";
}

export function buildDashboardStats(summary: LibrarySummary) {
  return [
    {
      label: "Collection Size",
      value: summary.books.totalCopies.toString(),
      detail: "Total copies managed in circulation."
    },
    {
      label: "Active Loans",
      value: summary.loans.active.toString(),
      detail: "Checked-out titles currently in member hands."
    },
    {
      label: "Available Copies",
      value: summary.books.availableCopies.toString(),
      detail: "Copies ready for same-day borrowing."
    },
    {
      label: "Overdue Items",
      value: summary.loans.overdue.toString(),
      detail: "Loans needing immediate follow-up."
    }
  ];
}

export function buildActivities(loans: Loan[], members: Member[]) {
  const loanActivities = loans.slice(0, 2).map((loan) => ({
    id: `loan-${loan.id}`,
    title:
      loan.status === "returned"
        ? "Returned to circulation"
        : `Loan issued for ${loan.book.title}`,
    detail:
      loan.status === "returned"
        ? `${loan.book.title} was checked back in by ${loan.member.name}.`
        : `${loan.member.name} borrowed ${loan.book.title}.`,
    time: formatClock(loan.returnedAt ?? loan.loanDate)
  }));

  const memberActivities = members.slice(0, 1).map((member) => ({
    id: `member-${member.id}`,
    title: "Membership profile active",
    detail: `${member.name} is registered under the ${member.tier} tier.`,
    time: formatClock(member.createdAt)
  }));

  return [...loanActivities, ...memberActivities];
}

function formatClock(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(dateString));
}
