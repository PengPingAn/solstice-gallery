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

    const storage = db
      .prepare(
        `
        SELECT id, type, name, is_default, config, created_at
        FROM storages
        WHERE id = ?
      `
      )
      .get(id)

    if (!storage) {
      throw createError({
        statusCode: 404,
        message: '存储配置不存在',
      })
    }

    return {
      ...storage,
      config: JSON.parse(storage.config),
      is_default: storage.is_default === 1,
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: '获取存储配置失败',
    })
  }
})
