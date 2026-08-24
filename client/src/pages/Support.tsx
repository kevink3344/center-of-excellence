import { Plus } from 'lucide-react';
import { PageHead, Panel, Badge, StatusBadge } from '@/components/ui';
import { formatDate, ticketPriorityBadge, ticketStatusBadge } from '@/lib/format';

interface Ticket {
  id: string;
  title: string;
  project: string;
  priority: string;
  status: string;
  assignee: string;
  reportedBy: string;
  slaDueAt: string;
  slaRisk?: 'breach' | 'warning';
}

const TICKETS: Ticket[] = [
  { id: 'T-2201', title: 'Customer search returns stale results', project: 'Customer Care Portal', priority: 'p2', status: 'in_progress', assignee: 'M. Chen', reportedBy: 'R. Singh', slaDueAt: 'Aug 24, 2026', slaRisk: 'warning' },
  { id: 'T-2198', title: 'Notification preferences not persisting', project: 'Customer Care Portal', priority: 'p3', status: 'open', assignee: '—', reportedBy: 'A. Nwosu', slaDueAt: 'Aug 26, 2026' },
  { id: 'T-2194', title: 'Claims export times out over 50k rows', project: 'Claims Automation', priority: 'p1', status: 'in_progress', assignee: 'L. Reyes', reportedBy: 'Finance Ops', slaDueAt: 'Aug 22, 2026', slaRisk: 'breach' },
  { id: 'T-2190', title: 'Onboarding badge sync error', project: 'Employee Onboarding', priority: 'p2', status: 'open', assignee: 'S. Patel', reportedBy: 'HR', slaDueAt: 'Aug 27, 2026' },
  { id: 'T-2189', title: 'Vendor risk score wrong for inactive vendors', project: 'Vendor Risk Scoring', priority: 'p1', status: 'open', assignee: 'M. Torres', reportedBy: 'Finance Ops', slaDueAt: 'Aug 21, 2026', slaRisk: 'breach' },
];

export default function Support() {
  return (
    <>
      <PageHead
        title="Support Desk"
        sub="Track, triage, and resolve support tickets across the portfolio."
        actions={<button className="primary-button"><Plus size={14} /> New Ticket</button>}
      />

      {/* SLA risk summary */}
      <section className="kpi-grid" aria-label="Support metrics">
        <div className="kpi-card"><div className="kpi-label">Open Tickets</div><div className="kpi-value">14</div></div>
        <div className="kpi-card"><div className="kpi-label">P1 Priority</div><div className="kpi-value">3</div></div>
        <div className="kpi-card"><div className="kpi-label">SLA Breached</div><div className="kpi-value">2</div></div>
        <div className="kpi-card"><div className="kpi-label">Avg Response</div><div className="kpi-value">1.2 <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>hrs</span></div></div>
      </section>

      <Panel title="Tickets">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th><th>Project</th><th>Priority</th><th>Status</th>
                <th>Assignee</th><th>Reported By</th><th>SLA Due</th>
              </tr>
            </thead>
            <tbody>
              {TICKETS.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="cell-title">{t.title}</div>
                    <div className="cell-sub">{t.id}</div>
                  </td>
                  <td>{t.project}</td>
                  <td><Badge className={ticketPriorityBadge(t.priority as any)}>{t.priority.toUpperCase()}</Badge></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.assignee}</td>
                  <td>{t.reportedBy}</td>
                  <td>
                    <span className="mono">{t.slaDueAt}</span>
                    {t.slaRisk && (
                      <div className="cell-sub" style={{ color: t.slaRisk === 'breach' ? 'var(--red, #ba3040)' : 'var(--amber, #a56c00)' }}>
                        {t.slaRisk === 'breach' ? '⚠ SLA breached' : '⚠ Trending to breach'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
