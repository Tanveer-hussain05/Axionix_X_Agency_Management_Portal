import { useEffect, type ReactNode } from "react";
import { ArrowUpRight, FileText, Sparkles, X } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "Paid" || status === "Active" ? "positive" : status === "Delivered" ? "blue" : "pending";
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{status}</span>;
}

export function Panel({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`panel ${className}`}>{children}</section>;
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export function Modal({ title, description, onClose, children, wide = false }: { title: string; description?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></header>
      {children}
    </section>
  </div>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><FileText size={20} /></span><strong>{title}</strong><p>{body}</p>{action}</div>;
}

export function MiniStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) { return <Panel className="mini-stat"><span className="mini-stat-icon">{icon}</span><span>{label}</span><strong>{value}</strong></Panel>; }

export function StatCard({ label, value, delta, icon, tint, trend, foot }: { label: string; value: string; delta: string; icon: ReactNode; tint: string; trend: "up" | "neutral"; foot: string }) {
  return <Panel className="stat-card"><div className={`stat-icon tint-${tint}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><div className="stat-foot"><span className={trend === "up" ? "trend-up" : "trend-neutral"}>{trend === "up" ? <ArrowUpRight size={13} /> : <Sparkles size={12} />}{delta}</span><span>{foot}</span></div><div className={`stat-spark spark-${tint}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div></Panel>;
}
