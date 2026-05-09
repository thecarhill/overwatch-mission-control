import { openDb } from './db.js'

type Db = ReturnType<typeof openDb>

export function upsertFile(db: Db, path: string, content: string): void {
  db.prepare(
    `
    INSERT INTO files (path, content, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(path) DO UPDATE SET
      content = excluded.content,
      updated_at = datetime('now')
    `,
  ).run(path, content)
}
