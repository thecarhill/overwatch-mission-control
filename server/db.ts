import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export type FileRow = {
  path: string
  content: string
  github_sha: string | null
  dirty: number
  updated_at: string
}

export function openDb(): Database.Database {
  const dataDir = process.env.DATA_DIR || '/data'
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  const dbPath = process.env.SQLITE_PATH || join(dataDir, 'overwatch.db')
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      path TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      github_sha TEXT,
      dirty INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_files_dirty ON files(dirty);
  `)
  return db
}
