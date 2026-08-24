import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { PageHead, Panel, Field, Badge } from '@/components/ui';
import { priorityBadge, priorityDotColor } from '@/lib/format';

const EFFORTS = ['XS', 'S', 'M', 'L', 'XL'];
const BUS = ['Finance', 'Operations', 'IT', 'HR', 'Legal', 'Marketing'];

// WSJF-inspired auto-score: (business value * reach) / effort.
function scoreRequest(value: number, effort: string, reach = 5): { score: number; priority: string; reasoning: string } {
  const eff = { XS: 1, S: 2, M: 3, L: 5, XL: 8 }[effort] ?? 3;
  const score = Math.round((value * reach) / eff);
  const priority = score >= 35 ? 'critical' : score >= 22 ? 'high' : score >= 12 ? 'medium' : 'low';
  const reasoning = `Score ${score} = (${value} value × ${reach} reach) ÷ ${eff} effort`;
  return { score, priority, reasoning };
}

export default function Intake() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', bu: BUS[0], description: '', value: 6, effort: 'M', budget: '' });
  const [enhanced, setEnhanced] = useState<null | { score: number; priority: string; reasoning: string; draft: string }>(null);

  const live = scoreRequest(form.value, form.effort);

  const enhance = () => {
    setEnhanced({
      ...scoreRequest(form.value, form.effort),
      draft: `Proposal: ${form.title || 'Untitled request'}\nEmpowers the ${form.bu} team to ${form.description || 'streamline their core workflow'}.\nEstimated effort: ${form.effort}. Recommended PM: based on similar initiatives in ${form.bu}.`,
    });
  };

  return (
    <>
      <PageHead title="New Request" sub="Submit a new initiative for intake and prioritization." />
      <div className="grid-2">
        <Panel title="Request Details">
          <div className="stack">
            <Field label="Title">
              <input className="input-control" placeholder="e.g. Vendor Invoice Flagging" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>

            <Field label="Business Unit">
              <select className="input-control" value={form.bu} onChange={(e) => setForm({ ...form, bu: e.target.value })}>
                {BUS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>

            <Field label="Description">
              <textarea className="ai-textarea" style={{ minHeight: 100 }} placeholder="Describe the problem or opportunity…"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>

            <div className="grid-2">
              <Field label={`Business Value (${form.value}/10)`}>
                <input type="range" min={1} max={10} value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="input-control" />
              </Field>
              <Field label="Effort (T-shirt)">
                <select className="input-control" value={form.effort} onChange={(e) => setForm({ ...form, effort: e.target.value })}>
                  {EFFORTS.map((e) => <option key={e}>{e}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Budget (optional)">
              <input className="input-control" type="number" placeholder="e.g. 250000" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </Field>

            <div className="row">
              <button className="primary-button" onClick={() => navigate('/portfolio')}>Submit Request</button>
              <button className="secondary-button" onClick={() => navigate('/portfolio')}>Cancel</button>
            </div>
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Live Score Preview">
            <div style={{ marginBottom: 12 }}>
              <div className="kpi-label">Auto-calculated score</div>
              <div className="kpi-value">{live.score}</div>
            </div>
            <div className="row" style={{ marginBottom: 12 }}>
              <Badge className={priorityBadge(live.priority as any)} dot={priorityDotColor(live.priority as any)}>{live.priority}</Badge>
              <span className="muted" style={{ fontSize: 12 }}>{live.reasoning}</span>
            </div>
            <div className="progress"><div className="progress-bar" style={{ width: `${Math.min(100, live.score)}%` }} /></div>
          </Panel>

          <Panel title="✨ Enhance with AI" sub="Draft a first-pass business case (Module A)" className="ai-panel"
            actions={<button className="secondary-button" onClick={enhance}><Sparkles size={14} /> Enhance</button>}>
            {enhanced ? (
              <div style={{ fontSize: 13 }}>
                <div className="story-block">
                  <div className="story-label">Suggested priority</div>
                  <Badge className={priorityBadge(enhanced.priority as any)} dot={priorityDotColor(enhanced.priority as any)}>{enhanced.priority}</Badge>
                </div>
                <div className="story-block">
                  <div className="story-label">Score breakdown</div>
                  <div className="story-text">{enhanced.reasoning}</div>
                </div>
                <div className="story-block">
                  <div className="story-label">Draft business case</div>
                  <div className="story-text" style={{ whiteSpace: 'pre-wrap' }}>{enhanced.draft}</div>
                </div>
                <div className="ai-reasoning">AI draft — human review required before submission.</div>
              </div>
            ) : (
              <div className="ai-result-empty" style={{ minHeight: 140 }}>
                <div>Click <strong>Enhance</strong> to draft a business case and auto-score the request.</div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
