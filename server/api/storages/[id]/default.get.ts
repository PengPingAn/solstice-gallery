import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const storage = db
      .prepare(
        `
        SELECT id, type, name, is_default, config, created_at
        FROM storages
        WHERE is_default = 1
        LIMIT 1
      `
      )
      .get()

    if (!storage) {
      throw createError({
        statusCode: 404,
        message: '未设置默认存储',
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
      message: '获取默认存储失败',
    })
  }
})
