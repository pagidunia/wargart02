import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = event.method
  const db = useDb()

  if (method === 'GET') {
    const result = await db.query('SELECT * FROM penghuni WHERE id = $1', [id])
    if (!result.rows[0]) throw createError({ statusCode: 404, message: 'Data tidak ditemukan' })
    return result.rows[0]
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const { alamat, nama_pemilik, kontak, status_hunian, catatan } = body

    const result = await db.query(
      `UPDATE penghuni
       SET alamat=$1, nama_pemilik=$2, kontak=$3, status_hunian=$4, catatan=$5
       WHERE id=$6
       RETURNING *`,
      [alamat, nama_pemilik, kontak || null, status_hunian, catatan || null, id]
    )
    if (!result.rows[0]) throw createError({ statusCode: 404, message: 'Data tidak ditemukan' })
    return result.rows[0]
  }

  if (method === 'DELETE') {
    await db.query('UPDATE penghuni SET aktif=FALSE WHERE id=$1', [id])
    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
