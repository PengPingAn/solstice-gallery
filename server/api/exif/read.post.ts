import fs from 'fs/promises'
import path from 'path'
import { readExifFromFile } from '../../utils/exif/readExif'

export default defineEventHandler(async () => {
  const filePath = path.resolve('server/uploads/test.jpg')

  const buffer = await fs.readFile(filePath)

  const exif = await readExifFromFile(buffer)

  return {
    success: true,
    exif,
  }
})
