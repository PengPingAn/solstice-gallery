import { db } from '../../utils/db'
import { getDefaultStorage } from '../repositories/storage.repo'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { name, path: path, exif, albumPath } = body

  // ========== 更新 ==========
  // if (id) {
  //   const exists = db.prepare(`SELECT id, path FROM images WHERE id = ?`).get(id)

  //   if (!exists) {
  //     throw createError({
  //       statusCode: 404,
  //       statusMessage: 'Album not found',
  //     })
  //   }

  //   // ❗ path 不允许改
  //   db.prepare(
  //     `
  //     UPDATE images
  //     SET name = ?, cover_mode = ?
  //     WHERE id = ?
  //   `
  //   ).run(name, coverMode ? 1 : 0, id)

  //   db.prepare(`DELETE FROM album_tags WHERE album_id = ?`).run(id)

  //   const insertTag = db.prepare(`
  //     INSERT INTO album_tags (album_id, tag)
  //     VALUES (?, ?)
  //   `)

  //   for (const tag of tags) {
  //     insertTag.run(id, tag)
  //   }

  //   return { success: true, id }
  // }

  // ========== 新建 ==========
  const defaultStorage = await getDefaultStorage()

  const tx = db.transaction(() => {
    let albumId: number | null = null

    if (albumPath) {
      const albumRow = db.prepare(`SELECT id FROM albums WHERE path = ?`).get(albumPath) as
        | { id: number }
        | undefined
      if (albumRow) {
        albumId = albumRow.id
      }
    }

    // 新建图片
    const result = db
      .prepare(
        `
      INSERT INTO images (album_id, filename, exif, path)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(albumId, name, JSON.stringify(exif), path)

    const imageId = result.lastInsertRowid as number

    // 记录对象存储映射（若存在默认存储）
    if (defaultStorage) {
      const mo = db
        .prepare(
          `
          INSERT INTO media_objects (storage_id, object_key)
          VALUES (?, ?)
        `
        )
        .run(defaultStorage.id, path)

      const objectId = mo.lastInsertRowid as number

      db.prepare(
        `
        UPDATE images
        SET original_object_id = ?
        WHERE id = ?
      `
      ).run(objectId, imageId)
    }

    if (albumId) {
      db.prepare(
        `
        UPDATE albums
        SET last_upload_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(albumId)
    }

    return imageId
  })

  const imageId = tx()

  return { success: true, id: imageId }
})
