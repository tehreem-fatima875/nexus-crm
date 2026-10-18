import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone.toLowerCase().replaceAll(" ", "-")}`}>{children}</span>;
}

export function Avatar({ initials, color = "#dcebe0", size = "normal" }: { initials: string; color?: string; size?: "normal" | "small" }) {
  return <span className={`avatar avatar-${size}`} style={{ backgroundColor: color }} aria-hidden="true">{initials}</span>;
}

export function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-title-row"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-mark">N</span><h3>{title}</h3><p>{detail}</p></div>;
}