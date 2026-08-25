// The Idea → Draft wizard (docs/plans/app-idea.md §4). Single page stepper:
//   [Model ▾]  ← above the Idea textarea (IdeaModelPicker)
//   [1. Idea]  ← free text + [Template ▾] below (IdeaTemplatePicker)
//   → [2. Wizard (4 Qs)] → [3. Generate] → [4. Design] → [5. Save Draft]
// Falls back to the deterministic engine (client/src/lib/ideaGenerator.ts) when
// the AI service is unavailable.
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Save, RefreshCw, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import type { Idea } from '@/lib/api';
import type { AppDesign, AppIdeaAnswers, GeneratorSettings } from '@eidh/shared';
import { generateDesign as localGenerate, EXAMPLE_IDEAS } from '@/lib/ideaGenerator';
import IdeaModelPicker from '@/components/IdeaModelPicker';
import IdeaTemplatePicker, { type TemplateSeed } from '@/components/IdeaTemplatePicker';
import IdeaDesignView from '@/components/IdeaDesignView';

type UserClass = AppIdeaAnswers['userClass'];
type AppSize = AppIdeaAnswers['appSize'];
type Audience = AppIdeaAnswers['audience'];

export interface WizardSaveResult {
  idea: Idea;
  navigateTo?: string;
}

