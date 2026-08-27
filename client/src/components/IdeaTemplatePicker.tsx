// Idea template picker — rendered BELOW the Idea textarea. Lists previously
// saved drafts (from GET /api/v1/ideas?status=draft) as templates the user can
// seed the current idea from. Selecting one pre-fills the idea text (and, if
// available, the wizard answers + design) so the user can adapt rather than
// start from blank. A "None / Clear" option restores a blank input.
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Idea } from '@/lib/api';

export interface TemplateSeed {
  ideaText: string;
  userClass?: string;
  appSize?: string;
  audience?: string;
  connectivity?: boolean;
  design?: unknown;
}

export default function IdeaTemplatePicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (seed: TemplateSeed | null) => void;
}) {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    let active = true;
    api.listIdeas({ status: 'draft' })
      .then((r) => {
        if (active) setIdeas(r.data);
      })
      .catch(() => {
        if (active) setIdeas([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (id: string) => {
    if (!id) {
      onSelect(null);
      return;
    }
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;

    // The server stores `design` as a JSON string (JSON.stringify in the
    // controller). Parse it back to an object so IdeaDesignView can render it.
    let design: unknown = undefined;
    if (idea.design) {
      try {
        design = typeof idea.design === 'string' ? JSON.parse(idea.design) : idea.design;
      } catch {
        design = undefined;
      }
    }

    onSelect({
      ideaText: idea.ideaText || '',
      userClass: idea.userClass ?? undefined,
      appSize: idea.appSize ?? undefined,
      audience: idea.audience ?? undefined,
      connectivity: idea.connectivity ?? undefined,
      design,
    });
  };

  return (
    <div className="ai-field-group" style={{ marginTop: 12 }}>
      <label className="ai-field-label" htmlFor="ideaTemplate">
        Start from a template (a saved idea)
      </label>
      <select id="ideaTemplate" className="input-control" value={value} onChange={(e) => handleChange(e.target.value)}>
        <option value="">None / Clear</option>
        {ideas.map((i) => (
          <option key={i.id} value={i.id}>
            {i.title}
          </option>
        ))}
      </select>
    </div>
  );
}
