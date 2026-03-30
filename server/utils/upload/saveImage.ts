import fs from 'fs'
import path from 'path'

export async function saveImage(buffer: Buffer, filename: string) {
  const now = new Date()

  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')

  // ✅ 项目根目录 /data/images
  const baseDir = path.resolve('data/images')

  const dir = path.join(baseDir, year, month)

  fs.mkdirSync(dir, { recursive: true })

  const filePath = path.join(dir, `${Date.now()}-${filename}`)
  fs.writeFileSync(filePath, buffer)

  return filePath
}
