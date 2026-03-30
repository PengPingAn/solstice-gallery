import { db } from '../../../utils/db'

interface UpdateStorageConfig {
  type?: 'local' | 'aliyun-oss' | 'qiniu' | 's3' | 'r2'
  name?: string
  is_default?: boolean
  config?: any
}

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body: UpdateStorageConfig = await readBody(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID不能为空',
      })
    }

    // 检查存储是否存在
    const existing = db.prepare('SELECT id FROM storages WHERE id = ?').get(id)

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: '存储配置不存在',
      })
    }

    // 构建更新字段
    const updates: string[] = []
    const values: any[] = []

    if (body.type !== undefined) {
      const validTypes = ['local', 'aliyun-oss', 'qiniu', 's3', 'r2']
      if (!validTypes.includes(body.type)) {
        throw createError({
          statusCode: 400,
          message: `type必须是以下值之一: ${validTypes.join(', ')}`,
        })
      }
      updates.push('type = ?')
      values.push(body.type)
    }

    if (body.name !== undefined) {
      updates.push('name = ?')
      values.push(body.name)
    }

    if (body.is_default !== undefined) {
      updates.push('is_default = ?')
      values.push(body.is_default ? 1 : 0)
    }

    if (body.config !== undefined) {
      updates.push('config = ?')
      values.push(JSON.stringify(body.config))
    }

    if (updates.length === 0) {
      throw createError({
        statusCode: 400,
        message: '没有提供更新字段',
      })
    }

    values.push(id)

    const stmt = db.prepare(`
      UPDATE storages 
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    const transaction = db.transaction(() => {
      if (body.is_default === true) {
        db.prepare(
          `
            UPDATE storages
            SET is_default = 0
            WHERE is_default = 1
          `
        ).run()
      }

      stmt.run(...values)
    })

    transaction()

    return {
      message: '存储配置更新成功',
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: '更新存储配置失败',
    })
  }
})
