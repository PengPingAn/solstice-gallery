import { AliyunOssProvider } from '../../infrastructure/storage/providers/aliyun-oss.provider'
import { LocalStorageProvider } from '../../infrastructure/storage/providers/local.provider'
import { db } from '../../utils/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const albumId = query.albumId ? Number(query.albumId) : undefined
  const albumPath = typeof query.albumPath === 'string' ? query.albumPath : undefined

  let targetAlbumId = albumId

  if (!targetAlbumId && albumPath) {
    const row = db.prepare(`SELECT id FROM albums WHERE path = ?`).get(albumPath) as
      | { id: number }
      | undefined
    if (row) targetAlbumId = row.id
  }

  if (!targetAlbumId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'albumId or albumPath is required',
    })
  }

  const images = db
    .prepare(
      `
      SELECT 
        i.id,
        i.path,
        i.filename,
        i.created_at,
        mo.object_key as mo_object_key,
        s.type as storage_type,
        s.config as storage_config
      FROM images i
      LEFT JOIN media_objects mo ON mo.id = i.original_object_id
      LEFT JOIN storages s ON s.id = mo.storage_id
      WHERE i.album_id = ?
      ORDER BY i.created_at DESC, i.id DESC
    `
    )
    .all(targetAlbumId)

  const isHttpUrl = (val: string) => /^https?:\/\//i.test(val)

  const items = images.map((img: any) => {
    let url: string | null = null
    let thumbUrl: string | null = null
    let storageType: string | null = null

    if (img.storage_type) {
      storageType = img.storage_type
      const cfg = img.storage_config ? JSON.parse(img.storage_config) : {}
      const objectKey = img.mo_object_key || img.path

      if (img.storage_type === 'local') {
        const provider = new LocalStorageProvider(cfg)
        url = provider.getUrl(objectKey)

        // ⚠️ 本地非 http 地址补前缀
        if (url && !/^https?:\/\//i.test(url) && !url.startsWith('/')) {
          url = `/data/images/${url.replace(/^\/+/, '')}`
        }
        const tk = String(objectKey).includes('/originals/')
          ? String(objectKey).replace('/originals/', '/thumbs/')
          : `thumbs/${String(objectKey).replace(/^\/?/, '')}`
        let tu = provider.getUrl(tk)
        if (tu && !/^https?:\/\//i.test(tu) && !tu.startsWith('/')) {
          tu = `/data/images/${tu.replace(/^\/+/, '')}`
        }
        thumbUrl = tu
      } else if (img.storage_type === 'aliyun-oss') {
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
        url = isHttpUrl(img.path) ? img.path : objectKey
      }
    } else {
      // 旧数据兜底
      if (isHttpUrl(img.path)) {
        url = img.path
        storageType = 'external'
      } else {
        url = `/data/images/${img.path.replace(/^\/+/, '')}`
        storageType = 'local'
        thumbUrl = url.replace('/originals/', '/thumbs/')
      }
    }

    return {
      id: img.id,
      url,
      thumbUrl,
      filename: img.filename,
      createdAt: img.created_at,
      storageType,
    }
  })

  return ok(items)
})
