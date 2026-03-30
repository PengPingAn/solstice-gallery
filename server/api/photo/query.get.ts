import path from 'path'
import { AliyunOssProvider } from '../../infrastructure/storage/providers/aliyun-oss.provider'
import { LocalStorageProvider } from '../../infrastructure/storage/providers/local.provider'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const albumId = query.albumId ? Number(query.albumId) : undefined
  const limit = query.limit ? Number(query.limit) : undefined
  const offset = query.offset ? Number(query.offset) : 0

  const baseSql = `
    SELECT 
      i.id, i.album_id, i.filename, i.path, i.created_at, i.exif,
      mo.object_key as mo_object_key,
      s.id as storage_id, s.type as storage_type, s.config as storage_config
    FROM images i
    LEFT JOIN media_objects mo ON mo.id = i.original_object_id
    LEFT JOIN storages s ON s.id = mo.storage_id
    ${albumId ? 'WHERE i.album_id = ?' : ''}
    ORDER BY i.created_at DESC, i.id DESC
    ${limit ? 'LIMIT ? OFFSET ?' : ''}
  `

  let params: any[] = []
  if (albumId) params.push(albumId)
  if (limit) {
    params.push(limit)
    params.push(offset)
  }
  const rows: any[] = db.prepare(baseSql).all(...params)

  const isHttpUrl = (val: string) => /^https?:\/\//i.test(val)

  // 用于无映射时推断所属存储
  const storages = db.prepare(`SELECT id, type, config FROM storages`).all() as Array<{
    id: number
    type: string
    config: string
  }>
  const aliyunHosts = storages
    .filter((s) => s.type === 'aliyun-oss')
    .map((s) => {
      try {
        const cfg = JSON.parse(s.config || '{}')
        return cfg?.bucket && cfg?.endpoint ? `${cfg.bucket}.${cfg.endpoint}` : null
      } catch {
        return null
      }
    })
    .filter(Boolean) as string[]
  const localBases = storages
    .filter((s) => s.type === 'local')
    .map((s) => {
      try {
        const cfg = JSON.parse(s.config || '{}')
        return cfg?.baseUrl as string | undefined
      } catch {
        return undefined
      }
    })
    .filter(Boolean) as string[]

  const items = rows.map((r) => {
    const ext = path.extname(r.filename || r.path || '').toLowerCase()
    let url: string | null = null
    let storageType: string | null = null
    let thumbUrl: string | null = null

    if (r.storage_type) {
      storageType = r.storage_type
      const cfg = r.storage_config ? JSON.parse(r.storage_config) : {}
      const objectKey = r.mo_object_key || r.path

      if (r.storage_type === 'local') {
        const provider = new LocalStorageProvider(cfg)
        url = provider.getUrl(objectKey)
        if (url && !/^https?:\/\//i.test(url) && !url.startsWith('/')) {
          url = `/data/images/${url.replace(/^\/+/, '')}`
        }
        const thumbKey = String(objectKey).includes('/originals/')
          ? String(objectKey).replace('/originals/', '/thumbs/')
          : `thumbs/${String(objectKey).replace(/^\/?/, '')}`
        let tu = provider.getUrl(thumbKey)
        if (tu && !/^https?:\/\//i.test(tu) && !tu.startsWith('/')) {
          tu = `/data/images/${tu.replace(/^\/+/, '')}`
        }
        thumbUrl = tu
      } else if (r.storage_type === 'aliyun-oss') {
        const provider = new AliyunOssProvider(cfg)
        url = provider.getUrl(objectKey)
        try {
          const u = new URL(url)
          u.searchParams.set('x-oss-process', 'image/resize,w_480/quality,q_75')
          thumbUrl = u.toString()
        } catch {
          thumbUrl = url
        }
      } else {
        url = isHttpUrl(r.path) ? r.path : objectKey
      }
    } else {
      // 旧数据：没有存储映射
      if (isHttpUrl(r.path)) {
        url = r.path
        try {
          const u = new URL(url)
          if (aliyunHosts.includes(u.hostname)) {
            storageType = 'aliyun-oss'
          } else if (localBases.some((b) => typeof b === 'string' && url.startsWith(b!))) {
            storageType = 'local'
          } else {
            storageType = 'external'
          }
        } catch {
          storageType = 'external'
        }
      } else {
        url = r.path
        storageType = 'local'
        thumbUrl = `/data/images/${String(r.path).replace(/^\/+/, '').replace('/originals/', '/thumbs/')}`
      }
    }

    // url = thumbUrl
    return {
      id: r.id,
      albumId: r.album_id,
      url,
      thumbUrl,
      filename: r.filename,
      fileType: ext,
      createdAt: r.created_at,
      hasExif: !!(r.exif && r.exif !== 'null' && r.exif !== ''),
      storageType,
    }
  })

  return success(items)
})
