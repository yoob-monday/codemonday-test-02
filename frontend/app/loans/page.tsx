import { SectionCard } from "@/components/section-card";
import {
  formatBookDisplayTitle,
  formatLoanStatus,
  getLoans
} from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export default async function LoansPage() {
  const loans = await getLoans();

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Loans</p>
        <h1 className="page-title">Circulation tracking</h1>
        <p className="page-description">
          ติดตามรายการยืมคืน วันครบกำหนด ผู้ยืม และสถานะค่าปรับจากข้อมูลจริงที่ระบบคำนวณให้แบบสด
        </p>
      </section>

      <SectionCard title="Loan Register" eyebrow="Active Items">
        <div className="table-list">
          {loans.map((loan) => (
            <article key={loan.id} className="table-row">
              <div>
                <h2>{formatBookDisplayTitle(loan.book)}</h2>
                <p>{loan.member.name}</p>
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
                <strong>{formatLoanStatus(loan)}</strong>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
