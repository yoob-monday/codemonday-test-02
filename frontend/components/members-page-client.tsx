"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/section-card";
import { useAuth } from "@/components/auth-provider";
import { authorizedJsonRequest } from "@/lib/auth";
import type { Member } from "@/lib/library-data";
import { formatDate } from "@/lib/format";

export function MembersPageClient() {
  const router = useRouter();
  const { isReady, token, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !token || !user) {
      return;
    }
    const authToken = token;

    if (user.role !== "librarian") {
      router.replace("/");
      return;
    }

    let ignore = false;

    async function load() {
      try {
        setError(null);
        const directory = await authorizedJsonRequest<Member[]>("/members", authToken);

        if (!ignore) {
          setMembers(directory);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Could not load member data.");
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [isReady, router, token, user]);

  if (!isReady || !user) {
    return null;
  }

  if (user.role !== "librarian") {
    return null;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <p className="eyebrow">Members</p>
        <h1 className="page-title">Borrower relationships</h1>
        <p className="page-description">
          Librarians can review the full member directory and active borrowing load.
        </p>
      </section>

      <SectionCard title="Membership Directory" eyebrow="Patrons">
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="table-list">
          {members.map((directoryMember) => (
            <article key={directoryMember.id} className="table-row">
              <div>
                <h2>{directoryMember.name}</h2>
                <p>{directoryMember.email}</p>
              </div>
              <div>
                <span className="table-label">Tier</span>
                <strong>{directoryMember.tier}</strong>
              </div>
              <div>
                <span className="table-label">Active Loans</span>
                <strong>{directoryMember.activeLoansCount}</strong>
              </div>
              <div>
                <span className="table-label">Joined</span>
                <strong>{formatDate(directoryMember.createdAt)}</strong>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
