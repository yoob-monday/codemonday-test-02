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

const mockLibrary = buildMockLibrary();

async function fetchFromApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API request failed for ${path}: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

export function getBooks() {
  return fetchFromApi<Book[]>("/books", mockLibrary.books);
}

export async function getBookBySlug(slug: string) {
  const fallback = mockLibrary.books.find((book) => book.slug === slug);
  const book = await fetchFromApi<Book | null>(
    `/books/slug/${slug}`,
    fallback ?? null
  );

  if (!book) {
    throw new Error(`Book not found for slug ${slug}`);
  }

  return book;
}

export function getMembers() {
  return fetchFromApi<Member[]>("/members", mockLibrary.members);
}

export function getLoans() {
  return fetchFromApi<Loan[]>("/loans", mockLibrary.loans);
}

export function getSummary() {
  return fetchFromApi<LibrarySummary>("/summary", mockLibrary.summary);
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

const bookLocaleMap: Record<
  string,
  {
    bilingualTitle: string;
    thaiSummary: string;
  }
> = {
  "the-midnight-archive": {
    bilingualTitle: "หอจดหมายเหตุเที่ยงคืน / The Midnight Archive",
    thaiSummary:
      "นวนิยายลึกลับว่าด้วยห้องสมุดกลางเมืองที่เก็บรักษาความทรงจำของผู้คนไว้ในแคตตาล็อกที่เขียนด้วยมือ"
  },
  "designing-human-systems": {
    bilingualTitle: "ออกแบบระบบเพื่อผู้คน / Designing Human Systems",
    thaiSummary:
      "หนังสือแนวปฏิบัติที่อธิบายการออกแบบบริการ การมองภาพการทำงานทั้งระบบ และการปรับปรุงจาก feedback อย่างเป็นรูปธรรม"
  },
  "quiet-physics-of-light": {
    bilingualTitle: "ฟิสิกส์แสงอย่างสงบ / Quiet Physics of Light",
    thaiSummary:
      "คู่มือเรื่องแสงและโฟโตนิกส์ที่อ่านง่าย พร้อมตัวอย่างการทดลองที่เหมาะกับพื้นที่ makerspace ในห้องสมุด"
  },
  "civic-gardens-atlas": {
    bilingualTitle: "แผนที่สวนพลเมือง / Civic Gardens Atlas",
    thaiSummary:
      "รวมเรื่องราวของสวนเมือง ธนาคารเมล็ดพันธุ์ และโครงการดูแลพื้นที่ร่วมกันของชุมชนในย่านต่าง ๆ"
  }
};

export function formatBookDisplayTitle(book: Pick<Book, "slug" | "title">) {
  return bookLocaleMap[book.slug]?.bilingualTitle ?? book.title;
}

export function formatBookSummary(book: Pick<Book, "slug" | "summary">) {
  return bookLocaleMap[book.slug]?.thaiSummary ?? book.summary;
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
      detail: "จำนวนสำเนาหนังสือทั้งหมดที่ระบบยืมคืนกำลังดูแลอยู่ในขณะนี้"
    },
    {
      label: "Active Loans",
      value: summary.loans.active.toString(),
      detail: "จำนวนรายการยืมที่ยังอยู่ระหว่างการถือครองของสมาชิก"
    },
    {
      label: "Available Copies",
      value: summary.books.availableCopies.toString(),
      detail: "จำนวนสำเนาที่พร้อมให้ยืมได้ทันทีภายในวันเดียวกัน"
    },
    {
      label: "Overdue Items",
      value: summary.loans.overdue.toString(),
      detail: "จำนวนรายการที่เกินกำหนดและควรติดตามต่อทันที"
    }
  ];
}

