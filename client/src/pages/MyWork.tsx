import { useNavigate } from 'react-router-dom';
import { PageHead, Panel, StatusBadge, Badge } from '@/components/ui';
import { priorityBadge, priorityDotColor, ticketPriorityBadge, ticketPriorityDotColor } from '@/lib/format';

const ASSIGNED = [
  { title: 'Customer Care Portal', code: 'EIDH-1042', role: 'Executive Sponsor', status: 'in_progress', priority: 'critical' as const },
  { title: 'Vendor Risk Scoring', code: 'EIDH-1055', role: 'Reviewer', status: 'approved', priority: 'critical' as const },
];

const TICKETS = [
  { title: 'Claims export times out over 50k rows', code: 'T-2194', status: 'in_progress', priority: 'p1' as const },
  { title: 'Vendor risk score wrong for inactive vendors', code: 'T-2189', status: 'open', priority: 'p1' as const },
];

export default function MyWork() {
  const navigate = useNavigate();
  return (
    <>
      <PageHead title="My Work" sub="Items assigned to me across the portfolio." />
      <Panel title="Projects">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Project</th><th>Role</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {ASSIGNED.map((p) => (
                <tr key={p.code} onClick={() => navigate('/projects/p1')} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="cell-title">{p.title}</div>
                    <div className="cell-sub">{p.code}</div>
                  </td>
                  <td>{p.role}</td>
                  <td><Badge className={priorityBadge(p.priority)} dot={priorityDotColor(p.priority)}>{p.priority}</Badge></td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="My Tickets">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {TICKETS.map((t) => (
                <tr key={t.code}>
                  <td>
                    <div className="cell-title">{t.title}</div>
                    <div className="cell-sub">{t.code}</div>
                  </td>
                  <td><Badge className={ticketPriorityBadge(t.priority)} dot={ticketPriorityDotColor(t.priority)}>{t.priority.toUpperCase()}</Badge></td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
