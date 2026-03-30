// server/api/storages/[id]/test.get.ts
import fs from 'fs/promises'
import path from 'path'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID不能为空',
      })
    }

    const storage = db
      .prepare(
        `
        SELECT type, config
        FROM storages
        WHERE id = ?
      `
      )
      .get(id) as { type: string; config: string } | undefined

    if (!storage) {
      throw createError({
        statusCode: 404,
        statusMessage: '存储配置不存在',
      })
    }

    const config = JSON.parse(storage.config)

    let success = false
    let message = ''
    let detail: any = {}

    switch (storage.type) {
      case 'local': {
        if (!config.path) {
          message = '未配置本地存储路径'
          break
        }

        // 与 provider 一致：兼容绝对/相对路径
        const p = String(config.path)
        const fullPath = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p.replace(/\\/g, '/'))

        try {
          await fs.mkdir(fullPath, { recursive: true })

          // 写一个临时文件验证写权限
          const testFile = path.join(fullPath, '.write-test')
          await fs.writeFile(testFile, 'ok')
          await fs.unlink(testFile)

          success = true
          message = '本地存储目录可访问且可写'
        } catch (err: any) {
          message = '本地存储目录不可用'
          detail.error = err.message
        }

        detail.baseDir = fullPath
        break
      }

      case 'aliyun-oss': {
        const { accessKeyId, accessKeySecret, bucket, endpoint } = config

        if (!accessKeyId || !accessKeySecret || !bucket || !endpoint) {
          message = '阿里云 OSS 配置不完整'
          break
        }

        try {
          const OSS = (await import('ali-oss')).default
          const client = new OSS({
            accessKeyId,
            accessKeySecret,
            bucket,
            endpoint,
          })

          // ✅ 最轻量的真实请求
          await client.getBucketInfo()

          success = true
          message = '阿里云 OSS 连接正常'
        } catch (err: any) {
          message = '阿里云 OSS 连接失败'
          detail.error = err.message
          console.log(err.message)
        }

        break
      }

      case 'qiniu': {
        const { accessKey, secretKey, bucket, domain } = config
        if (accessKey && secretKey && bucket && domain) {
          success = true
          message = '七牛云配置完整（未进行网络测试）'
        } else {
          message = '七牛云配置不完整'
        }
        break
      }

      case 's3':
      case 'r2': {
        const { accessKeyId, secretAccessKey, bucket, region } = config
        if (accessKeyId && secretAccessKey && bucket) {
          success = true
          message = `${storage.type.toUpperCase()} 配置完整（未进行网络测试）`
        } else {
          message = `${storage.type.toUpperCase()} 配置不完整`
        }
        break
      }

      default:
        message = '暂不支持该存储类型的测试'
    }

    return {
      success,
      message,
      detail,
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: '测试存储失败: ' + error.message,
    })
  }
})
