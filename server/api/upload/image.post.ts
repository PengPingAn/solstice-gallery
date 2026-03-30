import { randomUUID } from 'crypto'
import { readMultipartFormData } from 'h3'
import { success } from '../../utils/response'
import { uploadImageToAlbum } from '../../utils/upload/upload.service'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)

  const albumPath = form?.find((f) => f.name === 'albumPath')?.data?.toString()

  if (!albumPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing album path',
    })
  }

  const file = form?.find((f) => f.name === 'file')

  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file',
    })
  }

  const ext = file.type?.split('/')[1] || 'jpg'

  // 如果 filename 合法就用，否则生成
  let safeName: string

  if (file.filename && /^[a-zA-Z0-9._-]+$/.test(file.filename)) {
    safeName = file.filename
  } else {
    safeName = `${randomUUID()}.${ext}`
  }

  const result = await uploadImageToAlbum({
    albumPath,
    buffer: file.data,
    filename: safeName,
    mimeType: file.type,
  })

  return success(result)
})
