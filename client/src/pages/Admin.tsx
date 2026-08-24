import { PageHead, Panel, StatusBadge } from '@/components/ui';

const USERS = [
  { name: 'Jane Chen', email: 'jane.chen@biz.com', role: 'executive' },
  { name: 'David Okafor', email: 'd.okafor@biz.com', role: 'pm' },
  { name: 'Luz Reyes', email: 'l.reyes@biz.com', role: 'pm' },
  { name: 'Sam Patel', email: 's.patel@biz.com', role: 'developer' },
  { name: 'Maya Torres', email: 'm.torres@biz.com', role: 'devops' },
];

const UNITS = ['Finance', 'Operations', 'IT', 'HR', 'Legal', 'Marketing'];

export default function Admin() {
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