export default function IdeaWizard({
  onSaved,
  onPublish,
}: {
  onSaved?: (idea: Idea) => void;
  onPublish?: (idea: Idea) => void;
}) {
  // Step 1 — idea + model + template
  const [ideaText, setIdeaText] = useState('');
  const [model, setModel] = useState('');
  const [templateId, setTemplateId] = useState('');

  // Step 2 — four answers
  const [userClass, setUserClass] = useState<UserClass>('small_team');
  const [appSize, setAppSize] = useState<AppSize>('medium');
  const [audience, setAudience] = useState<Audience>('internal');
  const [connectivity, setConnectivity] = useState(false);

  // Step 3/4 — generated design
  const [design, setDesign] = useState<AppDesign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Step 5 — save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Generator defaults (admin-configurable); used by the deterministic fallback.
  const [settings, setSettings] = useState<GeneratorSettings | null>(null);

  useEffect(() => {
    let active = true;
    api.getGeneratorSettings()
      .then(({ data }) => { if (active) setSettings(data); })
      .catch(() => { /* ignore — fallback uses hard-coded defaults */ });
    return () => { active = false; };
  }, []);

  const applyTemplate = useCallback((seed: TemplateSeed | null) => {
    if (!seed) {
      setTemplateId('');
      return;
    }
    if (seed.ideaText) setIdeaText(seed.ideaText);
    if (seed.userClass) setUserClass(seed.userClass as UserClass);
    if (seed.appSize) setAppSize(seed.appSize as AppSize);
    if (seed.audience) setAudience(seed.audience as Audience);
    if (typeof seed.connectivity === 'boolean') setConnectivity(seed.connectivity);
    if (seed.design) setDesign(seed.design as AppDesign);
  }, []);

  const answers: AppIdeaAnswers = { userClass, appSize, audience, connectivity, model, templateId, ideaText };

  const generate = async () => {
    const text = ideaText.trim();
    if (!text) {
      setError('Enter an idea first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    setEditing(false);
    try {
      const { data } = await api.generateIdea({ userClass, appSize, audience, connectivity, model, ideaText: text });
      setDesign(data);
      setUsedModel(model || 'default');
    } catch (err) {
      // Fall back to the deterministic engine (settings-aware).
      setDesign(localGenerate(text, { userClass, appSize, audience, connectivity }, settings ?? undefined));
      setUsedModel(model || 'deterministic');
      setError(err instanceof Error ? `AI unavailable — used the built-in design. ${err.message}` : 'AI unavailable — used the built-in design.');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!design) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.createIdea({
        title: design.name,
        ideaText,
        model: usedModel || undefined,
        userClass,
        appSize,
        audience,
        connectivity,
        design,
      });
      setSaved(true);
      if (onSaved) onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setDesign(null);
    setSaved(false);
    setEditing(false);
    setError(null);
    setDesign(null);
  };

  return (
    <section className="panel ai-panel" aria-label="Application Idea Generator">
      <div className="panel-head">
        <div>
          <div className="panel-title">Application Idea Generator</div>
          <div className="panel-sub">A guided wizard — idea → four signals → draft design</div>
        </div>
        <span className="badge badge-blue">✨ AI copilot</span>
      </div>

      <div className="ai-generator-grid">
        {/* LEFT — inputs */}
        <div>
          {/* Model picker — above the Idea textarea */}
          <IdeaModelPicker value={model} onChange={setModel} />

          {/* Idea textarea */}
          <label className="ai-field-label" style={{ marginTop: 16 }} htmlFor="ideaInput">
            Describe your application idea
          </label>
          <textarea
            id="ideaInput"
            className="ai-textarea"
            placeholder="e.g. An internal app where vendors submit and track invoices."
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
          />

          <div className="ai-examples">
            {EXAMPLE_IDEAS.map((ex) => (
              <span key={ex.id} className="ai-example-chip" onClick={() => setIdeaText(ex.ideaText)}>
                ✨ {ex.title}
              </span>
            ))}
          </div>

          {/* Template picker — below the Idea textarea */}
          <IdeaTemplatePicker value={templateId} onSelect={applyTemplate} />

          {/* Step 2 — four questions */}
          <div className="wizard-steps" style={{ marginTop: 18 }}>
            <div className="wizard-step">
              <label className="ai-field-label" htmlFor="userClass">1. How many users?</label>
              <select id="userClass" className="input-control" value={userClass} onChange={(e) => setUserClass(e.target.value as UserClass)}>
                <option value="personal">Under 10 (personal)</option>
                <option value="small_team">10–50 (team)</option>
                <option value="department">50–200 (department)</option>
                <option value="enterprise">200+ (enterprise)</option>
              </select>
            </div>
            <div className="wizard-step">
              <label className="ai-field-label" htmlFor="appSize">2. Large or small application?</label>
              <select id="appSize" className="input-control" value={appSize} onChange={(e) => setAppSize(e.target.value as AppSize)}>
                <option value="small">Small (single purpose)</option>
                <option value="medium">Medium (multi-module)</option>
                <option value="large">Large (enterprise platform)</option>
              </select>
            </div>
            <div className="wizard-step">
              <label className="ai-field-label" htmlFor="audience">3. Internal or external?</label>
              <select id="audience" className="input-control" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                <option value="internal">Internal (employees only)</option>
                <option value="external">External (customers/partners/public)</option>
              </select>
            </div>
            <div className="wizard-step">
              <label className="ai-field-label" htmlFor="connectivity">4. Connect to other systems?</label>
              <select id="connectivity" className="input-control" value={connectivity ? 'yes' : 'no'} onChange={(e) => setConnectivity(e.target.value === 'yes')}>
                <option value="no">No (standalone)</option>
                <option value="yes">Yes (integrates with other apps)</option>
              </select>
            </div>
          </div>

          <div className="ai-actions" style={{ marginTop: 16 }}>
            <button className="primary-button ai-gen" type="button" onClick={generate} disabled={loading || !ideaText.trim()}>
              <Sparkles size={14} /> {loading ? 'Generating…' : design ? 'Regenerate' : 'Generate design'}
            </button>
            {design && !saved && (
              <button className="secondary-button" type="button" onClick={saveDraft} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save draft'}
              </button>
            )}
            {design && (
              <button className="secondary-button" type="button" onClick={resetAll}>
                <RefreshCw size={14} /> Start over
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — design view */}
        <div>
          <IdeaDesignView
            design={design}
            loading={loading}
            editing={editing}
            onToggleEdit={() => setEditing((v) => !v)}
            onChange={setDesign}
            saved={saved}
          />
          {error && <div className="ai-reasoning" style={{ marginTop: 10 }}>{error}</div>}
        </div>
      </div>
    </section>
  );
}
