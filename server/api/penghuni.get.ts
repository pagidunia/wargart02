import { useDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = useDb()

  const search = query.search as string | undefined

  let sql = `
    SELECT id, alamat, rt, rw, nama_pemilik, kontak, status_hunian, aktif, catatan, created_at, updated_at
    FROM penghuni
    WHERE aktif = TRUE
  `
  const params: string[] = []

  if (search) {
    params.push(`%${search}%`)
    sql += ` AND (nama_pemilik ILIKE $1 OR alamat ILIKE $1)`
  }

  sql += ` ORDER BY id DESC`

  const result = await db.query(sql, params)
  return result.rows
})
