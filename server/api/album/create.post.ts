import fs from 'fs'
import path from 'path'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { id, name, path: albumPath, tags = [], coverMode = true } = body

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Album name is required',
    })
  }

  // ========== 更新 ==========
  if (id) {
    const exists = db.prepare(`SELECT id, path FROM albums WHERE id = ?`).get(id)

    if (!exists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Album not found',
      })
    }

    // ❗ path 不允许改
    db.prepare(
      `
      UPDATE albums
      SET name = ?, cover_mode = ?
      WHERE id = ?
    `
    ).run(name, coverMode ? 1 : 0, id)

    db.prepare(`DELETE FROM album_tags WHERE album_id = ?`).run(id)

    const insertTag = db.prepare(`
      INSERT INTO album_tags (album_id, tag)
      VALUES (?, ?)
    `)

    for (const tag of tags) {
      insertTag.run(id, tag)
    }

    return { success: true, id }
  }

  // ========== 新建 ==========
  if (!albumPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Album path is required',
    })
  }

  const baseDir = path.join(process.cwd(), 'data/images', albumPath)

  if (fs.existsSync(baseDir)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Album path already exists',
    })
  }

  fs.mkdirSync(path.join(baseDir, 'originals'), { recursive: true })
  fs.mkdirSync(path.join(baseDir, 'thumbs'), { recursive: true })

  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `
      INSERT INTO albums (name, path, cover_mode)
      VALUES (?, ?, ?)
    `
      )
      .run(name, albumPath, coverMode ? 1 : 0)

    const albumId = result.lastInsertRowid as number

    const insertTag = db.prepare(`
      INSERT INTO album_tags (album_id, tag)
      VALUES (?, ?)
    `)

    for (const tag of tags) {
      insertTag.run(albumId, tag)
    }

    return albumId
  })

  const albumId = tx()

  return { success: true, id: albumId }
})
