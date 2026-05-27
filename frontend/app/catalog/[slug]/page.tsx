import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BorrowBookPanel } from "@/components/borrow-book-panel";
import { SectionCard } from "@/components/section-card";
import {
  formatBookCategory,
  formatBookDisplayTitle,
  formatBookSummary,
  formatBookStatus,
  getBookBySlug
} from "@/lib/library-data";

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

        <BorrowBookPanel book={book} />
      </div>

      <Link href="/catalog" className="button button-secondary button-inline">
        Back to catalog
      </Link>
    </div>
  );
}
