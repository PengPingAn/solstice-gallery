// server/api/photo/list.ts
import fs from 'fs/promises'
import { defineEventHandler } from 'h3'
import path from 'path'

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']

export default defineEventHandler(async () => {
  const baseDir = path.resolve('data/images')
  const urls: string[] = []

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (IMAGE_EXTS.includes(ext)) {
          const buffer = await fs.readFile(fullPath)
          urls.push(`data:image/${ext.replace('.', '')};base64,${buffer.toString('base64')}`)
        }
      }
    }
  }

  await walk(baseDir)
  return urls
})
