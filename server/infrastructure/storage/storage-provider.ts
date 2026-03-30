// server/storages/storage-provider.ts
export interface UploadResult {
  path: string
  url: string
}

export interface StorageProvider {
  uploadBuffer(buffer: Buffer, path: string, mimeType?: string): Promise<UploadResult>

  getUrl(path: string): string
}
