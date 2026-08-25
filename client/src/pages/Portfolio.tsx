import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHead, Badge } from '@/components/ui';
import { formatCurrency, projectStatusBadge, projectStatusLabel, priorityBadge, priorityDotColor } from '@/lib/format';
import { api } from '@/lib/api';
import type { ProjectListItem } from '@/lib/api';

// Kanban columns mirror the project statuses from the spec §5.
const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'intake', label: 'Intake', color: '#94a3b8' },
  { key: 'scored', label: 'Scored', color: '#94a3b8' },
  { key: 'approved', label: 'Approved', color: '#a9c9ff' },
  { key: 'discovery', label: 'Discovery', color: '#5fa8ff' },
  { key: 'in_progress', label: 'In Progress', color: '#5fa8ff' },
  { key: 'uat', label: 'UAT', color: '#5fa8ff' },
  { key: 'deployed', label: 'Deployed', color: '#1e8c52' },
];

// Progress estimate derived from project status.
const STATUS_PROGRESS: Record<string, number> = {
  intake: 10, scored: 25, approved: 40, discovery: 50, in_progress: 60, uat: 80, deployed: 100, on_hold: 50, retired: 100,
};

export default function Portfolio() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  useEffect(() => {
    api.listProjects()
      .then((r) => setProjects(r.data))
      .catch(() => setProjects([]));
  }, []);

  return (
    <>
      <PageHead
        title="Portfolio"
        sub="All enterprise initiatives across the delivery lifecycle."
        actions={<button className="primary-button" onClick={() => navigate('/requests/new')}><Plus size={14} /> New Request</button>}
      />
      <div className="kanban">
        {COLUMNS.map((col) => {
          const items = projects.filter((p) => p.status === col.key);
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
                  <div className="cell-sub" style={{ marginBottom: 8 }}>{p.id.toUpperCase()} · {p.businessUnit?.name ?? '—'}</div>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <Badge className={priorityBadge(p.priority ?? 'medium')} dot={priorityDotColor(p.priority ?? 'medium')}>{p.priority ?? '—'}</Badge>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>Score {p.score}</span>
                  </div>
                  <div className="cell-sub">{formatCurrency(p.budget ?? 0)}</div>
                  {p.status && (
                    <div className="progress"><div className="progress-bar" style={{ width: `${STATUS_PROGRESS[p.status] ?? 0}%` }} /></div>
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
