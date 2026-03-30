import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export async function createBaseImage(outputPath: string) {
  const buffer = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: { r: 200, g: 180, b: 120 },
    },
  })
    .jpeg()
    .toBuffer()

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, buffer)
}
