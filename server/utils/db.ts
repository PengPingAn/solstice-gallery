import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'data/db.sqlite')
const dbDir = path.dirname(dbPath)

// 确保数据库目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new Database(dbPath)

// 推荐 pragma
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

// migration 记录表
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`
).run()
