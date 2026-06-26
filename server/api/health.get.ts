import { useDb } from '../utils/db'

export default defineEventHandler(async () => {
  try {
    const db = useDb()
    await db.query('SELECT 1')
    return { ok: true, db: 'connected' }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
})
