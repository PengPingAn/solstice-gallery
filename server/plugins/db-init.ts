import fs from 'fs'
import path from 'path'
import { db } from '../utils/db'

export default defineNitroPlugin(() => {
  const migrationsDir = path.resolve(process.cwd(), 'data/migrations')

  if (!fs.existsSync(migrationsDir)) {
    console.warn('[db] migrations dir not found')
    return
  }

  const applied = new Set(
    db
      .prepare('SELECT name FROM _migrations')
      .all()
      .map((r) => r.name)
  )

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const insertMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)')

  const runMigration = db.transaction((name: string, sql: string) => {
    db.exec(sql)
    insertMigration.run(name)
  })

  for (const file of files) {
    if (applied.has(file)) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

    console.log(`[db] applying migration: ${file}`)
    runMigration(file, sql)
  }
})
