import { defineConfig } from 'drizzle-kit';
import path from 'node:path';
import dotenv from 'dotenv';

// Load the monorepo-root `.env` (workspace scripts run with cwd = `server/`).
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  verbose: true,
  strict: true,
});
