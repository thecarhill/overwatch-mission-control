import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export function openDb(): Database.Database {
  const dataDir = process.env.DATA_DIR || '/data'
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  const dbPath = process.env.SQLITE_PATH || join(dataDir, 'overwatch.db')
  const db = new Database(dbPath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  migrateLegacySchema(db)
  ensureTasksTable(db)
  return db
}

function ensureTasksTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT '03_STANDARD',
      deadline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_slug);
  `)
}

/** Older installs had github_sha / dirty — collapse to path + content + updated_at */
function migrateLegacySchema(db: Database.Database) {
  const cols = db
    .prepare(`PRAGMA table_info(files)`)
    .all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  if (!names.has('github_sha') && !names.has('dirty')) return

  const tsSelect = names.has('updated_at')
    ? `COALESCE(updated_at, datetime('now'))`
    : `datetime('now')`

  db.exec(`
    CREATE TABLE IF NOT EXISTS files_migrated (
      path TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR REPLACE INTO files_migrated (path, content, updated_at)
    SELECT path, content, ${tsSelect} FROM files;
    DROP TABLE files;
    ALTER TABLE files_migrated RENAME TO files;
  `)
}
