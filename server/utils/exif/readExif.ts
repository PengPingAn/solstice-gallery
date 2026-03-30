// server/utils/exif/readExif.ts
import { exiftool } from 'exiftool-vendored'

export async function readExifFromFile(filePath: string) {
  const metadata = await exiftool.read(filePath)

  return {
    make: metadata.Make ?? null,
    model: metadata.Model ?? null,
    lens: metadata.LensModel ?? null,
    aperture: metadata.FNumber ?? null,
    shutter: metadata.ExposureTime ?? null,
    iso: metadata.ISO ?? null,
    focalLength: metadata.FocalLength ?? null,
    takenAt: metadata.DateTimeOriginal ?? null,
    width: metadata.ImageWidth ?? null,
    height: metadata.ImageHeight ?? null,
    gps:
      metadata.GPSLatitude && metadata.GPSLongitude
        ? { lat: metadata.GPSLatitude, lng: metadata.GPSLongitude }
        : null,
  }
}
