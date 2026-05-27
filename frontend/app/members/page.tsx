import { SectionCard } from "@/components/section-card";
import { members } from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export default function MembersPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Members</p>
        <h1 className="page-title">Borrower relationships</h1>
        <p className="page-description">
          See active lending load, membership tiers, and join dates across the patron base.
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
                <strong>{member.loansActive}</strong>
              </div>
              <div>
                <span className="table-label">Joined</span>
                <strong>{formatDate(member.joinedOn)}</strong>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
