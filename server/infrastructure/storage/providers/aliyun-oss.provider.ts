// server/storages/aliyun-oss.provider.ts
import type { AliyunOssConfig } from '../../../types/storage'
import { readExifFromFile } from '../../../utils/exif/readExif'
import { createAliyunOssClient } from '../clients/aliyun-oss.client'
import { StorageProvider } from '../storage-provider'

export class AliyunOssProvider implements StorageProvider {
  private client
  private isPublic: boolean

  constructor(private config: AliyunOssConfig) {
    try {
      this.client = createAliyunOssClient(config)
      this.isPublic = !!config.public
    } catch (ex) {
      console.log(`阿里云Client失败：${ex}`)
    }
  }

  async uploadBuffer(buffer: Buffer, path: string, mimeType?: string) {
    const result = await this.client.put(path, buffer, {
      headers: mimeType ? { 'Content-Type': mimeType } : undefined,
    })

    let exif = null
    try {
      exif = await readExifFromFile(buffer)
      console.log(exif)
    } catch (err) {
      exif = null
      console.log('exif错误：', err)
    }

    return {
      path: result.name,
      url: this.getUrl(result.name),
      exif: exif,
    }
  }

  getUrl(path: string) {
    if (this.isPublic) {
      return `https://${this.config.bucket}.${this.config.endpoint}/${path}`
    }
    return this.client.signatureUrl(path, { expires: 3600 })
  }
}
