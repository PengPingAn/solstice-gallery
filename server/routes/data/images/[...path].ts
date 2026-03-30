import fs from 'fs'
import path from 'path'
import { db } from '../../../utils/db'

const mimeMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

export default defineEventHandler(async (event) => {
  // 解析 catch-all 参数
  const p = getRouterParam(event, 'path') || ''
  const relative = String(p).replace(/^\/+/, '')
  const safeRel = relative.replace(/\.\.(\/|\\)/g, '')

  // 查询所有本地存储路径（按默认优先）
  const storages = db
    .prepare(
      `
      SELECT type, config, is_default
      FROM storages
      WHERE type = 'local'
      ORDER BY is_default DESC, id ASC
    `
    )
    .all() as Array<{ type: string; config: string; is_default: number }>

  let foundPath: string | null = null

  for (const s of storages) {
    try {
      const cfg = JSON.parse(s.config || '{}')
      if (!cfg.path) continue
      const baseDir = path.isAbsolute(cfg.path)
        ? String(cfg.path)
        : path.resolve(process.cwd(), String(cfg.path).replace(/\\/g, '/'))
      const full = path.join(baseDir, safeRel)
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        foundPath = full
        break
      }
    } catch {
      continue
    }
  }

  // 兜底：项目默认 data/images
  if (!foundPath) {
    const fallbackBase = path.resolve(process.cwd(), 'data', 'images')
    const full = path.join(fallbackBase, safeRel)
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      foundPath = full
    }
  }

  if (!foundPath) {
    setResponseStatus(event, 404)
    return 'Not Found'
  }

  const ext = path.extname(foundPath).toLowerCase()
  const mime = mimeMap[ext] || 'application/octet-stream'
  setHeader(event, 'Content-Type', mime)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  // @ts-ignore
  return sendStream(event, fs.createReadStream(foundPath))
})
