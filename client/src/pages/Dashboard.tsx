import { useState, useEffect } from 'react';
import { Calendar, Download, Plus, Check, ArrowRight } from 'lucide-react';
import { PageHead, Panel, KpiCard, StatusBadge, Badge } from '@/components/ui';
import { formatCurrency, priorityBadge, priorityDotColor } from '@/lib/format';
import { generateStory as localGenerateStory, EXAMPLE_PROMPTS } from '@/lib/storyGenerator';
import { api } from '@/lib/api';
import type { ProjectListItem } from '@/lib/api';
import type { StoryDraft } from '@/lib/storyGenerator';

const STATUS_BARS = [
  { label: 'Intake', count: 5, color: '#94a3b8', height: 140 },
  { label: 'Scored', count: 4, color: '#94a3b8', height: 100 },
  { label: 'Approved', count: 3, color: '#a9c9ff', height: 70 },
  { label: 'In Prog.', count: 2, color: '#5fa8ff', height: 50 },
  { label: 'UAT', count: 4, color: '#5fa8ff', height: 110 },
  { label: 'Deployed', count: 3, color: '#1e8c52', height: 80 },
];

const BU_DONUT = [
  { label: 'Finance · 38%', color: '#0078d4', pct: 38 },
  { label: 'Operations · 26%', color: '#2d8cff', pct: 26 },
  { label: 'IT · 18%', color: '#1e8c52', pct: 18 },
  { label: 'HR · 11%', color: '#b35d19', pct: 11 },
  { label: 'Other · 7%', color: '#546274', pct: 7 },
];

