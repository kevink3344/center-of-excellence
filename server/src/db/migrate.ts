// Migration runner — applies drizzle-kit generated SQL files to Turso/libSQL.
// `drizzle-kit migrate` silently fails against some Turso setups; this runner
// reads the journal and executes each statement-breakpoint chunk directly.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { env } from '../config/env';

async function main() {
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  // Create the drizzle migrations bookkeeping table if absent.
  await client.execute(
    `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER
    )`,
  );

  const migrationsDir = path.resolve(__dirname, '../../drizzle');
  const journal = JSON.parse(
    readFileSync(path.join(migrationsDir, 'meta', '_journal.json'), 'utf8'),
  );
  const applied = new Set(
    (
      await client.execute(`SELECT hash FROM __drizzle_migrations`)
    ).rows.map((r) => r.hash as string),
  );

  for (const entry of journal.entries) {
    const file = path.join(migrationsDir, `${entry.tag}.sql`);
    const sql = readFileSync(file, 'utf8');
    const hash = entry.tag;
    if (applied.has(hash)) {
      console.log(`✔ Already applied: ${entry.tag}`);
      continue;
    }

    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`▶ Applying: ${entry.tag}`);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: `INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)`,
      args: [hash, Date.now()],
    });
    console.log(`✔ Applied: ${entry.tag}`);
  }

  console.log('✅ Migrations complete.');
  client.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
