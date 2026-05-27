import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import {
  buildActivities,
  buildDashboardStats,
  formatBookCategory,
  formatBookDisplayTitle,
  formatBookStatus,
  formatLoanStatus,
  getBooks,
  getLoans,
  getMembers,
  getSummary
} from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export default async function HomePage() {
  const [summary, books, loans, members] = await Promise.all([
    getSummary(),
    getBooks(),
    getLoans(),
    getMembers()
  ]);

  const featuredBooks = books.slice(0, 3);
  const priorityLoans = loans.filter((loan) => {
    const status = formatLoanStatus(loan);
    return status === "Overdue" || status === "Due Soon";
  });
  const activities = buildActivities(loans, members);
  const dashboardStats = buildDashboardStats(summary);

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Integrated Workspace</p>
          <h1 className="hero-title">A library lending system backed by live inventory, members, and loan rules.</h1>
          <p className="hero-text">
            แดชบอร์ดนี้ดึงข้อมูลจาก Nest API โดยตรง และสะท้อนข้อมูลหนังสือ สมาชิก และสถานะการยืมคืนจาก PostgreSQL แบบเรียลไทม์
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
              <span>Titles</span>
              <strong>{summary.books.totalTitles}</strong>
            </div>
            <div>
              <span>Members</span>
              <strong>{summary.members.total}</strong>
            </div>
            <div>
              <span>Active</span>
              <strong>{summary.loans.active}</strong>
            </div>
            <div>
              <span>Overdue</span>
              <strong>{summary.loans.overdue}</strong>
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
            {priorityLoans.length > 0 ? (
              priorityLoans.map((loan) => {
                const status = formatLoanStatus(loan);

                return (
                  <article key={loan.id} className="list-row">
                    <div>
                      <h3>{formatBookDisplayTitle(loan.book)}</h3>
                      <p>
                        {loan.member.name} • due {formatDate(loan.dueDate)}
                      </p>
                    </div>
                    <span className={`status-pill status-${status.toLowerCase().replace(" ", "-")}`}>
                      {status}
                    </span>
                  </article>
                );
              })
            ) : (
              <p className="muted-copy">ขณะนี้ยังไม่มีรายการที่เกินกำหนดหรือใกล้ถึงวันครบกำหนด</p>
            )}
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
                <span>{formatBookCategory(book.category)}</span>
                <span>{book.shelfCode}</span>
              </div>
              <h3>{formatBookDisplayTitle(book)}</h3>
              <p>{book.author}</p>
              <strong>{formatBookStatus(book.status, book.availableCopies)}</strong>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
