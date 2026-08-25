import { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { PageHead } from '@/components/ui';

// Interactive Swagger UI for the EIDH REST API.
// In dev it fetches the OpenAPI spec from the proxied server (`/api-docs.json`),
// falling back to a static copy if the server is unreachable.
export default function ApiDocs() {
  const [spec, setSpec] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch('/api-docs.json');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        if (active) setSpec(json);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load API spec.');
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHead
        title="API Reference"
        sub="Interactive Swagger UI — try out all EIDH REST CRUD + lifecycle endpoints."
      />
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="swagger-wrap">
          {error && (
            <div className="muted" style={{ padding: 16, color: 'var(--danger, #ef4444)' }}>
              Unable to load the API spec from the server — is it running? ({error})
            </div>
          )}
          {!spec && !error && <div className="muted" style={{ padding: 16 }}>Loading API reference…</div>}
          {spec ? <SwaggerUI spec={spec as Record<string, unknown>} /> : null}
        </div>
      </div>
    </>
  );
}
