// server/infrastructure/storage/providers/local.provider.ts
import fs from 'fs'
import path from 'path'
import { readExifFromFile } from '../../../utils/exif/readExif'
import type { StorageProvider } from '../storage-provider'

interface LocalConfig {
  path: string // 来自 DB
  baseUrl?: string
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string
  private publicBaseUrl?: string
  private baseUrl = 'data/images/'

  constructor(config: LocalConfig) {
    if (!config.path) {
      throw new Error('LocalStorageProvider: config.path is required')
    }
    const rawPath = String(config.path)
    // 兼容绝对/相对路径，保留 Windows 盘符
    this.baseDir = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath.replace(/\\/g, '/'))
    this.publicBaseUrl = config.baseUrl
  }

  async uploadBuffer(buffer: Buffer, storagePath: string) {
    if (!this.baseDir) {
      throw new Error('LocalStorageProvider: baseDir is empty')
    }

    const fullPath = path.join(this.baseDir, storagePath)

    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, buffer)

    let exif = null
    try {
      exif = await readExifFromFile(fullPath)
      console.log(exif)
    } catch (err) {
      exif = null
      console.log('exif错误：', err)
    }

    return {
      path: storagePath,
      url: this.getUrl(storagePath),
      exif: exif,
    }
  }

  getUrl(storagePath: string) {
    if (!this.publicBaseUrl) return storagePath
    return `${this.publicBaseUrl.replace(/\/+$/, '')}/${String(storagePath).replace(/^\/+/, '')}`
  }
}