const AT_RISK = [
  { title: 'Customer Care Portal', code: 'EIDH-1042', pm: 'D. Okafor', bu: 'Operations', priority: 'critical' as const, status: 'in_progress', budget: 620000, target: 'Aug 27, 2026', score: 88 },
  { title: 'Claims Automation', code: 'EIDH-0987', pm: 'L. Reyes', bu: 'Finance', priority: 'high' as const, status: 'uat', budget: 1150000, target: 'Aug 28, 2026', score: 92 },
  { title: 'Employee Onboarding', code: 'EIDH-1101', pm: 'S. Patel', bu: 'HR', priority: 'medium' as const, status: 'deployed', budget: 240000, target: 'Aug 30, 2026', score: 74 },
  { title: 'Vendor Risk Scoring', code: 'EIDH-1055', pm: 'M. Torres', bu: 'Finance', priority: 'critical' as const, status: 'approved', budget: 410000, target: 'Aug 29, 2026', score: 81 },
];

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<StoryDraft | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.listProjects()
      .then((r) => setProjects(r.data))
      .catch(() => setProjects([]));
  }, []);

  const generate = async (text?: string) => {
    const input = (text ?? prompt).trim() || 'As the finance team, we need a way to flag vendor invoices that fall outside our approved spend thresholds so we can stop overpayments before they are approved.';
    setLoading(true);
    setAccepted(false);
    setSaved(false);
    try {
      // Prefer the real AI service; fall back to the deterministic generator on failure.
      const { data } = await api.generateStory({ prompt: input });
      setDraft(data);
    } catch {
      setDraft(localGenerateStory(input));
    } finally {
      setLoading(false);
    }
  };

  const acceptDraft = async () => {
    if (!draft || !selectedProject) return;
    setSaving(true);
    try {
      await api.createRequirement(selectedProject, {
        title: draft.title,
        story: draft.story,
        type: 'user_story',
        acceptanceCriteria: draft.acceptance.join('\n'),
      });
      setAccepted(true);
      setSaved(true);
      setPrompt('');
      setDraft(null);
    } catch (err) {
      setAccepted(false);
      alert(err instanceof Error ? err.message : 'Failed to save requirement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        title="Executive Dashboard"
        sub="Portfolio health across all enterprise initiatives."
        actions={
          <>
            <span className="date-range"><Calendar size={15} /> Last 90 days</span>
            <button className="secondary-button"><Download size={14} /> Export</button>
            <button className="primary-button"><Plus size={14} /> New Request</button>
          </>
        }
      />

      {/* KPI CARDS */}
      <section className="kpi-grid" aria-label="Key metrics">
        <KpiCard
          label="Total Active Projects"
          value="24"
          trend="3 this quarter"
          up
          spark={<SparkLine points="0,26 18,22 36,28 54,18 72,20 90,12 108,14 120,8" />}
        />
        <KpiCard
          label="Budget Utilized"
          value="68%"
          trend="$2.4M of $3.5M"
          up
          spark={<div className="progress"><div className="progress-bar" style={{ width: '68%' }} /></div>}
        />
        <KpiCard
          label="Avg Delivery Time"
          value={<>42 <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>days</span></>}
          trend="5 days faster"
          up
          spark={<SparkLine points="0,22 18,24 36,20 54,22 72,18 90,16 108,14 120,12" />}
        />
        <KpiCard
          label="Open P1 Tickets"
          value="3"
          trend="2 SLA-breached"
          up={false}
          spark={<SparkLine points="0,12 18,14 36,10 54,16 72,14 90,20 108,22 120,26" />}
        />
      </section>

      {/* CHARTS */}
      <section className="charts-grid">
        <Panel title="Projects by Status" sub="Current portfolio distribution">
          <div className="legend" style={{ marginBottom: 12, justifyContent: 'flex-end' }}>
            <span><span className="legend-dot" style={{ background: '#5fa8ff' }} />Active</span>
            <span><span className="legend-dot" style={{ background: '#94a3b8' }} />Queued</span>
            <span><span className="legend-dot" style={{ background: '#1e8c52' }} />Deployed</span>
          </div>
          <svg className="barchart" viewBox="0 0 560 220" preserveAspectRatio="none">
            {[40, 90, 140, 190].map((y) => (
              <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--border)" strokeOpacity="0.4" />
            ))}
            {STATUS_BARS.map((b, i) => {
              const x = 30 + i * 80;
              return (
                <g key={b.label}>
                  <rect x={x} y={200 - b.height} width="44" height={b.height} rx="2" fill={b.color} />
                  <text x={x + 22} y={214} fill="var(--text-muted)" fontSize="12" textAnchor="middle">{b.label}</text>
                  <text x={x + 22} y={200 - b.height - 10} fill="var(--text)" fontFamily="var(--font-mono)" fontSize="12" textAnchor="middle">{b.count}</text>
                </g>
              );
            })}
          </svg>
        </Panel>

        <Panel title="Projects by Business Unit" sub="Allocation across the enterprise">
          <div className="donut-wrap">
            <div className="donut" style={{ background: `conic-gradient(${BU_DONUT.map((d, i) => {
              const start = BU_DONUT.slice(0, i).reduce((s, x) => s + x.pct, 0);
              return `${d.color} ${start}% ${start + d.pct}%`;
            }).join(', ')})` }}>
              <div className="donut-center">
                <div><b>21</b><span>Active</span></div>
              </div>
            </div>
            <div className="legend" style={{ flexDirection: 'column', gap: 10 }}>
              {BU_DONUT.map((d) => (
                <span key={d.label}><span className="legend-dot" style={{ background: d.color }} />{d.label}</span>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      {/* AT-RISK TABLE */}
      <Panel title="At-Risk Projects" sub="Target date within 7 days & not yet deployed"
        actions={<button className="secondary-button">View Portfolio <ArrowRight size={14} /></button>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th><th>Business Unit</th><th>Priority</th><th>Status</th>
                <th>Budget</th><th>Target Date</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {AT_RISK.map((p) => (
                <tr key={p.code}>
                  <td>
                    <div className="cell-title">{p.title}</div>
                    <div className="cell-sub">{p.code} · PM: {p.pm}</div>
                  </td>
                  <td>{p.bu}</td>
                  <td><Badge className={priorityBadge(p.priority)} dot={priorityDotColor(p.priority)}>{p.priority}</Badge></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="mono">{formatCurrency(p.budget)}</td>
                  <td className="mono">{p.target}</td>
                  <td className="mono">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* AI REQUIREMENTS & STORY GENERATOR */}
      <section className="panel ai-panel" aria-label="AI Requirements and Story Generator">
        <div className="panel-head">
          <div>
            <div className="panel-title">Requirements &amp; Story Generator</div>
            <div className="panel-sub">AI copilot — turn a description into a user story with acceptance criteria</div>
          </div>
          <span className="badge badge-blue">✨ Module B</span>
        </div>

        <div className="ai-generator-grid">
          <div>
            <label className="ai-field-label" htmlFor="storyInput">Describe the feature / request</label>
            <textarea
              id="storyInput" className="ai-textarea"
              placeholder="e.g. As the finance team, we need a way to flag vendor invoices that fall outside our approved spend thresholds so we can stop overpayments before they're approved..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="ai-examples">
              {EXAMPLE_PROMPTS.map((ex) => (
                <span key={ex.label} className="ai-example-chip" onClick={() => setPrompt(ex.text)}>✨ {ex.label}</span>
              ))}
            </div>
            <div className="ai-actions">
              <button className="primary-button ai-gen" type="button" onClick={() => generate()} disabled={loading}>
                ✨ Generate Story
              </button>
            </div>
          </div>

          <div>
            <div className="ai-result">
              {loading ? (
                <div className="ai-result-loading"><span className="spinner" />Generating story…</div>
              ) : !draft ? (
                <div className="ai-result-empty">
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
                    Enter a description and click <strong>Generate Story</strong>.<br />
                    The AI draft will appear here, ready to edit.
                  </div>
                </div>
              ) : (
                <div>
                  <div className="story-block">
                    <div className="story-label">Title</div>
                    <div className="story-text">{draft.title}</div>
                  </div>
                  <div className="story-block">
                    <div className="story-label">User Story</div>
                    <div className="story-text">{draft.story}</div>
                  </div>
                  <div className="story-block">
                    <div className="story-label">Acceptance Criteria</div>
                    <ul className="story-acceptance">
                      {draft.acceptance.map((c: string, i: number) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                  <div className="ai-reasoning">{draft.reasoning}</div>
                  <div className="ai-actions" style={{ marginTop: 14 }}>
                    <label className="ai-field-label" htmlFor="acceptProject">Save to project</label>
                    <select
                      id="acceptProject"
                      className="input-control"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      <option value="">Select a project…</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <button className="primary-button" onClick={acceptDraft} disabled={accepted || saving || !draft || !selectedProject}>
                      <Check size={14} /> {saving ? 'Saving…' : accepted ? 'Saved' : 'Accept & Save Draft'}
                    </button>
                    <button className="secondary-button" onClick={() => setPrompt(draft.story)}>Fill Input</button>
                    <button className="secondary-button" onClick={() => generate()}>Regenerate</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SparkLine({ points }: { points: string }) {
  return (
    <svg viewBox="0 0 120 34" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={points} />
    </svg>
  );
}
