import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID不能为空',
      })
    }

    // 检查存储是否存在
    const existing = db.prepare('SELECT id, is_default FROM storages WHERE id = ?').get(id)

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: '存储配置不存在',
      })
    }

    // 不能删除默认存储，除非这是最后一个
    if (existing.is_default === 1) {
      const storageCount = db.prepare('SELECT COUNT(*) as count FROM storages').get()

      if (storageCount.count <= 1) {
        throw createError({
          statusCode: 400,
          message: '不能删除最后一个存储配置',
        })
      }
    }

    // 删除存储
    db.prepare('DELETE FROM storages WHERE id = ?').run(id)

    return {
      message: '存储配置删除成功',
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: '删除存储配置失败',
    })
  }
})
