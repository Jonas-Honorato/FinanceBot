import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const isPglite = env.dbProvider === 'pglite';
const isMemoryPglite = env.pgliteDataDir === 'memory';
const pglitePath = isMemoryPglite ? null : path.resolve(process.cwd(), env.pgliteDataDir);

if (isPglite && !isMemoryPglite) {
  fs.mkdirSync(path.dirname(pglitePath), { recursive: true });
}

export const pool = isPglite
  ? new PGlite(pglitePath || undefined)
  : new pg.Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
    });

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

export async function closePool() {
  if (isPglite) {
    await pool.close();
    return;
  }
  await pool.end();
}
