import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import {
  formatBookCategory,
  formatBookDisplayTitle,
  formatBookStatus,
  getBooks
} from "@/lib/library-data";

export default async function CatalogPage() {
  const books = await getBooks();

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Catalog</p>
        <h1 className="page-title">Collection inventory</h1>
        <p className="page-description">
          ตรวจสอบรายการหนังสือจาก backend แบบสด ๆ พร้อมดูหมวดหมู่ ตำแหน่งชั้นวาง และจำนวนสำเนาที่พร้อมให้ยืม
        </p>
      </section>

      <SectionCard title="Book Inventory" eyebrow="All Titles">
        <div className="catalog-grid">
          {books.map((book) => (
            <Link key={book.id} href={`/catalog/${book.slug}`} className="catalog-card">
              <div className="catalog-card-top">
                <span className="status-chip">{formatBookStatus(book.status, book.availableCopies)}</span>
                <span>{formatBookCategory(book.category)}</span>
              </div>
              <h2>{formatBookDisplayTitle(book)}</h2>
              <p>{book.author}</p>
              <dl className="catalog-meta">
                <div>
                  <dt>Shelf</dt>
                  <dd>{book.shelfCode}</dd>
                </div>
                <div>
                  <dt>Available</dt>
                  <dd>
                    {book.availableCopies}/{book.totalCopies}
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
