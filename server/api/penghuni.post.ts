import { useDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()

  const { alamat, nama_pemilik, kontak, status_hunian, catatan } = body

  if (!alamat || !nama_pemilik || !status_hunian) {
    throw createError({ statusCode: 400, message: 'alamat, nama_pemilik, dan status_hunian wajib diisi' })
  }

  const result = await db.query(
    `INSERT INTO penghuni (alamat, nama_pemilik, kontak, status_hunian, catatan)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [alamat, nama_pemilik, kontak || null, status_hunian, catatan || null]
  )

  return result.rows[0]
})
