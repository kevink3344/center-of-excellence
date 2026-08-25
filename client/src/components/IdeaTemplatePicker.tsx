// Idea template picker — rendered BELOW the Idea textarea. Lists previously
// saved drafts (from GET /api/v1/ideas?status=draft) as templates the user can
// seed the current idea from. Selecting one pre-fills the idea text (and, if
// available, the wizard answers + design) so the user can adapt rather than
// start from blank. A "None / Clear" option restores a blank input.
import { useEffect, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
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
    onSelect({
      ideaText: idea.ideaText || '',
      userClass: idea.userClass ?? undefined,
      appSize: idea.appSize ?? undefined,
      audience: idea.audience ?? undefined,
      connectivity: idea.connectivity ?? undefined,
      design: idea.design ?? undefined,
    });
  };

  return (
    <div className="ai-field-group" style={{ marginTop: 12 }}>
      <label className="ai-field-label" htmlFor="ideaTemplate">
        <LayoutTemplate size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
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
