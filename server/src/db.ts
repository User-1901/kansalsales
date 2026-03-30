import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../pgdata');
export const pglite = new PGlite(dbPath);

// ── Init ──────────────────────────────────────────────────────────────────────

async function doInit() {
  await pglite.waitReady;

  // Migration tracking table
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const migrationsDir = path.resolve(__dirname, '../migrations');
  const allFiles = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).sort().filter(f => f.endsWith('.sql'))
    : [];

  // Check if users table already exists (pre-migration-tracker DB)
  const usersExists = await pglite.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    )
  `);
  const migrationsCount = await pglite.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM _migrations`
  );

  if (usersExists.rows[0].exists && migrationsCount.rows[0].count === '0') {
    // Existing DB with no tracker — mark all files as already applied
    for (const file of allFiles) {
      await pglite.query(
        `INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
        [file]
      );
    }
    console.log('[DB] Existing database detected — skipped migrations.');
  } else {
    // Fresh DB or incremental — run only unapplied migrations
    for (const file of allFiles) {
      const already = await pglite.query<{ filename: string }>(
        `SELECT filename FROM _migrations WHERE filename = $1`, [file]
      );
      if (already.rows.length > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`[DB] Running migration: ${file}`);
      await pglite.exec(sql);
      await pglite.query(`INSERT INTO _migrations (filename) VALUES ($1)`, [file]);
    }
  }

  // Upsert admin account — always runs so credentials stay in sync
  const hash = await bcrypt.hash('Raj@1234', 10);
  await pglite.query(
    `INSERT INTO users (email, display_name, password_hash, role, email_verified)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO UPDATE
       SET password_hash  = EXCLUDED.password_hash,
           role           = 'admin',
           email_verified = TRUE`,
    ['rajuadmin@kansalsales.com', 'Raju Admin', hash]
  );
  console.log('[DB] Admin ready: rajuadmin@kansalsales.com / Raj@1234');
}

// ── Run init EAGERLY at module load (not lazily on first query) ───────────────
// This ensures the DB is fully ready before any request arrives.
export const dbReady: Promise<void> = doInit().catch(err => {
  console.error('[DB] Init failed:', err);
  process.exit(1);
});

// ── Pool wrapper ──────────────────────────────────────────────────────────────
export const pool = {
  query: async (text: string, params?: unknown[]) => {
    await dbReady; // wait for init to finish
    const result = await pglite.query(text, params);
    // For SELECT queries: use rows.length
    // For INSERT/UPDATE/DELETE: use affectedRows if available, otherwise rows.length
    const rowCount = result.rows && result.rows.length > 0 ? result.rows.length : (result.affectedRows ?? 0);
    return {
      rows: result.rows as Record<string, unknown>[],
      rowCount: rowCount as number,
    };
  },
};
