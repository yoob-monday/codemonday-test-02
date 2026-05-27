"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import { useAuth } from "@/components/auth-provider";
import { authorizedJsonRequest } from "@/lib/auth";
import type { Book, Loan } from "@/lib/library-data";
import { formatLoanStatus } from "@/lib/library-data";
import { formatDate } from "@/lib/format";

type BorrowBookPanelProps = {
  book: Book;
};

export function BorrowBookPanel({ book }: BorrowBookPanelProps) {
  const router = useRouter();
  const { isReady, token, user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successLoan, setSuccessLoan] = useState<Loan | null>(null);
  const [myLoan, setMyLoan] = useState<Loan | null>(null);

  useEffect(() => {
    if (!isReady || !token || user?.role !== "member") {
      return;
    }
    const authToken = token;

    let ignore = false;

    async function load() {
      try {
        const loans = await authorizedJsonRequest<Loan[]>("/loans/me?scope=all", authToken);
        const loanForBook = loans.find(
          (loan) => loan.bookId === book.id && loan.returnedAt === null
        );

        if (!ignore) {
          setMyLoan(loanForBook ?? null);
        }
      } catch {
        if (!ignore) {
          setMyLoan(null);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [book.id, isReady, token, user?.role]);

  if (!isReady) {
    return null;
  }

  if (user?.role !== "member" || !token) {
    return (
      <SectionCard title="Borrowing Access" eyebrow="Member Action">
        <p className="muted-copy">Only member accounts can borrow books from the catalog.</p>
      </SectionCard>
    );
  }

  const authToken = token;
  const borrowUnavailable = book.dataOrigin === "mock";

  function handleBorrow() {
    if (borrowUnavailable) {
      setError("Borrow is unavailable because the page is using mock catalog data. Start the backend API and reload.");
      return;
    }

    setError(null);
    setSuccessLoan(null);

    startTransition(async () => {
      try {
        const loan = await authorizedJsonRequest<Loan>("/loans", authToken, {
          method: "POST",
          body: JSON.stringify({
            bookId: book.id
          })
        });

        setSuccessLoan(loan);
        setMyLoan(loan);
        router.refresh();
      } catch (borrowError) {
        setError(borrowError instanceof Error ? borrowError.message : "Could not borrow this book.");
      }
    });
  }

  return (
    <SectionCard title="My Borrowing" eyebrow="Member Action">
      {myLoan ? (
        <div className="detail-stack">
          <div className="detail-item">
            <span>Loan Code</span>
            <strong>{myLoan.loanCode}</strong>
          </div>
          <div className="detail-item">
            <span>Due Date</span>
            <strong>{formatDate(myLoan.dueDate)}</strong>
          </div>
          <div className="detail-item">
            <span>Status</span>
            <strong>{formatLoanStatus(myLoan)}</strong>
          </div>
        </div>
      ) : (
        <>
          <p className="muted-copy">
            Borrow this title to receive an immediate loan code and due date based on the book category.
          </p>
          {borrowUnavailable ? (
            <p className="auth-error">
              This catalog entry is coming from fallback mock data, so borrowing is disabled until the backend API is reachable.
            </p>
          ) : null}
          <button
            type="button"
            className="button button-primary"
            onClick={handleBorrow}
            disabled={isPending || book.availableCopies <= 0 || borrowUnavailable}
          >
            {isPending
              ? "Borrowing..."
              : borrowUnavailable
                ? "API Required"
                : book.availableCopies > 0
                  ? "Borrow This Book"
                  : "Unavailable"}
          </button>
        </>
      )}

      {successLoan ? (
        <p className="auth-success">
          Loan created: {successLoan.loanCode} due on {formatDate(successLoan.dueDate)}
        </p>
      ) : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </SectionCard>
  );
}
