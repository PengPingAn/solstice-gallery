// server/repositories/storage.repo.ts
import { db } from '../../utils/db'

export async function getDefaultStorage() {
  return db
    .prepare(
      `
    SELECT * FROM storages
    WHERE is_default = 1
    LIMIT 1
  `
    )
    .get()
}
