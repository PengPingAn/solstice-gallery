import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const rows = db
      .prepare(
        `
        SELECT id, name, type, is_default, config, created_at
        FROM storages
        ORDER BY created_at DESC
      `
      )
      .all()

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      isCurrent: r.is_default === 1,
      createdAt: r.created_at,
      config: JSON.parse(r.config),
    }))
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    const { name, type, config } = body

    if (!name || !type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'name and type are required',
      })
    }

    const count = db.prepare(`SELECT COUNT(*) as c FROM storages`).get().c as number

    const isDefault = count === 0 ? 1 : 0

    const info = db
      .prepare(
        `
        INSERT INTO storages (name, type, is_default, config)
        VALUES (?, ?, ?, ?)
      `
      )
      .run(name, type, isDefault, JSON.stringify(config ?? {}))

    return { id: info.lastInsertRowid }
  }

  throw createError({ statusCode: 405 })
})
