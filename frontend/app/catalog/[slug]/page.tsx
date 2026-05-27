import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import {
  formatBookCategory,
  formatBookDisplayTitle,
  formatBookSummary,
  formatBookStatus,
  formatLoanStatus,
  getBookBySlug,
  getLoans
} from "@/lib/library-data";
import { formatDate } from "@/lib/format";

type BookPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  try {
    const book = await getBookBySlug(params.slug);

    return {
      title: `${formatBookDisplayTitle(book)} | Lantern Library`,
      description: formatBookSummary(book)
    };
  } catch {
    return {
      title: "Book Not Found"
    };
  }
}

export default async function BookDetailPage({ params }: BookPageProps) {
  let book;

  try {
    book = await getBookBySlug(params.slug);
  } catch {
    notFound();
  }

  const loans = await getLoans();
  const currentLoan = loans.find((loan) => loan.bookId === book.id && loan.returnedAt === null);

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Book Profile</p>
        <h1 className="page-title">{formatBookDisplayTitle(book)}</h1>
        <p className="page-description">{formatBookSummary(book)}</p>
      </section>

      <div className="content-grid">
        <SectionCard title="Availability" eyebrow="Circulation">
          <div className="detail-stack">
            <div className="detail-item">
              <span>Status</span>
              <strong>{formatBookStatus(book.status, book.availableCopies)}</strong>
            </div>
            <div className="detail-item">
              <span>Copies</span>
              <strong>
                พร้อมให้ยืม {book.availableCopies} จากทั้งหมด {book.totalCopies} เล่ม
              </strong>
            </div>
            <div className="detail-item">
              <span>Shelf</span>
              <strong>{book.shelfCode}</strong>
            </div>
            <div className="detail-item">
              <span>Category</span>
              <strong>{formatBookCategory(book.category)}</strong>
            </div>
            <div className="detail-item">
              <span>ISBN</span>
              <strong>{book.isbn}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Current Borrower" eyebrow="Loan Snapshot">
          {currentLoan ? (
            <div className="detail-stack">
              <div className="detail-item">
                <span>Member</span>
                <strong>{currentLoan.member.name}</strong>
              </div>
              <div className="detail-item">
                <span>Borrowed On</span>
                <strong>{formatDate(currentLoan.loanDate)}</strong>
              </div>
              <div className="detail-item">
                <span>Due On</span>
                <strong>{formatDate(currentLoan.dueDate)}</strong>
              </div>
              <div className="detail-item">
                <span>Status</span>
                <strong>{formatLoanStatus(currentLoan)}</strong>
              </div>
            </div>
          ) : (
            <p className="muted-copy">หนังสือเล่มนี้พร้อมให้ยืมและอยู่บนชั้นหนังสือตามตำแหน่งที่ระบุ</p>
          )}
        </SectionCard>
      </div>

      <Link href="/catalog" className="button button-secondary button-inline">
        Back to catalog
      </Link>
    </div>
  );
}
