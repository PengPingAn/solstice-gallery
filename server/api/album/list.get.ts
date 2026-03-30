import defBgImg from '~/data/defaultBgImg'
import { AliyunOssProvider } from '../../infrastructure/storage/providers/aliyun-oss.provider'
import { LocalStorageProvider } from '../../infrastructure/storage/providers/local.provider'
import { db } from '../../utils/db'
import { success } from '../../utils/response'

export default defineEventHandler(async () => {
  const albums = db
    .prepare(
      `
    SELECT id, name, path, cover_mode, last_upload_date, cover_image_id
    FROM albums
    ORDER BY created_at DESC
  `
    )
    .all()

  const tagStmt = db.prepare(`
    SELECT tag FROM album_tags WHERE album_id = ?
  `)
  const countStmt = db.prepare(`SELECT count(*) as total FROM images WHERE album_id = ?`)
  const latestImageStmt = db.prepare(`
    SELECT id, path, original_object_id 
    FROM images 
    WHERE album_id = ? 
    ORDER BY created_at DESC, id DESC 
    LIMIT 1
  `)
  const coverImageStmt = db.prepare(`
    SELECT id, path, original_object_id 
    FROM images 
    WHERE id = ? 
    LIMIT 1
  `)
  const storageByMoIdStmt = db.prepare(`
    SELECT s.type as storage_type, s.config as storage_config, mo.object_key as object_key
    FROM media_objects mo
    JOIN storages s ON s.id = mo.storage_id
    WHERE mo.id = ?
  `)

  const data = albums.map((album: any) => {
    const tags = tagStmt.all(album.id).map((t: any) => t.tag)
    const row = countStmt.get(album.id) as { total?: number } | undefined
    const imgCount = row?.total || 0

    let coverKey: string | null = null
    let coverMoId: number | null = null
    let coverStorageType: string | null = null
    let coverUrl: string | null = null

    if (album.cover_mode === 1) {
      const r = latestImageStmt.get(album.id) as
        | { id: number; path: string; original_object_id: number | null }
        | undefined
      coverKey = r?.path || null
      coverMoId = r?.original_object_id ?? null
    } else if (album.cover_image_id) {
      const r = coverImageStmt.get(album.cover_image_id) as
        | { id: number; path: string; original_object_id: number | null }
        | undefined
      coverKey = r?.path || null
      coverMoId = r?.original_object_id ?? null
    }

    if (coverKey) {
      if (coverMoId) {
        const sr = storageByMoIdStmt.get(coverMoId) as
          | { storage_type: string; storage_config: string; object_key: string }
          | undefined
        if (sr) {
          const cfg = sr.storage_config ? JSON.parse(sr.storage_config) : {}
          const key = sr.object_key || coverKey
          if (sr.storage_type === 'local') {
            const provider = new LocalStorageProvider(cfg)
            const u = provider.getUrl(key)
            coverUrl =
              u && !/^https?:\/\//i.test(u) && !u.startsWith('/')
                ? `/data/images/${u.replace(/^\/+/, '')}`
                : u
            coverStorageType = 'local'
          } else if (sr.storage_type === 'aliyun-oss') {
            const provider = new AliyunOssProvider(cfg)
            let u = provider.getUrl(key)
            if (cfg?.public === true) {
              try {
                const parsed = new URL(u)
                parsed.search = ''
                u = parsed.toString()
              } catch {}
            }
            coverUrl = u
            coverStorageType = 'aliyun-oss'
          }
        }
      }
      if (!coverUrl) {
        const isHttp = /^https?:\/\//i.test(coverKey)
        coverUrl = isHttp ? coverKey : `/data/images/${coverKey.replace(/^\/+/, '')}`
        coverStorageType = isHttp ? 'external' : 'local'
      }
    }

    return {
      id: album.id,
      name: album.name,
      path: album.path,
      tags,
      imgCount,
      updateDate: album.last_upload_date,
      coverMode: album.cover_mode === 1,
      urlData: [coverUrl || defBgImg],
      coverStorageType,
    }
  })
  return success(data)
})
