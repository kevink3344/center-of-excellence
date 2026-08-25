import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { PageHead, Panel, StatusBadge, Badge, Field } from '@/components/ui';
import { formatCurrency, formatDate, priorityBadge, priorityDotColor, ticketPriorityBadge, ticketPriorityDotColor, projectStatusLabel } from '@/lib/format';
import { api } from '@/lib/api';
import type { Project } from '@/lib/api';
import type { ProjectStatus, ProjectPriority } from '@eidh/shared';

type Tab = 'overview' | 'requirements' | 'sprints' | 'deployments' | 'support' | 'activity';

const STATUSES: ProjectStatus[] = ['intake', 'scored', 'approved', 'discovery', 'in_progress', 'uat', 'deployed', 'on_hold', 'retired'];
const PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high', 'critical'];

// Coarse progress estimate derived from project status.
const STATUS_PROGRESS: Record<string, number> = {
  intake: 10, scored: 25, approved: 40, discovery: 50, in_progress: 60, uat: 80, deployed: 100, on_hold: 50, retired: 100,
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'sprints', label: 'Sprints' },
  { key: 'deployments', label: 'Deployments' },
  { key: 'support', label: 'Support' },
  { key: 'activity', label: 'Activity' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: '', description: '', status: 'intake' as ProjectStatus, priority: 'medium' as ProjectPriority,
    budget: '', score: '', startDate: '', targetDate: '',
  });

  useEffect(() => {
    if (!id) return;
    setError(null);
    setProject(null);
    api.getProject(id)
      .then((r) => setProject(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load project'));
  }, [id]);

  const startEdit = () => {
    if (!project) return;
    setDraft({
      title: project.title,
      description: project.description ?? '',
      status: project.status,
      priority: (project.priority ?? 'medium') as ProjectPriority,
      budget: project.budget != null ? String(project.budget) : '',
      score: project.score != null ? String(project.score) : '',
      startDate: project.startDate ?? '',
      targetDate: project.targetDate ?? '',
    });
    setEditError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!id) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await api.updateProject(id, {
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        status: draft.status,
        priority: draft.priority,
        budget: draft.budget ? Number(draft.budget) : undefined,
        score: draft.score ? Number(draft.score) : undefined,
        startDate: draft.startDate || undefined,
        targetDate: draft.targetDate || undefined,
      });
      setProject((prev) => (prev ? { ...prev, ...updated.data } : updated.data));
      setEditing(false);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <>
        <PageHead
          title="Project not found"
          sub="This project doesn't exist or you don't have access."
          actions={
            <button className="secondary-button" onClick={() => navigate('/portfolio')}>
              <ArrowLeft size={14} /> Back to Portfolio
            </button>
          }
        />
        <Panel title="Oops">
          <div className="ai-result-empty">
            <div><div style={{ fontSize: 28, marginBottom: 8 }}>🔎</div>{error}<br />Try selecting a project from the Portfolio instead.</div>
          </div>
        </Panel>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <PageHead
          title="Project"
          sub="Loading project…"
          actions={
            <button className="secondary-button" onClick={() => navigate('/portfolio')}>
              <ArrowLeft size={14} /> Portfolio
            </button>
          }
        />
        <Panel title="Loading">
          <div className="ai-result-loading"><span className="spinner" />Loading project…</div>
        </Panel>
      </>
    );
  }

  const startDate = project.startDate ?? '';
  const targetDate = project.targetDate ?? '';
  const p = {
    id: project.id,
    title: project.title,
    code: project.id.toUpperCase(),
    bu: project.businessUnit?.name ?? '—',
    priority: (project.priority ?? 'medium') as 'critical' | 'high' | 'medium' | 'low',
    status: project.status,
    budget: project.budget ?? 0,
    score: project.score,
    progress: STATUS_PROGRESS[project.status] ?? 0,
    pm: project.pm?.name ?? '—',
    requestor: project.requestor?.name ?? '—',
    startDate,
    targetDate,
    description: project.description ?? '',
    requirements: (project.requirements ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      status: r.status,
      assignee: r.assignee?.name ?? '—',
    })),
    sprints: (project.sprints ?? []).map((s) => ({
      name: s.name,
      status: s.status,
      dates: `${s.startDate ?? ''} – ${s.endDate ?? ''}`.replace(' – ', ' – '),
    })),
    deployments: (project.deployments ?? []).map((d) => ({
      env: d.environment.toUpperCase(),
      version: d.version,
      status: d.status,
      date: d.deployedAt ?? '',
    })),
    tickets: (project.tickets ?? []).map((t) => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
    })),
  };

  return (
    <>
      <PageHead
        title={p.title}
        sub={`${p.code} · ${p.bu} · PM: ${p.pm}`}
        actions={
          <div className="row">
            <button className="secondary-button" onClick={() => navigate('/portfolio')}>
              <ArrowLeft size={14} /> Portfolio
            </button>
            <button className="primary-button" onClick={startEdit}>
              <Pencil size={14} /> Edit
            </button>
          </div>
        }
      />

      {/* Project meta strip */}
      <div className="surface" style={{ padding: 16, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div><div className="kpi-label">Status</div><StatusBadge status={p.status} /></div>
        <div><div className="kpi-label">Priority</div><Badge className={priorityBadge(p.priority)} dot={priorityDotColor(p.priority)}>{p.priority}</Badge></div>
        <div><div className="kpi-label">Budget</div><div className="mono" style={{ color: 'var(--text)' }}>{formatCurrency(p.budget)}</div></div>
        <div><div className="kpi-label">Score</div><div className="mono" style={{ color: 'var(--text)' }}>{p.score}</div></div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div className="kpi-label">Progress {p.progress}%</div>
          <div className="progress"><div className="progress-bar" style={{ width: `${p.progress}%` }} /></div>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <Panel title={`Edit ${p.title}`} sub="Update the project's status, priority, and core details.">
          <div className="grid-2">
            <Field label="Title">
              <input className="input-control" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <input className="input-control" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className="input-control" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ProjectStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{projectStatusLabel(s)}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="input-control" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as ProjectPriority })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Budget">
              <input className="input-control" type="number" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} />
            </Field>
            <Field label="Score">
              <input className="input-control" type="number" value={draft.score} onChange={(e) => setDraft({ ...draft, score: e.target.value })} />
            </Field>
            <Field label="Start date">
              <input className="input-control" type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </Field>
            <Field label="Target date">
              <input className="input-control" type="date" value={draft.targetDate} onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })} />
            </Field>
          </div>
          {editError && <div className="muted" style={{ color: '#ba3040', fontSize: 13, marginTop: 12 }}>{editError}</div>}
          <div className="row" style={{ marginTop: 16 }}>
            <button className="primary-button" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button className="secondary-button" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          </div>
        </Panel>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(({ key, label }) => (
          <button key={key} className="tab-link" data-active={tab === key} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid-2">
          <Panel title="Overview" sub={p.description}>
            <div className="stack">
              <div><span className="muted">Start date:</span> {formatDate(p.startDate)}</div>
              <div><span className="muted">Target date:</span> {formatDate(p.targetDate)}</div>
              <div><span className="muted">Requestor:</span> {p.requestor}</div>
              <div><span className="muted">Business unit:</span> {p.bu}</div>
            </div>
          </Panel>
          <Panel title="Recent Activity" sub="Latest updates on this project">
            <div className="stack" style={{ fontSize: 13 }}>
              <div><span className="mono" style={{ color: 'var(--accent)' }}>[[2h]]</span> · Deployment to UAT delivered (v2.4.1)</div>
              <div><span className="mono" style={{ color: 'var(--accent)' }}>[[1d]]</span> · P2 ticket assigned to M. Chen</div>
              <div><span className="mono" style={{ color: 'var(--accent)' }}>[[3d]]</span> · Requirement "Unified Case Inbox" marked done</div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'requirements' && (
        <Panel title="Requirements" actions={<button className="primary-button"><Plus size={14} /> Add Requirement</button>}>
          {p.requirements.length === 0 ? (
            <div className="ai-result-empty"><div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>No requirements yet. Use the AI Story Generator on the dashboard to add one.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Assignee</th></tr></thead>
                <tbody>
                  {p.requirements.map((r) => (
                    <tr key={r.id}>
                      <td className="cell-title">{r.title}</td>
                      <td><StatusBadge status={r.type} /></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{r.assignee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'sprints' && (
        <Panel title="Sprints" actions={<button className="primary-button"><Plus size={14} /> Add Sprint</button>}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Sprint</th><th>Dates</th><th>Status</th></tr></thead>
              <tbody>
                {p.sprints.map((s) => (
                  <tr key={s.name}>
                    <td className="cell-title">{s.name}</td>
                    <td className="mono">{s.dates}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'deployments' && (
        <Panel title="Deployments" actions={<button className="primary-button"><Plus size={14} /> New Deployment</button>}>
          <div className="ai-result" style={{ background: 'color-mix(in srgb, #a56c00 10%, transparent)', borderColor: '#a56c00', marginBottom: 16 }}>
            <strong>Soft reminder:</strong> Link this deployment to an approved Change Request before shipping to production. This is a visual reminder, not a hard block.
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Environment</th><th>Version</th><th>Status</th><th>Date</th><th>Change Link</th></tr></thead>
              <tbody>
                {p.deployments.map((d) => (
                  <tr key={d.version}>
                    <td className="cell-title">{d.env}</td>
                    <td className="mono">{d.version}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td className="mono">{d.date}</td>
                    <td>
                      <span className="cell-sub">
                        <span data-link={true} style={{ color: 'var(--accent)', cursor: 'pointer' }}>+ Link change (not set)</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'support' && (
        <Panel title="Support Tickets" actions={<button className="primary-button"><Plus size={14} /> New Ticket</button>}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ticket</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {p.tickets.map((t) => (
                  <tr key={t.title}>
                    <td className="cell-title">{t.title}</td>
                    <td><Badge className={ticketPriorityBadge(t.priority)} dot={ticketPriorityDotColor(t.priority)}>{t.priority.toUpperCase()}</Badge></td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'activity' && (
        <Panel title="Activity">
          <div className="stack" style={{ fontSize: 13 }}>
            <div><span className="mono" style={{ color: 'var(--accent)' }}>[[2h]]</span> · D. Okafor deployed v2.4.1 to UAT</div>
            <div><span className="mono" style={{ color: 'var(--accent)' }}>[[1d]]</span> · M. Chen commented on "Escalation Routing Rules"</div>
            <div><span className="mono" style={{ color: 'var(--accent)' }}>[[3d]]</span> · R. Singh moved "Self-Service KB Search" to In Progress</div>
            <div><span className="mono" style={{ color: 'var(--accent)' }}>[[5d]]</span> · Project status changed to In Progress</div>
          </div>
        </Panel>
      )}
    </>
  );
}
