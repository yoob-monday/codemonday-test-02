import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { books } from "@/lib/library-data";

export default function CatalogPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Catalog</p>
        <h1 className="page-title">Collection inventory</h1>
        <p className="page-description">
          Browse the active collection and drill into each title using App Router dynamic routes.
        </p>
      </section>

      <SectionCard title="Book Inventory" eyebrow="All Titles">
        <div className="catalog-grid">
          {books.map((book) => (
            <Link key={book.id} href={`/catalog/${book.slug}`} className="catalog-card">
              <div className="catalog-card-top">
                <span className="status-chip">{book.status}</span>
                <span>{book.category}</span>
              </div>
              <h2>{book.title}</h2>
              <p>{book.author}</p>
              <dl className="catalog-meta">
                <div>
                  <dt>Shelf</dt>
                  <dd>{book.shelf}</dd>
                </div>
                <div>
                  <dt>Available</dt>
                  <dd>
                    {book.copiesAvailable}/{book.copiesOwned}
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
