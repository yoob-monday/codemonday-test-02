"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/components/auth-provider";
import { authorizedJsonRequest } from "@/lib/auth";
import type { Book, LibrarySummary, Loan } from "@/lib/library-data";
import {
  buildDashboardStats,
  formatBookCategory,
  formatBookDisplayTitle,
  formatBookStatus,
  formatLoanStatus,
  getBooks
} from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export function HomePageClient() {
  const { isReady, token, user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<LibrarySummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !user) {
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setError(null);
        const catalog = await getBooks();

        if (user.role === "librarian" && token) {
          const [dashboardSummary, activeLoans] = await Promise.all([
            authorizedJsonRequest<LibrarySummary>("/summary", token),
            authorizedJsonRequest<Loan[]>("/loans?status=active", token)
          ]);

          if (!ignore) {
            setBooks(catalog);
            setSummary(dashboardSummary);
            setLoans(activeLoans);
          }

          return;
        }

        if (user.role === "member" && token) {
          const myLoans = await authorizedJsonRequest<Loan[]>("/loans/me?scope=all", token);

          if (!ignore) {
            setBooks(catalog);
            setSummary(null);
            setLoans(myLoans);
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Could not load dashboard.");
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [isReady, token, user]);

  if (!isReady || !user) {
    return null;
  }

  const featuredBooks = books.slice(0, 3);

  if (user.role === "member") {
    const activeLoans = loans.filter((loan) => loan.returnedAt === null);
    const returnedLoans = loans.filter((loan) => loan.returnedAt !== null);
    const overdueLoans = loans.filter((loan) => loan.status === "overdue");
    const studentStats = [
      {
        label: "Active Loans",
        value: activeLoans.length.toString(),
        detail: "Books currently borrowed under your account."
      },
      {
        label: "Loan History",
        value: returnedLoans.length.toString(),
        detail: "Books you have already returned."
      },
      {
        label: "Overdue",
        value: overdueLoans.length.toString(),
        detail: "Items that need attention right now."
      },
      {
        label: "Available Books",
        value: books.filter((book) => book.availableCopies > 0).length.toString(),
        detail: "Catalog titles currently available to borrow."
      }
    ];

    return (
      <div className="page-stack">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Student Workspace</p>
            <h1 className="hero-title">Browse the catalog and track only your own borrowed books.</h1>
            <p className="hero-text">
              Your dashboard is private to your account. You can browse books, borrow available titles, and review your active loans and history.
            </p>
            <div className="hero-actions">
              <Link href="/catalog" className="button button-primary">
                Browse Catalog
              </Link>
              <Link href="/loans" className="button button-secondary">
                My Loans
              </Link>
            </div>
          </div>
          <div className="hero-panel">
            <p className="mini-label">My borrowing status</p>
            <div className="pulse-grid">
              <div>
                <span>Active</span>
                <strong>{activeLoans.length}</strong>
              </div>
              <div>
                <span>History</span>
                <strong>{returnedLoans.length}</strong>
              </div>
              <div>
                <span>Overdue</span>
                <strong>{overdueLoans.length}</strong>
              </div>
              <div>
                <span>Available</span>
                <strong>{books.filter((book) => book.availableCopies > 0).length}</strong>
              </div>
            </div>
          </div>
        </section>

        {error ? <p className="auth-error">{error}</p> : null}

        <section className="stats-grid">
          {studentStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="content-grid">
          <SectionCard title="My Active Loans" eyebrow="Current Books">
            <div className="list-stack">
              {activeLoans.length > 0 ? (
                activeLoans.map((loan) => {
                  const status = formatLoanStatus(loan);

                  return (
                    <article key={loan.id} className="list-row">
                      <div>
                        <h3>{formatBookDisplayTitle(loan.book)}</h3>
                        <p>
                          {loan.loanCode} • due {formatDate(loan.dueDate)}
                        </p>
                      </div>
                      <span className={`status-pill status-${status.toLowerCase().replace(" ", "-")}`}>
                        {status}
                      </span>
                    </article>
                  );
                })
              ) : (
                <p className="muted-copy">You do not have any active loans right now.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Catalog Picks" eyebrow="Available to Borrow">
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
        </section>
      </div>
    );
  }

  const dashboardStats = summary ? buildDashboardStats(summary) : [];
  const priorityLoans = loans.filter((loan) => {
    const status = formatLoanStatus(loan);
    return status === "Overdue" || status === "Due Soon";
  });

  return (
    <div className="page-stack">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Librarian Workspace</p>
          <h1 className="hero-title">Manage inventory, circulation, overdue follow-up, and member access.</h1>
          <p className="hero-text">
            Librarians can inspect the whole system, add books to the catalog, monitor active loans, and process returns with computed fines.
          </p>
          <div className="hero-actions">
            <Link href="/catalog" className="button button-primary">
              Manage Catalog
            </Link>
            <Link href="/loans" className="button button-secondary">
              Control Loans
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <p className="mini-label">System overview</p>
          <div className="pulse-grid">
            <div>
              <span>Titles</span>
              <strong>{summary?.books.totalTitles ?? 0}</strong>
            </div>
            <div>
              <span>Members</span>
              <strong>{summary?.members.total ?? 0}</strong>
            </div>
            <div>
              <span>Active</span>
              <strong>{summary?.loans.active ?? 0}</strong>
            </div>
            <div>
              <span>Overdue</span>
              <strong>{summary?.loans.overdue ?? 0}</strong>
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="auth-error">{error}</p> : null}

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
              <p className="muted-copy">No active overdue or due-soon items right now.</p>
            )}
          </div>
        </SectionCard>

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
      </section>
    </div>
  );
}
