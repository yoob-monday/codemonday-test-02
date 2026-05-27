import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import {
  activities,
  books,
  dashboardStats,
  getBookForLoan,
  getMemberById,
  loans
} from "@/lib/library-data";
import { formatDate } from "@/lib/format";

const featuredBooks = books.slice(0, 3);
const urgentLoans = loans.filter((loan) => loan.status !== "On Time");

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">App Router Demo</p>
          <h1 className="hero-title">A library lending system designed for calm, fast circulation work.</h1>
          <p className="hero-text">
            Track inventory, member activity, and due dates from a single operational view built in
            Next.js.
          </p>
          <div className="hero-actions">
            <Link href="/catalog" className="button button-primary">
              Browse Catalog
            </Link>
            <Link href="/loans" className="button button-secondary">
              Review Loans
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <p className="mini-label">Today&apos;s circulation pulse</p>
          <div className="pulse-grid">
            <div>
              <span>Check-outs</span>
              <strong>24</strong>
            </div>
            <div>
              <span>Returns</span>
              <strong>18</strong>
            </div>
            <div>
              <span>Reservations</span>
              <strong>7</strong>
            </div>
            <div>
              <span>Desk wait</span>
              <strong>4 min</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="content-grid">
        <SectionCard title="Attention Queue" eyebrow="Due Dates">
          <div className="list-stack">
            {urgentLoans.map((loan) => {
              const book = getBookForLoan(loan.bookSlug);
              const member = getMemberById(loan.memberId);

              return (
                <article key={loan.id} className="list-row">
                  <div>
                    <h3>{book?.title}</h3>
                    <p>
                      {member?.name} • due {formatDate(loan.dueOn)}
                    </p>
                  </div>
                  <span className={`status-pill status-${loan.status.toLowerCase().replace(" ", "-")}`}>
                    {loan.status}
                  </span>
                </article>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Live Desk Activity" eyebrow="Operations">
          <div className="activity-list">
            {activities.map((activity) => (
              <article key={activity.id} className="activity-row">
                <div className="activity-time">{activity.time}</div>
                <div>
                  <h3>{activity.title}</h3>
                  <p>{activity.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Featured Titles" eyebrow="Catalog Highlights">
        <div className="book-grid">
          {featuredBooks.map((book) => (
            <Link key={book.id} href={`/catalog/${book.slug}`} className="book-card">
              <div className="book-meta">
                <span>{book.category}</span>
                <span>{book.shelf}</span>
              </div>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <strong>{book.status}</strong>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
