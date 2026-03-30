// server/storages/aliyun-oss.client.ts
import OSS from 'ali-oss'
import type { AliyunOssConfig } from '../../../types/storage'

export function createAliyunOssClient(config: AliyunOssConfig) {
  return new OSS({
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint: config.endpoint,
    secure: config.secure ?? true,
  })
}
