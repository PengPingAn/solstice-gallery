export type StorageType = 'local' | 'aliyun-oss' | 'qiniu' | 's3' | 'r2'

export interface AliyunOssConfig {
  region: string
  bucket: string
  accessKeyId: string
  accessKeySecret: string
  endpoint?: string
  secure?: boolean
  public?: boolean
}
