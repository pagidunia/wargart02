import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function useDb() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'wargart02',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
        ? { rejectUnauthorized: false }
        : false,
    })
  }
  return pool
}
