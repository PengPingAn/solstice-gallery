// server/utils/upload.post.ts
import { readMultipartFormData } from 'h3'
import path from 'path'
import { createDefaultStorageProvider } from '../../infrastructure/storage/storage.factory'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find((f) => f.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'No file' })
  }

  const ext = path.extname(file.filename || '')
  const ossPath = `images/original/${Date.now()}${ext}`

  const storage = await createDefaultStorageProvider()

  const result = await storage.uploadBuffer(file.data, ossPath, file.type)

  return {
    success: true,
    ...result,
  }
})
