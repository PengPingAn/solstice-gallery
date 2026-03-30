import fs from 'fs'
import path from 'path'
import { db } from '../utils/db'

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
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/data/images/')) return

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

  if (!storages || storages.length === 0) return

  // 归一化相对路径，防止路径穿越
  const relative = url.pathname.replace(/^\/data\/images[\\/]/, '').replace(/^\/+/, '')
  const safeRel = relative.replace(/\.\.(\/|\\)/g, '')

  // 尝试在所有本地存储路径中查找该文件
  let foundPath: string | null = null
  for (const s of storages) {
    let baseDir: string | null = null
    try {
      const cfg = JSON.parse(s.config || '{}')
      if (!cfg.path) continue
      const p = String(cfg.path)
      baseDir = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p.replace(/\\/g, '/'))
    } catch {
      baseDir = null
    }
    if (!baseDir) continue
    const full = path.join(baseDir, safeRel)
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      foundPath = full
      break
    }
  }

  // 兜底：尝试项目默认 data/images 目录
  if (!foundPath) {
    const fallbackBase = path.resolve(process.cwd(), 'data', 'images')
    const fallbackPath = path.join(fallbackBase, safeRel)
    if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
      foundPath = fallbackPath
    }
  }

  if (!foundPath) {
    setResponseStatus(event, 404)
    return 'Not Found'
  }

  const ext = path.extname(foundPath).toLowerCase()
  const mime = mimeMap[ext] || 'application/octet-stream'
  setHeader(event, 'Content-Type', mime)

  // @ts-ignore
  return sendStream(event, fs.createReadStream(foundPath))
})
