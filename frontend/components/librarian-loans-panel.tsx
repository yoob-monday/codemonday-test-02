"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  authorizedBlobRequest,
  authorizedJsonRequest
} from "@/lib/auth";
import type { Loan, Member } from "@/lib/library-data";
import { formatBookDisplayTitle, formatLoanStatus } from "@/lib/library-data";
import { formatDate, formatThb } from "@/lib/format";

type LibrarianLoansPanelProps = {
  members: Member[];
};

export function LibrarianLoansPanel({ members }: LibrarianLoansPanelProps) {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (user?.role !== "librarian" || !token) {
      return;
    }
    const authToken = token;

    let ignore = false;

    async function load() {
      try {
        setError(null);
        const memberQuery = selectedMemberId
          ? `&memberId=${encodeURIComponent(selectedMemberId)}`
          : "";
        const [active, overdue] = await Promise.all([
          authorizedJsonRequest<Loan[]>(`/loans?status=active${memberQuery}`, authToken),
          authorizedJsonRequest<Loan[]>("/loans/overdue", authToken)
        ]);

        if (!ignore) {
          setActiveLoans(active);
          setOverdueLoans(overdue);
          setIsLoaded(true);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Could not load librarian loans.");
          setIsLoaded(true);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [selectedMemberId, token, user?.role]);

  if (user?.role !== "librarian" || !token) {
    return null;
  }
  const authToken = token;
  const filteredOverdueLoans = selectedMemberId
    ? overdueLoans.filter((loan) => loan.member.id === selectedMemberId)
    : overdueLoans;
  const overdueTotalFine = filteredOverdueLoans.reduce(
    (sum, loan) => sum + loan.currentFine,
    0
  );

  function handleReturn(loanId: string) {
    startTransition(async () => {
      try {
        setError(null);
        await authorizedJsonRequest<Loan>(`/loans/${loanId}/return`, authToken, {
          method: "POST"
        });

        const [active, overdue] = await Promise.all([
          authorizedJsonRequest<Loan[]>(
            `/loans?status=active${selectedMemberId ? `&memberId=${encodeURIComponent(selectedMemberId)}` : ""}`,
            authToken
          ),
          authorizedJsonRequest<Loan[]>("/loans/overdue", authToken)
        ]);

        setActiveLoans(active);
        setOverdueLoans(overdue);
        router.refresh();
      } catch (returnError) {
        setError(returnError instanceof Error ? returnError.message : "Could not mark loan as returned.");
      }
    });
  }

  function handleDownload() {
    startTransition(async () => {
      try {
        setError(null);
        const blob = await authorizedBlobRequest("/loans/overdue/report.pdf", authToken);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "overdue-report.pdf";
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (downloadError) {
        setError(downloadError instanceof Error ? downloadError.message : "Could not download report.");
      }
    });
  }

  return (
    <section className="panel librarian-panel">
      <p className="eyebrow">Librarian</p>
      <div className="librarian-toolbar">
        <div>
          <h2 className="panel-title">Loan operations</h2>
          <p className="muted-copy">Filter active loans, mark returns, inspect overdue items, and export the overdue PDF.</p>
        </div>
        <button type="button" className="button button-secondary" onClick={handleDownload} disabled={isPending}>
          Download Overdue PDF
        </button>
      </div>

      <label className="auth-field librarian-filter">
        <span>Filter active loans by member</span>
        <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
          <option value="">All members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="librarian-grid">
        <div className="table-list">
          <h3 className="librarian-subtitle">Active loans</h3>
          {isLoaded && activeLoans.length === 0 ? (
            <p className="muted-copy">No active loans for the current filter.</p>
          ) : (
            activeLoans.map((loan) => (
              <article key={loan.id} className="list-row librarian-row">
                <div>
                  <h3>{formatBookDisplayTitle(loan.book)}</h3>
                  <p>
                    {loan.member.name} • due {formatDate(loan.dueDate)} • {formatLoanStatus(loan)}
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-primary button-compact"
                  onClick={() => handleReturn(loan.id)}
                  disabled={isPending || loan.status === "returned"}
                >
                  Mark Returned
                </button>
              </article>
            ))
          )}
        </div>

        <div className="table-list">
          <div className="librarian-section-heading">
            <h3 className="librarian-subtitle">Overdue loans</h3>
            <p className="muted-copy">Total fine: {formatThb(overdueTotalFine)}</p>
          </div>
          {isLoaded && filteredOverdueLoans.length === 0 ? (
            <p className="muted-copy">No overdue loans right now.</p>
          ) : (
            filteredOverdueLoans.map((loan) => (
              <article key={loan.id} className="list-row librarian-row">
                <div>
                  <h3>{formatBookDisplayTitle(loan.book)}</h3>
                  <p>
                    {loan.member.name} • {loan.daysOverdue} weekdays overdue • fine {loan.currentFine} THB
                  </p>
                </div>
                <span className="status-pill status-overdue">Overdue</span>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
