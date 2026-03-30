import fs from 'fs'
import path from 'path'
import { createAliyunOssClient } from '../../../infrastructure/storage/clients/aliyun-oss.client'
import { db } from '../../../utils/db'
import { success } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const row: any = db
    .prepare(
      `
      SELECT 
        i.id, i.album_id, i.path, i.filename,
        mo.object_key as mo_object_key,
        s.id as storage_id, s.type as storage_type, s.config as storage_config
      FROM images i
      LEFT JOIN media_objects mo ON mo.id = i.original_object_id
      LEFT JOIN storages s ON s.id = mo.storage_id
      WHERE i.id = ?
    `
    )
    .get(id)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  try {
    if (row.storage_type) {
      const type = row.storage_type as string
      const cfg = row.storage_config ? JSON.parse(row.storage_config) : {}
      const objectKey = row.mo_object_key || row.path

      if (type === 'local') {
        const cleanPath = String(cfg.path || '').replace(/^[\\/]+/, '')
        const baseDir = path.resolve(process.cwd(), cleanPath)
        const full = path.join(baseDir, objectKey)
        if (fs.existsSync(full)) fs.unlinkSync(full)
      } else if (type === 'aliyun-oss') {
        const client = createAliyunOssClient(cfg)
        try {
          await client.delete(objectKey)
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    // 忽略对象删除错误，继续删除数据库
  }

  db.prepare(`DELETE FROM images WHERE id = ?`).run(id)

  return success({ success: true })
})
