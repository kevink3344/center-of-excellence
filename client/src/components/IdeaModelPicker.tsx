// AI model picker — rendered ABOVE the Idea textarea. Lists the selectable
// AI models from the server catalog (GET /api/v1/ai/models), which is derived
// from `AI_MODELS` in `.env`. The chosen model is sent with the generate
// request and persisted on the draft for audit.
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ModelInfo } from '@/lib/api';

export default function IdeaModelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (model: string) => void;
}) {
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    let active = true;
    api.getAiModels()
      .then((r) => {
        if (!active) return;
        setModels(r.data.models);
        // Default to the server default on first load if none selected.
        if (!value && r.data.default) onChange(r.data.default);
      })
      .catch(() => {
        if (active) setModels([]);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (models.length === 0) {
    return (
      <div className="ai-field-group">
        <label className="ai-field-label" htmlFor="ideaModel">AI model</label>
        <select id="ideaModel" className="input-control" disabled>
          <option>Loading models…</option>
        </select>
      </div>
    );
  }

  return (
    <div className="ai-field-group">
      <label className="ai-field-label" htmlFor="ideaModel">
        AI model
      </label>
      <select
        id="ideaModel"
        className="input-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label && m.label !== m.id ? `${m.label} (${m.provider})` : `${m.id} (${m.provider})`}
          </option>
        ))}
      </select>
    </div>
  );
}
