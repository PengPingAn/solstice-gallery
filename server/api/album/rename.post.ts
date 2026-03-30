import fs from 'fs'
import path from 'path'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, newPath } = body

  if (!id || !newPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'id and newPath are required',
    })
  }

  // 1. 查询旧相册
  const album = db.prepare(`SELECT id, path FROM albums WHERE id = ?`).get(id)

  if (!album) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Album not found',
    })
  }

  if (album.path === newPath) {
    return { success: true }
  }

  const oldDir = path.join(process.cwd(), 'data/images', album.path)
  const newDir = path.join(process.cwd(), 'data/images', newPath)

  if (!fs.existsSync(oldDir)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Album directory missing',
    })
  }

  if (fs.existsSync(newDir)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Target path already exists',
    })
  }

  // 2. 文件系统重命名
  fs.renameSync(oldDir, newDir)

  try {
    // 3. 更新数据库
    db.prepare(
      `
      UPDATE albums
      SET path = ?
      WHERE id = ?
    `
    ).run(newPath, id)
  } catch (err) {
    // ⚠️ 数据库失败，回滚目录
    fs.renameSync(newDir, oldDir)
    throw err
  }

  return { success: true }
})
