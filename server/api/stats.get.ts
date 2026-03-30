import fs from 'fs'
import path from 'path'
import { db } from '../utils/db'
import { success } from '../utils/response'
import { getDefaultStorage } from './repositories/storage.repo'

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function calcLocalStorageSize(basePath: string) {
  let total = 0
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.isFile()) total += fs.statSync(full).size
    }
  }
  try {
    walk(basePath)
    return total
  } catch {
    return null
  }
}

export default defineEventHandler(async () => {
  const totalImagesRow = db.prepare(`SELECT COUNT(*) as total FROM images`).get() as any
  const totalImages = totalImagesRow?.total || 0

  const recentSyncRow = db
    .prepare(
      `
      SELECT COUNT(*) as total
      FROM images
      WHERE datetime(created_at) >= datetime('now','-1 day')
    `
    )
    .get() as any
  const recentSync = recentSyncRow?.total || 0

  const dailyRows = db
    .prepare(
      `
      SELECT date(created_at) as d, COUNT(*) as c
      FROM images
      WHERE date(created_at) >= date('now','-365 day')
      GROUP BY d
    `
    )
    .all() as Array<{ d: string; c: number }>

  const heatmap: Record<string, number> = {}
  for (const r of dailyRows) heatmap[`${r.d} 00:00:00`] = r.c

  const hourlyRows = db
    .prepare(
      `
      SELECT strftime('%H', created_at) as h, COUNT(*) as c
      FROM images
      GROUP BY h
    `
    )
    .all() as Array<{ h: string; c: number }>
  const hourly = Array.from({ length: 24 }).map((_, i) => {
    const hh = String(i).padStart(2, '0')
    const match = hourlyRows.find((r) => r.h === hh)
    return { hour: String(i), count: match ? Number(match.c) : 0 }
  })

  const exifRows = db
    .prepare(
      `
      SELECT 
        SUM(CASE WHEN exif IS NOT NULL AND exif <> '' AND exif <> 'null' THEN 1 ELSE 0 END) as withExif,
        COUNT(*) as total
      FROM images
    `
    )
    .get() as { withExif: number; total: number }
  const exifPercent =
    exifRows && exifRows.total > 0 ? Math.round((exifRows.withExif / exifRows.total) * 100) : 0

  const recents = db
    .prepare(
      `
      SELECT id, filename, created_at
      FROM images
      ORDER BY created_at DESC, id DESC
      LIMIT 10
    `
    )
    .all() as Array<{ id: number; filename: string; created_at: string }>

  let storageBytes: number | null = null
  try {
    const storage = await getDefaultStorage()
    if (storage && storage.type === 'local') {
      const config = JSON.parse(storage.config || '{}')
      if (config.path) {
        const cleanPath = String(config.path).replace(/^[\\/]+/, '')
        const full = path.resolve(process.cwd(), cleanPath)
        storageBytes = await calcLocalStorageSize(full)
      }
    }
  } catch {
    storageBytes = null
  }

  return success({
    totalImages,
    recentSync,
    storageBytes,
    dailyHeatmap: heatmap,
    hourlyActivity: hourly,
    quality: {
      exifPercent,
    },
    recentActivities: recents.map((r) => ({
      id: r.id,
      type: 'sync',
      title: '图片同步',
      description: r.filename || '新图片',
      time: r.created_at,
    })),
  })
})
