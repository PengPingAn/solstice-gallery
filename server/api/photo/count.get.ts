export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const albumId = query.albumId ? Number(query.albumId) : undefined

  const sql = `
    SELECT COUNT(*) as total
    FROM images
    ${albumId ? 'WHERE album_id = ?' : ''}
  `

  const params: any[] = []
  if (albumId) {
    params.push(albumId)
  }

  const row = db.prepare(sql).get(...params) as { total: number }

  return success(row?.total ?? 0)
})
