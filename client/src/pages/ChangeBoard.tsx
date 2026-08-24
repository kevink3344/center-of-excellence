import { useEffect, useState, useCallback } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHead, Badge, Panel, Field } from '@/components/ui';
import {
  changeStatusLabel,
  changeStatusBadge,
  changePriorityBadge,
  changeTypeLabel,
} from '@/lib/format';
import { api } from '@/lib/api';
import type { ChangeRequestListItem } from '@/lib/api';

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'draft', label: 'Draft', color: '#94a3b8' },
  { key: 'pending_approval', label: 'Pending Approval', color: '#f8d36d' },
  { key: 'approved', label: 'Approved', color: '#96e0b0' },
  { key: 'scheduled', label: 'Scheduled', color: '#a9c9ff' },
  { key: 'in_implementation', label: 'In Impl.', color: '#5fa8ff' },
  { key: 'testing', label: 'Testing', color: '#c4b5fd' },
  { key: 'closed', label: 'Closed', color: '#7dd3a8' },
];

export default function ChangeBoard() {
  const navigate = useNavigate();
  const [changes, setChanges] = useState<ChangeRequestListItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.listChangeRequests()
      .then((r) => setChanges(r.data))
      .catch(() => setChanges([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = changes.filter((c) => ['draft', 'pending_approval', 'approved', 'scheduled', 'in_implementation', 'testing', 'closed'].includes(c.status));
  const rejected = changes.filter((c) => ['rejected', 'rolled_back', 'cancelled'].includes(c.status));

  return (
    <>
      <PageHead
        title="Change Management"
        sub="Request, approve, and schedule production changes (RFCs)."
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary-button" onClick={() => navigate('/change/calendar')}>
              <CalendarDays size={14} /> Calendar
            </button>
            <button className="primary-button" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> New Change
            </button>
          </div>
        }
      />

      <Panel title="Change Backlog" sub="Cards grouped by lifecycle state.">
        <div className="kanban" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {COLUMNS.map((col) => {
            const items = active.filter((c) => c.status === col.key);
            return (
              <div className="kanban-col" key={col.key}>
                <div className="kanban-head">
                  <span className="kanban-title"><span className="legend-dot" style={{ background: col.color }} />{col.label}</span>
                  <span className="kanban-count">{items.length}</span>
                </div>
                {items.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '10px 4px' }}>Empty</div>}
                {items.map((c) => (
                  <div className="kanban-card" key={c.id} onClick={() => navigate(`/change/${c.id}`)}>
                    <div className="cell-title" style={{ marginBottom: 2 }}>{c.title}</div>
                    <div className="cell-sub" style={{ marginBottom: 8 }}>
                      {changeTypeLabel(c.type)} · {c.project?.title ?? '—'}
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                      <Badge className={changePriorityBadge(c.priority)}>{c.priority}</Badge>
                      <Badge className={changeStatusBadge(c.status)}>{changeStatusLabel(c.status)}</Badge>
                    </div>
                    <div className="cell-sub">{c.requestedByUser?.name ?? '—'} · {c.category}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>

      {rejected.length > 0 && (
        <Panel title="Rejected / Rolled Back / Cancelled" sub="Terminal states for reference.">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Change</th><th>Type</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {rejected.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/change/${c.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="cell-title">{c.title}</div>
                      <div className="cell-sub">{c.id.toUpperCase()} · {c.project?.title ?? '—'}</div>
                    </td>
                    <td><Badge>{changeTypeLabel(c.type)}</Badge></td>
                    <td><Badge className={changePriorityBadge(c.priority)}>{c.priority}</Badge></td>
                    <td><Badge className={changeStatusBadge(c.status)}>{changeStatusLabel(c.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {showCreate && (
        <Panel title="New Change Request">
          <CreateChangeForm
            onCancel={() => setShowCreate(false)}
            onCreated={(cr) => { setShowCreate(false); navigate(`/change/${cr.id}`); }}
          />
        </Panel>
      )}
    </>
  );
}

function CreateChangeForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (cr: ChangeRequestListItem) => void }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'normal', category: 'application',
    priority: 'medium', risk: 'medium', reason: '', implementationPlan: '',
    rollbackPlan: '', testPlan: '', projectId: '',
  });
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listProjects().then((r) => setProjects(r.data.map((p) => ({ id: p.id, title: p.title })))).catch(() => {});
  }, []);

  const needsRollback = ['normal', 'major', 'emergency'].includes(form.type);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        category: form.category,
        priority: form.priority,
        risk: form.risk,
        reason: form.reason || undefined,
        implementationPlan: form.implementationPlan || undefined,
        testPlan: form.testPlan || undefined,
        projectId: form.projectId || undefined,
      };
      if (needsRollback) body.rollbackPlan = form.rollbackPlan;
      const r = await api.createChangeRequest(body as never);
      onCreated(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create change');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="stack">
        <div className="grid-2">
          <Field label="Title *">
            <input className="input-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Upgrade Postgres 16 → 17" />
          </Field>
          <Field label="Project">
            <select className="input-control" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">— None —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea className="ai-textarea" style={{ minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short summary of the change" />
        </Field>

        <div className="grid-2">
          <Field label="Type">
            <select className="input-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="standard">Standard</option>
              <option value="normal">Normal</option>
              <option value="major">Major</option>
              <option value="emergency">Emergency</option>
            </select>
          </Field>
          <Field label="Category">
            <select className="input-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="infrastructure">Infrastructure</option>
              <option value="application">Application</option>
              <option value="data">Data</option>
              <option value="security">Security</option>
              <option value="business">Business</option>
            </select>
          </Field>
          <Field label="Priority">
            <select className="input-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
          <Field label="Risk">
            <select className="input-control" value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>

        <div className="grid-2">
          <Field label="Reason">
            <textarea className="ai-textarea" style={{ minHeight: 60 }} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why is this change needed?" />
          </Field>
          <Field label="Implementation Plan">
            <textarea className="ai-textarea" style={{ minHeight: 60 }} value={form.implementationPlan} onChange={(e) => setForm({ ...form, implementationPlan: e.target.value })} placeholder="How will this be implemented?" />
          </Field>
        </div>

        <div className="grid-2">
          <Field label={`Rollback Plan${needsRollback ? ' *' : ''}`}>
            <textarea className="ai-textarea" style={{ minHeight: 60 }} value={form.rollbackPlan} onChange={(e) => setForm({ ...form, rollbackPlan: e.target.value })} placeholder="What is the rollback strategy?" />
          </Field>
          <Field label="Test Plan">
            <textarea className="ai-textarea" style={{ minHeight: 60 }} value={form.testPlan} onChange={(e) => setForm({ ...form, testPlan: e.target.value })} placeholder="How will this be validated?" />
          </Field>
        </div>

        {error && <div className="ai-reasoning" style={{ color: '#ba3040' }}>{error}</div>}

        <div className="row">
          <button className="primary-button" onClick={submit} disabled={saving || !form.title} type="button">
            {saving ? 'Saving…' : 'Create Change'}
          </button>
          <button className="secondary-button" onClick={onCancel} type="button">Cancel</button>
        </div>
      </div>
    </>
  );
}
