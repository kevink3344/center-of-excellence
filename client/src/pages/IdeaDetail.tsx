// /ideas/:id — open a saved Draft, edit the design, then Publish (→ project).
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Save, Pencil, Trash2 } from 'lucide-react';
import { PageHead, Panel } from '@/components/ui';
import IdeaDesignView from '@/components/IdeaDesignView';
import { api } from '@/lib/api';
import type { Idea } from '@/lib/api';
import type { AppDesign, ProjectPriority, PublishIdeaInput } from '@eidh/shared';

// Safe parse of the design column (server stores it as a JSON string in rows).
function parseDesign(raw: unknown): AppDesign | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as AppDesign;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as AppDesign;
    } catch {
      return null;
    }
  }
  return null;
}

const PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high', 'critical'];

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [design, setDesign] = useState<AppDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Publish form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getIdea(id)
      .then((r) => {
        setIdea(r.data);
        setDesign(parseDesign(r.data.design));
        // Pre-fill publish form.
        setTitle(r.data.title || '');
        setDescription(parseDesign(r.data.design)?.summary || '');
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load idea'))
      .finally(() => setLoading(false));
  }, [id]);

  const saveDraft = async () => {
    if (!idea || !design) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const { data } = await api.updateIdea(idea.id, { design });
      setIdea(data);
      setDesign(parseDesign(data.design));
      setEditing(false);
      setMsg('Draft saved.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!idea) return;
    setPublishing(true);
    setErr(null);
    setMsg(null);
    const body: PublishIdeaInput = {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      priority,
      budget: budget ? Number(budget) : undefined,
    };
    try {
      const { data } = await api.publishIdea(idea.id, body);
      setMsg(`Published as project "${data.project?.title}"`);
      setIdea(data.idea);
      setDesign(parseDesign(data.idea.design));
      setTimeout(() => navigate(`/projects/${data.project?.id}`), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const archive = async () => {
    if (!idea || !confirm('Archive this idea?')) return;
    await api.deleteIdea(idea.id);
    navigate('/ideas');
  };

  if (loading) {
    return <div className="ai-result-loading" style={{ padding: 40 }}><span className="spinner" />Loading…</div>;
  }
  if (!idea || !design) {
    return <div className="panel"><div className="ai-result-empty" style={{ padding: 40 }}>Idea not found.</div></div>;
  }

  return (
    <>
      <PageHead
        title={idea.title || 'Idea Draft'}
        sub="Edit the design below, then publish to create a governed EIDH project."
        actions={
          <div className="row">
            <button className="secondary-button" onClick={() => navigate('/ideas')} type="button">
              <ArrowLeft size={14} /> Back
            </button>
            <button className="icon-clear" onClick={archive} title="Archive" type="button">
              <Trash2 size={15} />
            </button>
          </div>
        }
      />

      <div className="stack">
        <Panel
          title="Design"
          sub={idea.status === 'published' ? 'Published baseline — immutable' : 'Editable draft'}
          actions={
            idea.status !== 'published' ? (
              <div className="row">
                <button className="secondary-button" onClick={() => setEditing((v) => !v)} type="button">
                  <Pencil size={14} /> {editing ? 'Done editing' : 'Edit'}
                </button>
                {editing && (
                  <button className="secondary-button" onClick={saveDraft} disabled={saving} type="button">
                    <Save size={14} /> {saving ? 'Saving…' : 'Save draft'}
                  </button>
                )}
              </div>
            ) : (
              <span className="badge badge-green">Published</span>
            )
          }
        >
          <IdeaDesignView design={design} loading={false} editing={editing} onChange={setDesign} />
        </Panel>

        {idea.status !== 'published' && (
          <Panel title="Publish to Project" sub="Creates an EIDH project (+ seeded requirements from readyStories)">
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Project title</label>
                <input className="input-control" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Priority</label>
                <select className="input-control" value={priority} onChange={(e) => setPriority(e.target.value as ProjectPriority)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Budget (optional)</label>
                <input className="input-control" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 250000" />
              </div>
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label className="field-label">Description</label>
              <textarea className="ai-textarea" style={{ minHeight: 80 }} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="ai-actions" style={{ marginTop: 14 }}>
              <button className="primary-button" onClick={publish} disabled={publishing} type="button">
                <Rocket size={14} /> {publishing ? 'Publishing…' : 'Publish to Project'}
              </button>
            </div>
          </Panel>
        )}

        {msg && <div className="ai-reasoning" style={{ borderLeftColor: 'var(--success, #1e8c52)' }}>{msg}</div>}
        {err && <div className="ai-reasoning">{err}</div>}
      </div>
    </>
  );
}
