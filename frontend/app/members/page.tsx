import { SectionCard } from "@/components/section-card";
import { getMembers } from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Members</p>
        <h1 className="page-title">Borrower relationships</h1>
        <p className="page-description">
          ข้อมูลสมาชิกมาจาก backend โดยตรง และแสดงจำนวนรายการยืมที่ยัง active จากฐานข้อมูลปัจจุบัน
        </p>
      </section>

      <SectionCard title="Membership Directory" eyebrow="Patrons">
        <div className="table-list">
          {members.map((member) => (
            <article key={member.id} className="table-row">
              <div>
                <h2>{member.name}</h2>
                <p>{member.email}</p>
              </div>
              <div>
                <span className="table-label">Tier</span>
                <strong>{member.tier}</strong>
              </div>
              <div>
                <span className="table-label">Active Loans</span>
                <strong>{member.activeLoansCount}</strong>
              </div>
              <div>
                <span className="table-label">Joined</span>
                <strong>{formatDate(member.createdAt)}</strong>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
