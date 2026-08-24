import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageHead, Panel, Badge, Field } from '@/components/ui';
import {
  formatDate,
  changeStatusLabel,
  changeStatusBadge,
  changePriorityBadge,
  changeRiskBadge,
  changeTypeLabel,
} from '@/lib/format';
import { api } from '@/lib/api';
import type { ChangeRequest, ChangeTask } from '@/lib/api';

type Tab = 'summary' | 'approvals' | 'tasks' | 'timeline';

const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'timeline', label: 'Timeline' },
];

const DECISION_CLASS: Record<string, string> = {
  pending: 'badge-slate',
  approved: 'badge-green',
  rejected: 'badge-red',
  changes_requested: 'badge-amber',
};

export default function ChangeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('summary');
  const [change, setChange] = useState<ChangeRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setError(null);
    api.getChangeRequest(id)
      .then((r) => setChange(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load change'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <>
        <PageHead
          title="Change not found"
          sub="This change doesn't exist or you don't have access."
          actions={
            <button className="secondary-button" onClick={() => navigate('/change')}>
              <ArrowLeft size={14} /> Back to Change Board
            </button>
          }
        />
        <Panel title="Oops">
          <div className="ai-result-empty">
            <div><div style={{ fontSize: 28, marginBottom: 8 }}>🔎</div>{error}<br />Try selecting a change from the board instead.</div>
          </div>
        </Panel>
      </>
    );
  }

  if (!change) {
    return <div className="ai-result-loading"><span className="spinner" /> Loading change…</div>;
  }

  const c = change;
  const approvals = c.approvals ?? [];
  const tasks = c.tasks ?? [];
  const resolvedApprovals = approvals.filter((a) => a.decision !== 'pending');
  const totalApprovals = Math.max(approvals.length, 1);
  const approvedCount = resolvedApprovals.filter((a) => a.decision === 'approved').length;

  return (
    <>
      <PageHead
        title={c.title}
        sub={`${c.id.toUpperCase()} · ${changeTypeLabel(c.type)} · ${c.category} · Requested by ${c.requestedByUser?.name ?? '—'}`}
        actions={
          <button className="secondary-button" onClick={() => navigate('/change')}>
            <ArrowLeft size={14} /> Back
          </button>
        }
      />

      {/* Meta strip */}
      <div className="surface" style={{ padding: 16, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div><div className="kpi-label">Status</div><Badge className={changeStatusBadge(c.status)}>{changeStatusLabel(c.status)}</Badge></div>
        <div><div className="kpi-label">Priority</div><Badge className={changePriorityBadge(c.priority)}>{c.priority}</Badge></div>
        <div><div className="kpi-label">Risk</div><Badge className={changeRiskBadge(c.risk)}>{c.risk}</Badge></div>
        <div><div className="kpi-label">Project</div><span className="cell-title" style={{ fontSize: 13 }}>{c.project?.title ?? '—'}</span></div>
        <div><div className="kpi-label">Service Owner</div><span style={{ fontSize: 13 }}>{c.serviceOwnerUser?.name ?? '—'}</span></div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div className="kpi-label">Approvals {approvedCount}/{totalApprovals}</div>
          <div className="progress"><div className="progress-bar" style={{ width: `${(approvedCount / totalApprovals) * 100}%` }} /></div>
        </div>
      </div>

      {/* Lifecycle action buttons */}
      {c.status === 'draft' && (
        <div className="row">
          <button className="primary-button" disabled={busy} onClick={() => act(() => api.submitChange(c.id))}>Submit for Approval</button>
          <button className="secondary-button" disabled={busy} onClick={() => act(() => api.cancelChange(c.id))}>Cancel</button>
        </div>
      )}
      {c.status === 'pending_approval' && (
        <Panel title="Approve / Reject" sub="Post a decision for this change.">
          <ApproveForm c={c} onDone={() => { load(); }} />
        </Panel>
      )}
      {c.status === 'approved' && (
        <div className="row">
          <button className="primary-button" disabled={busy} onClick={() => act(() => api.scheduleChange(c.id, { plannedStartAt: defaultWindow().start, plannedEndAt: defaultWindow().end }))}>Schedule</button>
          <button className="secondary-button" disabled={busy} onClick={() => act(() => api.cancelChange(c.id))}>Cancel</button>
        </div>
      )}
      {c.status === 'scheduled' && (
        <div className="row">
          <button className="primary-button" disabled={busy} onClick={() => act(() => api.implementChange(c.id))}>Implement</button>
          <button className="secondary-button" disabled={busy} onClick={() => act(() => api.cancelChange(c.id))}>Cancel</button>
        </div>
      )}
      {c.status === 'in_implementation' && (
        <div className="row">
          <button className="primary-button" disabled={busy} onClick={() => act(() => api.completeChange(c.id))}>Complete</button>
          <button className="secondary-button" disabled={busy} onClick={() => act(() => api.rollbackChange(c.id))}>Rollback</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(({ key, label }) => (
          <button key={key} className="tab-link" data-active={tab === key} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="grid-2">
          <Panel title="Details">
            <div className="stack">
              {c.description && <div><span className="muted">Description:</span><br />{c.description}</div>}
              {c.reason && <div><span className="muted">Reason:</span><br />{c.reason}</div>}
              {c.implementationPlan && <div><span className="muted">Implementation plan:</span><br />{c.implementationPlan}</div>}
              {c.rollbackPlan && <div><span className="muted">Rollback plan:</span><br />{c.rollbackPlan}</div>}
              {c.testPlan && <div><span className="muted">Test plan:</span><br />{c.testPlan}</div>}
            </div>
          </Panel>
          <Panel title="Schedule">
            <div className="stack">
              <div><span className="muted">Planned start:</span> {formatDate(c.plannedStartAt)}</div>
              <div><span className="muted">Planned end:</span> {formatDate(c.plannedEndAt)}</div>
              <div><span className="muted">Actual start:</span> {formatDate(c.actualStartAt)}</div>
              <div><span className="muted">Actual end:</span> {formatDate(c.actualEndAt)}</div>
              <div><span className="muted">Implemented:</span> {formatDate(c.implementedAt)}</div>
              <div><span className="muted">Created:</span> {formatDate(c.createdAt)}</div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'approvals' && (
        <Panel title="Approvals" sub="CAB review trail.">
          {approvals.length === 0 ? (
            <div className="ai-result-empty"><div style={{ fontSize: 28, marginBottom: 8 }}>🛡️</div>No approvals yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Approver</th><th>Stage</th><th>Role</th><th>Decision</th><th>Comment</th><th>Decided</th></tr></thead>
                <tbody>
                  {approvals.map((a) => (
                    <tr key={a.id}>
                      <td className="cell-title">{a.approver?.name ?? '—'}</td>
                      <td className="mono">{a.stage}</td>
                      <td>{a.roleLabel ?? '—'}</td>
                      <td><Badge className={DECISION_CLASS[a.decision] ?? 'badge-slate'}>{a.decision.replace('_', ' ')}</Badge></td>
                      <td>{a.comment ?? '—'}</td>
                      <td className="mono">{formatDate(a.decidedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'tasks' && (
        <Panel title="Tasks" actions={<AddTaskForm c={c} onDone={() => load()} />}>
          {tasks.length === 0 ? (
            <div className="ai-result-empty"><div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>No tasks yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Status</th><th>Assignee</th></tr></thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="cell-title">{t.title}</td>
                      <td><Badge className={TASK_STATUS_CLASS[t.status] ?? 'badge-slate'}>{t.status.replace('_', ' ')}</Badge></td>
                      <td>{t.assignee?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'timeline' && (
        <Panel title="Timeline">
          <div className="stack" style={{ fontSize: 13 }}>
            <div><span className="mono" style={{ color: 'var(--accent)' }}>[[created]]</span> · Created by {c.requestedByUser?.name ?? '—'}</div>
            {resolvedApprovals.map((a) => (
              <div key={a.id}><span className="mono" style={{ color: 'var(--accent)' }}>[[{formatDate(a.decidedAt)}]]</span> · {a.approver?.name ?? '—'} {a.decision.replace('_', ' ')}</div>
            ))}
            {c.implementedAt && <div><span className="mono" style={{ color: 'var(--accent)' }}>[[closed]]</span> · Change completed</div>}
          </div>
        </Panel>
      )}
    </>
  );
}

const TASK_STATUS_CLASS: Record<string, string> = {
  todo: 'badge-slate',
  in_progress: 'badge-amber',
  done: 'badge-green',
};

function defaultWindow() {
  const start = new Date(Date.now() + 24 * 3600000);
  const end = new Date(start.getTime() + 3 * 3600000);
  return { start: toIso(start), end: toIso(end) };
}

function toIso(d: Date) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function ApproveForm({ c, onDone }: { c: ChangeRequest; onDone: () => void }) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'changes_requested'>('approved');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      await api.addApproval(c.id, { decision, comment: comment || undefined });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to submit approval');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid-2" style={{ alignItems: 'end' }}>
      <Field label="Decision">
        <select className="input-control" value={decision} onChange={(e) => setDecision(e.target.value as never)}>
          <option value="approved">Approve</option>
          <option value="changes_requested">Changes requested</option>
          <option value="rejected">Reject</option>
        </select>
      </Field>
      <Field label="Comment (optional)">
        <input className="input-control" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Approved — rollback plan looks solid" />
      </Field>
      <div style={{ gridColumn: '1 / -1' }}>
        {err && <div className="ai-reasoning" style={{ color: '#ba3040', marginBottom: 8 }}>{err}</div>}
        <button className="primary-button" onClick={submit} disabled={busy} type="button">
          {busy ? 'Submitting…' : 'Submit Decision'}
        </button>
      </div>
    </div>
  );
}

function AddTaskForm({ c, onDone }: { c: ChangeRequest; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!title) return;
    setBusy(true);
    setErr(null);
    try {
      await api.addChangeTask(c.id, { title });
      setTitle('');
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add task');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row">
      <input
        className="input-control"
        style={{ width: 240 }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add task title…"
      />
      <button className="secondary-button" onClick={submit} disabled={busy || !title} type="button">
        {busy ? 'Adding…' : <Plus size={14} />} Add
      </button>
    </div>
  );
}
