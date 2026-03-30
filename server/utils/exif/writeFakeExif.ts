import { exiftool } from 'exiftool-vendored'

export async function writeFakeExif(filePath: string) {
  await exiftool.write(filePath, {
    Make: 'Canon',
    Model: 'EOS R5',
    LensModel: 'RF 50mm F1.8 STM',

    FNumber: 1.8,
    ExposureTime: '1/125',
    ISO: 100,
    FocalLength: 50,

    DateTimeOriginal: '2024:11:28 16:32:10',

    GPSLatitude: 25.033964,
    GPSLongitude: 121.564468,
    GPSLatitudeRef: 'N',
    GPSLongitudeRef: 'E',
  })
}
