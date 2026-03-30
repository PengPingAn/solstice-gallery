CREATE TABLE IF NOT EXISTS storages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,          -- local | aliyun-oss | qiniu | s3 | r2
  name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  config TEXT NOT NULL,        -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_objects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  storage_id INTEGER NOT NULL,
  object_key TEXT NOT NULL,    -- 统一的对象 key（路径）

  size INTEGER,
  mime_type TEXT,
  hash TEXT,

  width INTEGER,
  height INTEGER,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(storage_id, object_key),
  FOREIGN KEY (storage_id) REFERENCES storages(id)
);

ALTER TABLE images ADD COLUMN original_object_id INTEGER;
ALTER TABLE images ADD COLUMN title TEXT;
ALTER TABLE images ADD COLUMN description TEXT;

CREATE TABLE IF NOT EXISTS image_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id INTEGER NOT NULL,
  object_id INTEGER NOT NULL,
  variant_type TEXT NOT NULL,   -- thumb | webp | avif
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(image_id, variant_type),
  FOREIGN KEY (image_id) REFERENCES images(id),
  FOREIGN KEY (object_id) REFERENCES media_objects(id)
);
-- 封面直接指向 image
ALTER TABLE albums ADD COLUMN cover_object_id INTEGER;