export function buildActivities(loans: Loan[], members: Member[]) {
  const loanActivities = loans.slice(0, 2).map((loan) => ({
    id: `loan-${loan.id}`,
    title:
      loan.status === "returned" ? "Return Logged" : `Loan Issued`,
    detail:
      loan.status === "returned"
        ? `${loan.member.name} คืนหนังสือ ${formatBookDisplayTitle(loan.book)} เข้าระบบเรียบร้อยแล้ว`
        : `${loan.member.name} ยืมหนังสือ ${formatBookDisplayTitle(loan.book)} ออกจากห้องสมุด`,
    time: formatClock(loan.returnedAt ?? loan.loanDate)
  }));

  const memberActivities = members.slice(0, 1).map((member) => ({
    id: `member-${member.id}`,
    title: "Member Active",
    detail: `${member.name} ลงทะเบียนใช้งานในระดับสมาชิก ${member.tier} และพร้อมยืมหนังสือ`,
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

function buildMockLibrary() {
  const now = new Date();
  const books: Book[] = [
    {
      id: "book-1",
      slug: "the-midnight-archive",
      title: "The Midnight Archive",
      author: "Lena Kestrel",
      isbn: "9781402894626",
      category: "novel",
      shelfCode: "A1-04",
      summary:
        "นวนิยายลึกลับว่าด้วยห้องสมุดกลางเมืองที่เก็บรักษาความทรงจำของผู้คนไว้ในแคตตาล็อกที่เขียนด้วยมือ",
      publishedYear: 2021,
      totalCopies: 6,
      availableCopies: 5,
      status: "available",
      createdAt: addDays(now, -45).toISOString(),
      updatedAt: addDays(now, -2).toISOString()
    },
    {
      id: "book-2",
      slug: "designing-human-systems",
      title: "Designing Human Systems",
      author: "M. A. Velasquez",
      isbn: "9781603095186",
      category: "general",
      shelfCode: "B2-11",
      summary:
        "หนังสือแนวปฏิบัติที่อธิบายการออกแบบบริการ การมองภาพการทำงานทั้งระบบ และการปรับปรุงจาก feedback อย่างเป็นรูปธรรม",
      publishedYear: 2019,
      totalCopies: 4,
      availableCopies: 3,
      status: "available",
      createdAt: addDays(now, -40).toISOString(),
      updatedAt: addDays(now, -3).toISOString()
    },
    {
      id: "book-3",
      slug: "quiet-physics-of-light",
      title: "Quiet Physics of Light",
      author: "Dr. Suri Halden",
      isbn: "9781250301202",
      category: "textbook",
      shelfCode: "C3-02",
      summary:
        "คู่มือเรื่องแสงและโฟโตนิกส์ที่อ่านง่าย พร้อมตัวอย่างการทดลองที่เหมาะกับพื้นที่ makerspace ในห้องสมุด",
      publishedYear: 2024,
      totalCopies: 3,
      availableCopies: 2,
      status: "available",
      createdAt: addDays(now, -30).toISOString(),
      updatedAt: addDays(now, -1).toISOString()
    },
    {
      id: "book-4",
      slug: "civic-gardens-atlas",
      title: "Civic Gardens Atlas",
      author: "Paige Rowan",
      isbn: "9781891830853",
      category: "general",
      shelfCode: "D5-08",
      summary:
        "รวมเรื่องราวของสวนเมือง ธนาคารเมล็ดพันธุ์ และโครงการดูแลพื้นที่ร่วมกันของชุมชนในย่านต่าง ๆ",
      publishedYear: 2020,
      totalCopies: 5,
      availableCopies: 5,
      status: "available",
      createdAt: addDays(now, -25).toISOString(),
      updatedAt: now.toISOString()
    }
  ];

  const members: Member[] = [
    {
      id: "member-1",
      name: "Sonia Patel",
      email: "sonia.patel@example.edu",
      phone: "0812345678",
      tier: "Student",
      membershipNumber: "MBR-0001",
      status: "active",
      role: "member",
      createdAt: addDays(now, -60).toISOString(),
      updatedAt: addDays(now, -5).toISOString(),
      activeLoansCount: 1
    },
    {
      id: "member-2",
      name: "Marcus Reed",
      email: "marcus.reed@example.edu",
      phone: "0823456789",
      tier: "Faculty",
      membershipNumber: "MBR-0002",
      status: "active",
      role: "member",
      createdAt: addDays(now, -55).toISOString(),
      updatedAt: addDays(now, -4).toISOString(),
      activeLoansCount: 1
    },
    {
      id: "member-3",
      name: "Ada Moreno",
      email: "ada.moreno@example.org",
      phone: "0834567890",
      tier: "Community",
      membershipNumber: "MBR-0003",
      status: "active",
      role: "member",
      createdAt: addDays(now, -35).toISOString(),
      updatedAt: addDays(now, -2).toISOString(),
      activeLoansCount: 1
    },
    {
      id: "member-4",
      name: "Lila Chen",
      email: "lila.chen@example.edu",
      phone: "0845678901",
      tier: "Student",
      membershipNumber: "MBR-0004",
      status: "active",
      role: "member",
      createdAt: addDays(now, -20).toISOString(),
      updatedAt: now.toISOString(),
      activeLoansCount: 0
    }
  ];

  const loans: Loan[] = [
    {
      id: "loan-1",
      loanCode: "LN-0001",
      bookId: books[0].id,
      memberId: members[0].id,
      loanDate: addDays(now, -5).toISOString(),
      dueDate: addDays(now, 9).toISOString(),
      returnedAt: null,
      status: "borrowed",
      fineAmount: 0,
      currentFine: 0,
      daysOverdue: 0,
      book: {
        id: books[0].id,
        title: books[0].title,
        author: books[0].author,
        slug: books[0].slug,
        category: books[0].category
      },
      member: {
        id: members[0].id,
        name: members[0].name,
        email: members[0].email,
        phone: members[0].phone,
        membershipNumber: members[0].membershipNumber,
        tier: members[0].tier
      }
    },
    {
      id: "loan-2",
      loanCode: "LN-0002",
      bookId: books[1].id,
      memberId: members[1].id,
      loanDate: addDays(now, -6).toISOString(),
      dueDate: addDays(now, 1).toISOString(),
      returnedAt: null,
      status: "borrowed",
      fineAmount: 0,
      currentFine: 0,
      daysOverdue: 0,
      book: {
        id: books[1].id,
        title: books[1].title,
        author: books[1].author,
        slug: books[1].slug,
        category: books[1].category
      },
      member: {
        id: members[1].id,
        name: members[1].name,
        email: members[1].email,
        phone: members[1].phone,
        membershipNumber: members[1].membershipNumber,
        tier: members[1].tier
      }
    },
    {
      id: "loan-3",
      loanCode: "LN-0003",
      bookId: books[2].id,
      memberId: members[2].id,
      loanDate: addDays(now, -7).toISOString(),
      dueDate: addDays(now, -4).toISOString(),
      returnedAt: null,
      status: "overdue",
      fineAmount: 80,
      currentFine: 80,
      daysOverdue: 4,
      book: {
        id: books[2].id,
        title: books[2].title,
        author: books[2].author,
        slug: books[2].slug,
        category: books[2].category
      },
      member: {
        id: members[2].id,
        name: members[2].name,
        email: members[2].email,
        phone: members[2].phone,
        membershipNumber: members[2].membershipNumber,
        tier: members[2].tier
      }
    },
    {
      id: "loan-4",
      loanCode: "LN-0004",
      bookId: books[3].id,
      memberId: members[3].id,
      loanDate: addDays(now, -2).toISOString(),
      dueDate: addDays(now, 5).toISOString(),
      returnedAt: addDays(now, -2).toISOString(),
      status: "returned",
      fineAmount: 0,
      currentFine: 0,
      daysOverdue: 0,
      book: {
        id: books[3].id,
        title: books[3].title,
        author: books[3].author,
        slug: books[3].slug,
        category: books[3].category
      },
      member: {
        id: members[3].id,
        name: members[3].name,
        email: members[3].email,
        phone: members[3].phone,
        membershipNumber: members[3].membershipNumber,
        tier: members[3].tier
      }
    }
  ];

  const summary: LibrarySummary = {
    books: {
      totalTitles: books.length,
      totalCopies: books.reduce((total, book) => total + book.totalCopies, 0),
      availableCopies: books.reduce((total, book) => total + book.availableCopies, 0)
    },
    members: {
      total: members.length,
      active: members.filter((member) => member.status === "active").length
    },
    loans: {
      active: loans.filter((loan) => loan.status !== "returned").length,
      overdue: loans.filter((loan) => loan.status === "overdue").length,
      returned: loans.filter((loan) => loan.status === "returned").length
    }
  };

  return {
    books,
    members,
    loans,
    summary
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
