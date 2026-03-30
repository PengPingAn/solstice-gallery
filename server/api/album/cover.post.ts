import { db } from '../../utils/db'
import { success } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { albumId, imageId } = body || {}

  if (!albumId || !imageId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'albumId and imageId are required',
    })
  }

  const album = db.prepare(`SELECT id FROM albums WHERE id = ?`).get(albumId)
  if (!album) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Album not found',
    })
  }

  const image = db
    .prepare(`SELECT id FROM images WHERE id = ? AND album_id = ?`)
    .get(imageId, albumId)
  if (!image) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found in album',
    })
  }

  db.prepare(
    `
    UPDATE albums
    SET cover_mode = 0, cover_image_id = ?
    WHERE id = ?
  `
  ).run(imageId, albumId)

  return ok({ success: true })
})
