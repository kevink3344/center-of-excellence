// Draft list (docs/plans/app-idea.md §11.4) — table/cards of saved ideas.
// Filter by status; empty state CTA → start a new idea.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Idea } from '@/lib/api';
import { formatDate } from '@/lib/format';

const STATUS_FILTERS = [
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
  { value: '', label: 'All' },
];

export default function IdeaDraftList({ onNew }: { onNew?: () => void }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listIdeas(status ? { status } : undefined)
      .then((r) => setIdeas(r.data))
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const archive = async (id: string) => {
    if (!confirm('Archive this idea?')) return;
    await api.deleteIdea(id);
    load();
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">Saved Application Ideas</div>
          <div className="panel-sub">Drafts you can edit and publish</div>
        </div>
        <div className="row">
          <div className="status-filter">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`filter-chip ${status === f.value ? 'active' : ''}`}
                onClick={() => setStatus(f.value)}
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>
          {onNew && (
            <button className="primary-button" onClick={onNew} type="button">
              <Plus size={14} /> New idea
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="ai-result-loading" style={{ padding: 40 }}>
          <span className="spinner" />Loading ideas…
        </div>
      ) : ideas.length === 0 ? (
        <div className="ai-result-empty" style={{ padding: 40 }}>
          <div>
            <div style={{ fontSize: 26, marginBottom: 6 }}>💡</div>
            No ideas {status ? `in "${status}"` : 'yet'}.
            <br />
            <button className="link-button" onClick={onNew} style={{ marginTop: 8 }} type="button">
              Generate your first application idea →
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Model</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ideas.map((idea) => (
                <tr key={idea.id}>
                  <td>
                    <Link to={`/ideas/${idea.id}`} className="cell-title">
                      {idea.title}
                    </Link>
                    <div className="cell-sub">{idea.audience} · {idea.appSize} · {idea.connectivity ? 'integrated' : 'standalone'}</div>
                  </td>
                  <td><span className={`badge ${badgeClass(idea.status)}`}>{idea.status}</span></td>
                  <td className="mono">{idea.model || '—'}</td>
                  <td className="mono">{formatDate(idea.updatedAt)}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <Link className="icon-clear" to={`/ideas/${idea.id}`} title="Open">
                        <FileText size={15} />
                      </Link>
                      <button className="icon-clear" onClick={() => archive(idea.id)} title="Archive" type="button">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function badgeClass(status: string): string {
  if (status === 'published') return 'badge-green';
  if (status === 'archived') return '';
  return 'badge-blue';
}
