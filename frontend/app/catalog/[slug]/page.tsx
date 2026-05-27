import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import { books, getBookBySlug, loans, members } from "@/lib/library-data";
import { formatDate } from "@/lib/format";

type BookPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return books.map((book) => ({
    slug: book.slug
  }));
}

export function generateMetadata({ params }: BookPageProps): Metadata {
  const book = getBookBySlug(params.slug);

  if (!book) {
    return {
      title: "Book Not Found"
    };
  }

  return {
    title: `${book.title} | Lantern Library`,
    description: book.summary
  };
}

export default function BookDetailPage({ params }: BookPageProps) {
  const book = getBookBySlug(params.slug);

  if (!book) {
    notFound();
  }

  const currentLoan = loans.find((loan) => loan.bookSlug === book.slug);
  const borrower = currentLoan ? members.find((member) => member.id === currentLoan.memberId) : null;

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Book Profile</p>
        <h1 className="page-title">{book.title}</h1>
        <p className="page-description">{book.summary}</p>
      </section>

      <div className="content-grid">
        <SectionCard title="Availability" eyebrow="Circulation">
          <div className="detail-stack">
            <div className="detail-item">
              <span>Status</span>
              <strong>{book.status}</strong>
            </div>
            <div className="detail-item">
              <span>Copies</span>
              <strong>
                {book.copiesAvailable} available of {book.copiesOwned}
              </strong>
            </div>
            <div className="detail-item">
              <span>Shelf</span>
              <strong>{book.shelf}</strong>
            </div>
            <div className="detail-item">
              <span>ISBN</span>
              <strong>{book.isbn}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Current Borrower" eyebrow="Loan Snapshot">
          {currentLoan && borrower ? (
            <div className="detail-stack">
              <div className="detail-item">
                <span>Member</span>
                <strong>{borrower.name}</strong>
              </div>
              <div className="detail-item">
                <span>Borrowed On</span>
                <strong>{formatDate(currentLoan.borrowedOn)}</strong>
              </div>
              <div className="detail-item">
                <span>Due On</span>
                <strong>{formatDate(currentLoan.dueOn)}</strong>
              </div>
              <div className="detail-item">
                <span>Status</span>
                <strong>{currentLoan.status}</strong>
              </div>
            </div>
          ) : (
            <p className="muted-copy">This title is currently available on the shelf.</p>
          )}
        </SectionCard>
      </div>

      <Link href="/catalog" className="button button-secondary button-inline">
        Back to catalog
      </Link>
    </div>
  );
}
