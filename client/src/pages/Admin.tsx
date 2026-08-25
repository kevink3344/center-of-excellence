import { useEffect, useState } from 'react';
import { PageHead, Panel, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import {
  GENERATOR_AUTH_MODES,
  GENERATOR_DB_OPTIONS,
  DEFAULT_GENERATOR_SETTINGS,
  type GeneratorSettings,
  type GeneratorSettingsInput,
} from '@eidh/shared';

const USERS = [
  { name: 'Jane Chen', email: 'jane.chen@biz.com', role: 'executive' },
  { name: 'David Okafor', email: 'd.okafor@biz.com', role: 'pm' },
  { name: 'Luz Reyes', email: 'l.reyes@biz.com', role: 'pm' },
  { name: 'Sam Patel', email: 's.patel@biz.com', role: 'developer' },
  { name: 'Maya Torres', email: 'm.torres@biz.com', role: 'devops' },
];

const UNITS = ['Finance', 'Operations', 'IT', 'HR', 'Legal', 'Marketing'];

const AUTH_LABELS: Record<string, string> = {
  jwt: 'JWT (stateless tokens)',
  sso: 'SSO (M365/Entra)',
  jwt_sso: 'JWT + optional SSO',
};

const DB_LABELS: Record<string, string> = {
  turso: 'Turso (libSQL)',
  azure_sql: 'Azure SQL Server',
  postgres: 'PostgreSQL',
  sqlite: 'SQLite',
};

export default function Admin() {
  const [settings, setSettings] = useState<GeneratorSettings | null>(null);
  const [techStackInput, setTechStackInput] = useState('');
  const [authMode, setAuthMode] = useState<GeneratorSettings['authMode']>('jwt');
  const [defaultDatabase, setDefaultDatabase] = useState<GeneratorSettings['defaultDatabase']>('turso');
  const [productionDatabase, setProductionDatabase] = useState<GeneratorSettings['productionDatabase']>('azure_sql');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load existing generator settings.
  useEffect(() => {
    let active = true;
    api.getGeneratorSettings()
      .then(({ data }) => {
        if (!active) return;
        setSettings(data);
        setTechStackInput(data.techStack.join(', '));
        setAuthMode(data.authMode);
        setDefaultDatabase(data.defaultDatabase);
        setProductionDatabase(data.productionDatabase);
      })
      .catch(() => {
        // Fall back to defaults if not seeded / server unavailable.
        if (!active) return;
        const def = DEFAULT_GENERATOR_SETTINGS;
        setSettings(def);
        setTechStackInput(def.techStack.join(', '));
        setAuthMode(def.authMode);
        setDefaultDatabase(def.defaultDatabase);
        setProductionDatabase(def.productionDatabase);
        setError('Could not load saved settings — showing defaults.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (techStack.length === 0) {
      setError('Enter at least one technology in the stack.');
      setSaved(false);
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: GeneratorSettingsInput = { techStack, authMode, defaultDatabase, productionDatabase };
      const { data } = await api.updateGeneratorSettings(body);
      setSettings(data);
      setTechStackInput(data.techStack.join(', '));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead title="Admin" sub="Manage users, roles, and configuration." />
      <div className="grid-2">
        <Panel title="Users & Roles" sub="System-defined roles from spec §5">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>
                {USERS.map((u) => (
                  <tr key={u.email}>
                    <td className="cell-title">{u.name}</td>
                    <td className="mono">{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Business Units" sub="Enterprise units from spec §5">
          <div className="stack">
            {UNITS.map((u) => (
              <div className="surface-muted" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }} key={u}>
                <span className="cell-title">{u}</span>
                <StatusBadge status="active" />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Generator Defaults"
        sub="Default tech stack, auth, and database the Application Idea Generator uses (applies to both AI and the built-in designer)."
        actions={
          <button className="primary-button ai-gen" type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        }
      >
        <div className="stack" style={{ gap: 14 }}>
          {error && <div className="muted" style={{ color: 'var(--danger, #ef4444)' }}>{error}</div>}
          {saved && <div className="muted" style={{ color: 'var(--success, #22c55e)' }}>Saved — new designs will use these defaults.</div>}

          <div className="field">
            <label className="field-label">Technology stack (comma-separated)</label>
            <input
              className="input-control"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="Node.js (Express), React, Turso (libSQL), Docker"
            />
            <span className="muted" style={{ fontSize: 12 }}>The first two + the database line drive the generated stack.</span>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="field-label">Authentication mode</label>
              <select className="input-control" value={authMode} onChange={(e) => setAuthMode(e.target.value as GeneratorSettings['authMode'])}>
                {GENERATOR_AUTH_MODES.map((m) => (
                  <option key={m} value={m}>{AUTH_LABELS[m]}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Default database (development)</label>
              <select className="input-control" value={defaultDatabase} onChange={(e) => setDefaultDatabase(e.target.value as GeneratorSettings['defaultDatabase'])}>
                {GENERATOR_DB_OPTIONS.map((d) => (
                  <option key={d} value={d}>{DB_LABELS[d]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Production database</label>
            <select className="input-control" value={productionDatabase} onChange={(e) => setProductionDatabase(e.target.value as GeneratorSettings['productionDatabase'])}>
              {GENERATOR_DB_OPTIONS.map((d) => (
                <option key={d} value={d}>{DB_LABELS[d]}</option>
              ))}
            </select>
          </div>
        </div>
      </Panel>

      <Panel title="System Config" sub="Non-secret configuration (from server env)">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Key</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td className="mono">AI_PROVIDER</td><td className="mono">DeepSeek</td></tr>
              <tr><td className="mono">AI_MODEL</td><td className="mono">deepseek-v4-flash-vision-exp</td></tr>
              <tr><td className="mono">NODE_ENV</td><td className="mono">development</td></tr>
              <tr><td className="mono">PORT</td><td className="mono">4000</td></tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
