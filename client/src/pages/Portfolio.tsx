import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHead, Badge } from '@/components/ui';
import { formatCurrency, projectStatusBadge, projectStatusLabel, priorityBadge, priorityDotColor } from '@/lib/format';

// Kanban columns mirror the project statuses from the spec §5.
const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'intake', label: 'Intake', color: '#94a3b8' },
  { key: 'scored', label: 'Scored', color: '#94a3b8' },
  { key: 'approved', label: 'Approved', color: '#a9c9ff' },
  { key: 'in_progress', label: 'In Progress', color: '#5fa8ff' },
  { key: 'uat', label: 'UAT', color: '#5fa8ff' },
  { key: 'deployed', label: 'Deployed', color: '#1e8c52' },
];

interface Project {
  id: string;
  title: string;
  code: string;
  bu: string;
  priority: string;
  status: string;
  budget: number;
  score: number;
  progress?: number;
}

const PROJECTS: Project[] = [
  { id: 'p1', title: 'Customer Care Portal', code: 'EIDH-1042', bu: 'Operations', priority: 'critical', status: 'in_progress', budget: 620000, score: 88, progress: 64 },
  { id: 'p2', title: 'Claims Automation', code: 'EIDH-0987', bu: 'Finance', priority: 'high', status: 'uat', budget: 1150000, score: 92, progress: 82 },
  { id: 'p3', title: 'Employee Onboarding', code: 'EIDH-1101', bu: 'HR', priority: 'medium', status: 'deployed', budget: 240000, score: 74, progress: 100 },
  { id: 'p4', title: 'Vendor Risk Scoring', code: 'EIDH-1055', bu: 'Finance', priority: 'critical', status: 'approved', budget: 410000, score: 81, progress: 20 },
  { id: 'p5', title: 'Predictive Analytics Hub', code: 'EIDH-1201', bu: 'IT', priority: 'high', status: 'intake', budget: 780000, score: 85 },
  { id: 'p6', title: 'Mobile Field Ops', code: 'EIDH-1130', bu: 'Operations', priority: 'medium', status: 'scored', budget: 520000, score: 68 },
  { id: 'p7', title: 'Audit Trail Modernization', code: 'EIDH-1077', bu: 'IT', priority: 'low', status: 'intake', budget: 190000, score: 55 },
  { id: 'p8', title: 'Knowledge Base Search', code: 'EIDH-0903', bu: 'Operations', priority: 'medium', status: 'scored', budget: 135000, score: 61 },
];

export default function Portfolio() {
  const navigate = useNavigate();

  return (
    <>
      <PageHead
        title="Portfolio"
        sub="All enterprise initiatives across the delivery lifecycle."
        actions={<button className="primary-button" onClick={() => navigate('/requests/new')}><Plus size={14} /> New Request</button>}
      />
      <div className="kanban">
        {COLUMNS.map((col) => {
          const items = PROJECTS.filter((p) => p.status === col.key);
          return (
            <div className="kanban-col" key={col.key}>
              <div className="kanban-head">
                <span className="kanban-title"><span className="legend-dot" style={{ background: col.color }} />{col.label}</span>
                <span className="kanban-count">{items.length}</span>
              </div>
              {items.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '10px 4px' }}>No projects</div>}
              {items.map((p) => (
                <div className="kanban-card" key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="cell-title" style={{ marginBottom: 2 }}>{p.title}</div>
                  <div className="cell-sub" style={{ marginBottom: 8 }}>{p.code} · {p.bu}</div>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <Badge className={priorityBadge(p.priority as any)} dot={priorityDotColor(p.priority as any)}>{p.priority}</Badge>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>Score {p.score}</span>
                  </div>
                  <div className="cell-sub">{formatCurrency(p.budget)}</div>
                  {typeof p.progress === 'number' && (
                    <div className="progress"><div className="progress-bar" style={{ width: `${p.progress}%` }} /></div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
