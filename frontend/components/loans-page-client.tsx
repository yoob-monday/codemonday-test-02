"use client";

import { useEffect, useState } from "react";
import { LibrarianLoansPanel } from "@/components/librarian-loans-panel";
import { SectionCard } from "@/components/section-card";
import { useAuth } from "@/components/auth-provider";
import { authorizedJsonRequest } from "@/lib/auth";
import type { Loan, Member } from "@/lib/library-data";
import {
  formatBookCategory,
  formatBookDisplayTitle,
  formatLoanStatus
} from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export function LoansPageClient() {
  const { isReady, token, user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !token || !user) {
      return;
    }
    const currentUser = user;
    const authToken = token;

    let ignore = false;

    async function load() {
      try {
        setError(null);

        if (currentUser.role === "librarian") {
          const [allLoans, allMembers] = await Promise.all([
            authorizedJsonRequest<Loan[]>("/loans?status=active", authToken),
            authorizedJsonRequest<Member[]>("/members", authToken)
          ]);

          if (!ignore) {
            setLoans(allLoans);
            setMembers(allMembers);
          }

          return;
        }

        const myLoans = await authorizedJsonRequest<Loan[]>("/loans/me?scope=all", authToken);

        if (!ignore) {
          setLoans(myLoans);
          setMembers([]);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Could not load loans.");
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

  if (user.role === "member") {
    const activeLoans = loans.filter((loan) => loan.returnedAt === null);
    const historyLoans = loans.filter((loan) => loan.returnedAt !== null);

    return (
      <div className="page-stack">
        <section className="page-header">
          <p className="eyebrow">My Loans</p>
          <h1 className="page-title">My active loans and history</h1>
          <p className="page-description">This page only shows books borrowed under your own account.</p>
        </section>

        {error ? <p className="auth-error">{error}</p> : null}

        <SectionCard title="Active Loans" eyebrow="Current Books">
          <div className="table-list">
            {activeLoans.length > 0 ? (
              activeLoans.map((loan) => (
                <article key={loan.id} className="table-row">
                  <div>
                    <h2>{formatBookDisplayTitle(loan.book)}</h2>
                    <p>{loan.loanCode}</p>
                  </div>
                  <div>
                    <span className="table-label">Category</span>
                    <strong>{formatBookCategory(loan.book.category)}</strong>
                  </div>
                  <div>
                    <span className="table-label">Borrowed</span>
                    <strong>{formatDate(loan.loanDate)}</strong>
                  </div>
                  <div>
                    <span className="table-label">Due</span>
                    <strong>{formatDate(loan.dueDate)}</strong>
                  </div>
                  <div>
                    <span className="table-label">Status</span>
                    <strong>
                      {formatLoanStatus(loan)}
                      {loan.status === "overdue" ? ` • ${loan.currentFine} THB` : ""}
                    </strong>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-copy">You do not have any active loans right now.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Loan History" eyebrow="Past Books">
          <div className="table-list">
            {historyLoans.length > 0 ? (
              historyLoans.map((loan) => (
                <article key={loan.id} className="table-row">
                  <div>
                    <h2>{formatBookDisplayTitle(loan.book)}</h2>
                    <p>{loan.loanCode}</p>
                  </div>
                  <div>
                    <span className="table-label">Category</span>
                    <strong>{formatBookCategory(loan.book.category)}</strong>
                  </div>
                  <div>
                    <span className="table-label">Returned</span>
                    <strong>{loan.returnedAt ? formatDate(loan.returnedAt) : "-"}</strong>
                  </div>
                  <div>
                    <span className="table-label">Fine</span>
                    <strong>{loan.fineAmount} THB</strong>
                  </div>
                  <div>
                    <span className="table-label">Status</span>
                    <strong>{formatLoanStatus(loan)}</strong>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-copy">Your loan history will appear here after you return books.</p>
            )}
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Loans</p>
        <h1 className="page-title">Circulation tracking</h1>
        <p className="page-description">
          Librarians can review active loans, filter by member, mark returns, and manage overdue follow-up.
        </p>
      </section>

      {error ? <p className="auth-error">{error}</p> : null}

      <SectionCard title="Active Loan Register" eyebrow="Live Circulation">
        <div className="table-list">
          {loans.map((loan) => (
            <article key={loan.id} className="table-row">
              <div>
                <h2>{formatBookDisplayTitle(loan.book)}</h2>
                <p>{loan.member.name}</p>
              </div>
              <div>
                <span className="table-label">Category</span>
                <strong>{formatBookCategory(loan.book.category)}</strong>
              </div>
              <div>
                <span className="table-label">Borrowed</span>
                <strong>{formatDate(loan.loanDate)}</strong>
              </div>
              <div>
                <span className="table-label">Due</span>
                <strong>{formatDate(loan.dueDate)}</strong>
              </div>
              <div>
                <span className="table-label">Status</span>
                <strong>
                  {formatLoanStatus(loan)}
                  {loan.status === "overdue" ? ` • ${loan.currentFine} THB` : ""}
                </strong>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <LibrarianLoansPanel members={members} />
    </div>
  );
}
