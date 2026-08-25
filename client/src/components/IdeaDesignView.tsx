// Renders the AppDesign artifact as readable, editable sections
// (docs/plans/app-idea.md §11.3). "Edit" toggles inline fields; "Save Draft"
// writes via the wizard / detail page. When `editing` is false, fields render
// read-only unless the caller supplies an `onToggleEdit`.
import { useState } from 'react';
import { Pencil, Check, Plus, Trash2 } from 'lucide-react';
import type { AppDesign } from '@eidh/shared';

export default function IdeaDesignView({
  design,
  loading,
  editing,
  onToggleEdit,
  onChange,
  saved,
}: {
  design: AppDesign | null;
  loading: boolean;
  editing: boolean;
  onToggleEdit?: () => void;
  onChange?: (d: AppDesign) => void;
  saved?: boolean;
}) {
  if (loading) {
    return (
      <div className="ai-result ai-result-loading">
        <span className="spinner" />Generating your design…
      </div>
    );
  }

  if (!design) {
    return (
      <div className="ai-result ai-result-empty">
        <div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
          Enter an idea, answer the 4 questions, and click <strong>Generate design</strong>.<br />
          The AI draft will appear here, ready to edit.
        </div>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
    color: 'var(--text-muted)', marginBottom: 6,
  };
  const inputStyle: React.CSSProperties = { width: '100%', marginBottom: 10 };

  const set = (patch: Partial<AppDesign>) => {
    if (onChange) onChange({ ...design, ...patch });
  };

  return (
    <div className="ai-result">
      <div className="ai-actions" style={{ marginBottom: 12 }}>
        {onToggleEdit && (
          <button className="secondary-button" type="button" onClick={onToggleEdit}>
            <Pencil size={14} /> {editing ? 'Done editing' : 'Edit'}
          </button>
        )}
        {saved && <span className="badge badge-green">✓ Saved</span>}
      </div>

      {/* Name */}
      <div className="story-block">
        <div className="story-label">Name</div>
        {editing ? (
          <input className="input-control" value={design.name} onChange={(e) => set({ name: e.target.value })} />
        ) : (
          <div className="story-text" style={{ fontSize: 18, fontWeight: 600 }}>{design.name}</div>
        )}
      </div>

      {/* Headline */}
      <div className="story-block">
        <div className="story-label">Headline</div>
        {editing ? (
          <input className="input-control" value={design.headline} onChange={(e) => set({ headline: e.target.value })} />
        ) : (
          <div className="story-text">{design.headline}</div>
        )}
      </div>

      {/* Summary */}
      <div className="story-block">
        <div className="story-label">Summary</div>
        {editing ? (
          <textarea className="ai-textarea" style={{ minHeight: 70 }} value={design.summary} onChange={(e) => set({ summary: e.target.value })} />
        ) : (
          <div className="story-text">{design.summary}</div>
        )}
      </div>

      {/* Architecture */}
      <div className="story-block">
        <div className="story-label">Architecture</div>
        {editing ? (
          <textarea className="ai-textarea" style={{ minHeight: 60 }} value={design.architecture} onChange={(e) => set({ architecture: e.target.value })} />
        ) : (
          <div className="story-text">{design.architecture}</div>
        )}
      </div>

      {/* Stack */}
      <div className="story-block">
        <div className="story-label">Technology stack</div>
        <ul className="story-acceptance">
          {design.stack.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      {/* Data model */}
      <div className="story-block">
        <div className="story-label">Core entities</div>
        <ul className="story-acceptance">
          {design.dataModel.coreEntities.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        {design.dataModel.relationships.length > 0 && (
          <>
            <div className="story-label" style={{ marginTop: 10 }}>Relationships</div>
            <ul className="story-acceptance">
              {design.dataModel.relationships.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Integrations */}
      <div className="story-block">
        <div className="story-label">Integrations</div>
        {design.integrations.length === 0 ? (
          <div className="story-text" style={{ color: 'var(--text-muted)' }}>None — standalone</div>
        ) : (
          <ul className="story-acceptance">
            {design.integrations.map((it, i) => (
              <li key={i}><strong>{it.name}</strong> — {it.purpose}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Security */}
      <div className="story-block">
        <div className="story-label">Security</div>
        <div className="story-text">Authn: <strong>{design.security.authentication}</strong></div>
        <div className="story-text">Authz: <strong>{design.security.authorization}</strong></div>
        <div className="story-text">Data: <strong>{design.security.dataProtection}</strong></div>
      </div>

      {/* Estimate */}
      <div className="story-block">
        <div className="story-label">Estimate</div>
        <div className="story-text">Effort: <strong>{design.estimate.effort}</strong> ({design.estimate.tShirt}) · {design.estimate.weeks} weeks</div>
        <div className="story-text">Team: {design.estimate.team.join(', ')}</div>
      </div>

      {/* Phases */}
      <div className="story-block">
        <div className="story-label">Delivery phases</div>
        <ul className="story-acceptance">
          {design.phases.map((p, i) => (
            <li key={i}><strong>{p.name}</strong> ({p.weeks} wk) — {p.focus}</li>
          ))}
        </ul>
      </div>

      {/* Risks */}
      <div className="story-block">
        <div className="story-label">Risks</div>
        <ul className="story-acceptance">
          {design.risks.map((r, i) => (
            <li key={i}><strong>{r.risk}</strong> — {r.mitigation}</li>
          ))}
        </ul>
      </div>

      {/* Ready stories */}
      <div className="story-block">
        <div className="story-label">Ready stories (on publish)</div>
        {design.readyStories.map((s, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div className="story-text" style={{ fontWeight: 600 }}>{s.title}</div>
            <div className="story-text">{s.story}</div>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      <div className="ai-reasoning">{design.reasoning}</div>
    </div>
  );
}
