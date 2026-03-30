import path from 'path'
import { createBaseImage } from '../../utils/exif/createBaseImage'
import { writeFakeExif } from '../../utils/exif/writeFakeExif'

export default defineEventHandler(async () => {
  const filePath = path.resolve('server/uploads/test.jpg')

  await createBaseImage(filePath)
  await writeFakeExif(filePath)

  return {
    success: true,
    filePath,
  }
})
