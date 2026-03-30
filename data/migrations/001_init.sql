-- 相册表
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  cover_mode INTEGER DEFAULT 1,   -- 1 = 最新图片
  last_upload_date DATETIME DEFAULT,
  cover_image_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 图片表
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER,
  filename TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size INTEGER,
  exif TEXT,
  path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id)
);

CREATE INDEX IF NOT EXISTS idx_images_album
ON images(album_id);
