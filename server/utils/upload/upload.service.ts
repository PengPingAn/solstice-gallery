import path from 'path'
import sharp from 'sharp'
import { createDefaultStorageProvider } from '../../infrastructure/storage/storage.factory'

function normalizeAlbumPath(input: string) {
  return input.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
}

export async function uploadImageToAlbum(options: {
  albumPath: string
  buffer: Buffer
  filename: string
  mimeType?: string
  thumbnailOptions?: {
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  }
}) {
  const { albumPath, buffer, filename, mimeType, thumbnailOptions = {} } = options

  // 默认缩略图配置：保持原图尺寸，质量30%，JPEG格式
  const { quality = 5, format = 'webp' } = thumbnailOptions

  // ... 生成唯一文件名
  const ext = path.extname(filename)
  const name = `${Date.now()}${ext}`

  const cleanAlbumPath = normalizeAlbumPath(albumPath)

  const storage = await createDefaultStorageProvider()

  // 1. 上传原图
  const originalStoragePath = path.posix.join(cleanAlbumPath, 'originals', name)
  const originalResult = await storage.uploadBuffer(buffer, originalStoragePath, mimeType)

  let thumbnailResult = null

  // 2. 生成并上传缩略图（仅对图片）
  const isImage = mimeType?.startsWith('image/') ?? false
  if (isImage) {
    try {
      const sharpInstance = sharp(buffer)
      const metadata = await sharpInstance.metadata()

      // 保持原图尺寸，不缩放
      const resizeOptions: sharp.ResizeOptions = {
        width: metadata.width,
        height: metadata.height,
        fit: 'fill', // 确保尺寸精确匹配
      }

      // 生成缩略图 buffer（降低质量）
      let thumbnailBuffer: Buffer
      if (format === 'jpeg') {
        thumbnailBuffer = await sharpInstance
          .resize(resizeOptions)
          .jpeg({ quality, progressive: true }) // 渐进式加载可选
          .toBuffer()
      } else if (format === 'png') {
        thumbnailBuffer = await sharpInstance.resize(resizeOptions).png({ quality }).toBuffer()
      } else {
        thumbnailBuffer = await sharpInstance.resize(resizeOptions).webp({ quality }).toBuffer()
      }

      // 缩略图文件名与原图相同（不同目录）
      const thumbnailStoragePath = path.posix.join(cleanAlbumPath, 'thumbs', name)
      const thumbnailMime = `image/${format}`
      thumbnailResult = await storage.uploadBuffer(
        thumbnailBuffer,
        thumbnailStoragePath,
        thumbnailMime
      )
    } catch (err) {
      console.error('生成缩略图失败:', err)
    }
  }

  return {
    ...originalResult,
    thumbnail: thumbnailResult,
  }
}
