import { db } from '../../utils/db'

interface StorageConfig {
  type: 'local' | 'aliyun-oss' | 'qiniu' | 's3' | 'r2'
  name: string
  is_default?: boolean
  config: any // JSON 配置对象
}

export default defineEventHandler(async (event) => {
  try {
    const body: StorageConfig = await readBody(event)

    // 验证必填字段
    if (!body.type || !body.name || !body.config) {
      throw createError({
        statusCode: 400,
        message: 'type、name和config为必填项',
      })
    }

    // 验证type枚举
    const validTypes = ['local', 'aliyun-oss', 'qiniu', 's3', 'r2']
    if (!validTypes.includes(body.type)) {
      throw createError({
        statusCode: 400,
        message: `type必须是以下值之一: ${validTypes.join(', ')}`,
      })
    }

    // 准备插入语句
    const stmt = db.prepare(`
      INSERT INTO storages (type, name, is_default, config)
      VALUES (?, ?, ?, ?)
    `)

    const result = stmt.run(
      body.type,
      body.name,
      body.is_default ? 1 : 0,
      JSON.stringify(body.config)
    )

    return {
      id: result.lastInsertRowid,
      message: '存储配置创建成功',
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: '创建存储配置失败',
    })
  }
})
