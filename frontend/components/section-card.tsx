import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function SectionCard({ title, eyebrow, children }: SectionCardProps) {
  return (
    <section className="panel">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="panel-title">{title}</h2>
      {children}
    </section>
  );
}
