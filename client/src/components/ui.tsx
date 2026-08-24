import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatPercent, statusBadgeClass } from '@/lib/format';

// ────────────────────────── Badge ──────────────────────────
export function Badge({ className, children, dot }: { className?: string; children: React.ReactNode; dot?: string }) {
  return (
    <span className={`badge ${className || ''}`}>
      {dot ? <span className="priority-dot" style={{ background: dot }} /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <Badge className={statusBadgeClass(status)}>{status.replace('_', ' ')}</Badge>;
}

// ────────────────────────── Panels & Page head ──────────────────────────
export function Panel({ title, sub, actions, children, className }: {
  title?: string; sub?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`panel ${className || ''}`}>
      {(title || actions) && (
        <div className="panel-head">
          <div>
            {title && <h2 className="panel-title">{title}</h2>}
            {sub && <div className="panel-sub">{sub}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}

// ────────────────────────── KPI Card ──────────────────────────
export function KpiCard({ label, value, trend, up, spark }: {
  label: string; value: React.ReactNode; trend?: string; up?: boolean; spark?: React.ReactNode;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {trend && (
        <div className={`kpi-trend ${up ? 'up' : 'down'}`}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      )}
      {spark && <div className="kpi-spark">{spark}</div>}
    </div>
  );
}

// ────────────────────────── Progress bar ──────────────────────────
export function Progress({ value }: { value: number }) {
  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ────────────────────────── Field ──────────────────────────
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

export { formatCurrency, formatPercent };
