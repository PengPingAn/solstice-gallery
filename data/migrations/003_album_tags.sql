CREATE TABLE IF NOT EXISTS album_tags (
  album_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (album_id, tag),
  FOREIGN KEY (album_id) REFERENCES albums(id)
);
