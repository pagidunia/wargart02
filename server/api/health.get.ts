import { useDb } from '../utils/db'

export default defineEventHandler(async () => {
  try {
    const db = useDb()
    await db.query('SELECT 1')
    return { ok: true, db: 'connected' }
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      code: (e as Record<string, unknown>)?.code,
      hasUrl: !!process.env.DATABASE_URL,
      hasHost: !!process.env.DB_HOST,
    }
  }
})
