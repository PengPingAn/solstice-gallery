// server/storages/storage.factory.ts
import { getDefaultStorage } from '../../api/repositories/storage.repo'
import { AliyunOssProvider } from './providers/aliyun-oss.provider'
import { LocalStorageProvider } from './providers/local.provider'

export async function createDefaultStorageProvider() {
  const row = await getDefaultStorage()
  if (!row) throw new Error('No default storage configured')

  const config = JSON.parse(row.config)

  switch (row.type) {
    case 'aliyun-oss':
      return new AliyunOssProvider(config)

    case 'local':
      return new LocalStorageProvider(config)

    default:
      throw new Error(`Unsupported storage type: ${row.type}`)
  }
}
