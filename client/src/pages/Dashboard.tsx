import { Calendar, Download, Plus, ArrowRight } from 'lucide-react';
import { PageHead, Panel, KpiCard, StatusBadge, Badge } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, priorityBadge, priorityDotColor } from '@/lib/format';
import IdeaWizard from '@/components/IdeaWizard';
import type { Idea } from '@/lib/api';

const STATUS_BARS = [
  { label: 'Intake', count: 5, color: '#94a3b8', height: 140 },
  { label: 'Scored', count: 4, color: '#94a3b8', height: 100 },
  { label: 'Approved', count: 3, color: '#a9c9ff', height: 70 },
  { label: 'Discovery', count: 2, color: '#5fa8ff', height: 60 },
  { label: 'In Prog.', count: 2, color: '#5fa8ff', height: 50 },
  { label: 'UAT', count: 4, color: '#5fa8ff', height: 110 },
  { label: 'Deployed', count: 3, color: '#1e8c52', height: 80 },
];

const BU_DONUT = [
  { label: 'Finance · 38%', color: '#0078d4', pct: 38 },
  { label: 'Operations · 26%', color: '#2d8cff', pct: 26 },
  { label: 'IT · 18%', color: '#1e8c52', pct: 18 },
  { label: 'HR · 11%', color: '#b35d19', pct: 11 },
  { label: 'Other · 7%', color: '#546274', pct: 7 },
];

const AT_RISK = [
  { title: 'Customer Care Portal', code: 'EIDH-1042', pm: 'D. Okafor', bu: 'Operations', priority: 'critical' as const, status: 'in_progress', budget: 620000, target: 'Aug 27, 2026', score: 88 },
  { title: 'Claims Automation', code: 'EIDH-0987', pm: 'L. Reyes', bu: 'Finance', priority: 'high' as const, status: 'uat', budget: 1150000, target: 'Aug 28, 2026', score: 92 },
  { title: 'Employee Onboarding', code: 'EIDH-1101', pm: 'S. Patel', bu: 'HR', priority: 'medium' as const, status: 'deployed', budget: 240000, target: 'Aug 30, 2026', score: 74 },
  { title: 'Vendor Risk Scoring', code: 'EIDH-1055', pm: 'M. Torres', bu: 'Finance', priority: 'critical' as const, status: 'approved', budget: 410000, target: 'Aug 29, 2026', score: 81 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const onIdeaSaved = (idea: Idea) => navigate(`/ideas/${idea.id}`);

  return (
    <>
      <PageHead
        title="Executive Dashboard"
        sub="Portfolio health across all enterprise initiatives."
        actions={
          <>
            <span className="date-range"><Calendar size={15} /> Last 90 days</span>
            <button className="secondary-button"><Download size={14} /> Export</button>
            <button className="primary-button"><Plus size={14} /> New Request</button>
          </>
        }
      />

      {/* APPLICATION IDEA GENERATOR */}
      <IdeaWizard onSaved={onIdeaSaved} />

      {/* KPI CARDS */}
      <section className="kpi-grid" aria-label="Key metrics">
        <KpiCard
          label="Total Active Projects"
          value="24"
          trend="3 this quarter"
          up
          spark={<SparkLine points="0,26 18,22 36,28 54,18 72,20 90,12 108,14 120,8" />}
        />
        <KpiCard
          label="Budget Utilized"
          value="68%"
          trend="$2.4M of $3.5M"
          up
          spark={<div className="progress"><div className="progress-bar" style={{ width: '68%' }} /></div>}
        />
        <KpiCard
          label="Avg Delivery Time"
          value={<>42 <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>days</span></>}
          trend="5 days faster"
          up
          spark={<SparkLine points="0,22 18,24 36,20 54,22 72,18 90,16 108,14 120,12" />}
        />
        <KpiCard
          label="Open P1 Tickets"
          value="3"
          trend="2 SLA-breached"
          up={false}
          spark={<SparkLine points="0,12 18,14 36,10 54,16 72,14 90,20 108,22 120,26" />}
        />
      </section>

      {/* CHARTS */}
      <section className="charts-grid">
        <Panel title="Projects by Status" sub="Current portfolio distribution">
          <div className="legend" style={{ marginBottom: 12, justifyContent: 'flex-end' }}>
            <span><span className="legend-dot" style={{ background: '#5fa8ff' }} />Active</span>
            <span><span className="legend-dot" style={{ background: '#94a3b8' }} />Queued</span>
            <span><span className="legend-dot" style={{ background: '#1e8c52' }} />Deployed</span>
          </div>
          <svg className="barchart" viewBox="0 0 560 220" preserveAspectRatio="none">
            {[40, 90, 140, 190].map((y) => (
              <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--border)" strokeOpacity="0.4" />
            ))}
            {STATUS_BARS.map((b, i) => {
              const x = 30 + i * 80;
              return (
                <g key={b.label}>
                  <rect x={x} y={200 - b.height} width="44" height={b.height} rx="2" fill={b.color} />
                  <text x={x + 22} y={214} fill="var(--text-muted)" fontSize="12" textAnchor="middle">{b.label}</text>
                  <text x={x + 22} y={200 - b.height - 10} fill="var(--text)" fontFamily="var(--font-mono)" fontSize="12" textAnchor="middle">{b.count}</text>
                </g>
              );
            })}
          </svg>
        </Panel>

        <Panel title="Projects by Business Unit" sub="Allocation across the enterprise">
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${BU_DONUT.map((d, i) => {
              const start = BU_DONUT.slice(0, i).reduce((s, x) => s + x.pct, 0);
              return `${d.color} ${start}% ${start + d.pct}%`;
            }).join(', ')})` }}>
              <div className="donut-center">
                <div><b>21</b><span>Active</span></div>
              </div>
            </div>
            <div className="legend" style={{ flexDirection: 'column', gap: 10 }}>
              {BU_DONUT.map((d) => (
                <span key={d.label}><span className="legend-dot" style={{ background: d.color }} />{d.label}</span>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      {/* AT-RISK TABLE */}
      <Panel title="At-Risk Projects" sub="Target date within 7 days & not yet deployed"
        actions={<button className="secondary-button">View Portfolio <ArrowRight size={14} /></button>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th><th>Business Unit</th><th>Priority</th><th>Status</th>
                <th>Budget</th><th>Target Date</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {AT_RISK.map((p) => (
                <tr key={p.code}>
                  <td>
                    <div className="cell-title">{p.title}</div>
                    <div className="cell-sub">{p.code} · PM: {p.pm}</div>
                  </td>
                  <td>{p.bu}</td>
                  <td><Badge className={priorityBadge(p.priority)} dot={priorityDotColor(p.priority)}>{p.priority}</Badge></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="mono">{formatCurrency(p.budget)}</td>
                  <td className="mono">{p.target}</td>
                  <td className="mono">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

    </>
  );
}

function SparkLine({ points }: { points: string }) {
  return (
    <svg viewBox="0 0 120 34" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={points} />
    </svg>
  );
}
