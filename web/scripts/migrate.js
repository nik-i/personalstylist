#!/usr/bin/env node
// Applies pending Prisma migrations using pg directly — no Prisma CLI needed.
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL env var is required');

  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('[migrate] connected');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  VARCHAR(36) PRIMARY KEY,
        "checksum"            VARCHAR(64) NOT NULL,
        "finished_at"         TIMESTAMPTZ,
        "migration_name"      VARCHAR(255) NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      TIMESTAMPTZ,
        "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);

    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[migrate] no migrations directory, skipping');
      return;
    }

    const dirs = fs.readdirSync(migrationsDir)
      .filter(d => fs.statSync(path.join(migrationsDir, d)).isDirectory())
      .sort();

    const { rows } = await client.query(
      'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL'
    );
    const applied = new Set(rows.map(r => r.migration_name));

    for (const dir of dirs) {
      if (applied.has(dir)) {
        console.log(`[migrate] already applied: ${dir}`);
        continue;
      }

      const sqlFile = path.join(migrationsDir, dir, 'migration.sql');
      if (!fs.existsSync(sqlFile)) continue;

      const sql = fs.readFileSync(sqlFile, 'utf8');
      console.log(`[migrate] applying: ${dir}`);

      const id = crypto.randomUUID();
      const checksum = crypto.createHash('sha256').update(sql).digest('hex').slice(0, 64);

      await client.query(
        'INSERT INTO _prisma_migrations (id, checksum, migration_name) VALUES ($1, $2, $3)',
        [id, checksum, dir]
      );

      await client.query(sql);

      await client.query(
        'UPDATE _prisma_migrations SET finished_at = now(), applied_steps_count = 1 WHERE id = $1',
        [id]
      );

      console.log(`[migrate] applied: ${dir}`);
    }

    // Ensure the demo user exists with the known ID that MCP_USER_ID points to.
    // Remove any prior demo@frock.app row with a different ID (cascade-deletes its data),
    // then upsert so repeated deploys are idempotent.
    await client.query(`
      DELETE FROM "User" WHERE email = 'demo@frock.app' AND id != 'demo-user'
    `);
    await client.query(`
      INSERT INTO "User" (id, email, name, "createdAt")
      VALUES ('demo-user', 'demo@frock.app', 'Demo User', now())
      ON CONFLICT (id) DO UPDATE SET email = 'demo@frock.app', name = 'Demo User'
    `);
    console.log('[migrate] demo user ready');

    console.log('[migrate] done');
  } finally {
    await client.end();
  }
}

main().catch(e => {
  console.error('[migrate] failed:', e.message);
  process.exit(1);
});
