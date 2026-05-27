import { SectionCard } from "@/components/section-card";
import { getBookForLoan, getMemberById, loans } from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export default function LoansPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Loans</p>
        <h1 className="page-title">Circulation tracking</h1>
        <p className="page-description">
          Monitor due dates, flag overdue items, and keep the lending queue visible.
        </p>
      </section>

      <SectionCard title="Loan Register" eyebrow="Active Items">
        <div className="table-list">
          {loans.map((loan) => {
            const book = getBookForLoan(loan.bookSlug);
            const member = getMemberById(loan.memberId);

            return (
              <article key={loan.id} className="table-row">
                <div>
                  <h2>{book?.title}</h2>
                  <p>{member?.name}</p>
                </div>
                <div>
                  <span className="table-label">Borrowed</span>
                  <strong>{formatDate(loan.borrowedOn)}</strong>
                </div>
                <div>
                  <span className="table-label">Due</span>
                  <strong>{formatDate(loan.dueOn)}</strong>
                </div>
                <div>
                  <span className="table-label">Status</span>
                  <strong>{loan.status}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
