import mysql, { ResultSetHeader, Pool } from 'mysql2/promise'
export type { ResultSetHeader }

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const
const missing = requiredEnv.filter((key) => !process.env[key])

if (missing.length) {
    throw new Error(
        `Missing database environment variables: ${missing.join(', ')}`
    )
}

const dbConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: Number(process.env.DB_PORT ?? '3306'),
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
        rejectUnauthorized: true,
    },
}

const globalForMysql = globalThis as unknown as {
    mysqlPool: Pool | undefined
}

const pool = globalForMysql.mysqlPool ?? mysql.createPool(dbConfig)

if (process.env.NODE_ENV !== 'production') {
    globalForMysql.mysqlPool = pool
}

const checkLimitQuery = async (sql: string, params: QueryParams = []) => {
    if (/limit\s+\?/i.test(sql)) {
        return await pool.query(sql, params)
    }
    return await pool.execute(sql, params)
}

export type QueryParams = (
    | string
    | number
    | boolean
    | null
    | Date
)[]

export async function query<T = unknown>(
    sql: string,
    params: QueryParams = []
): Promise<T> {
    const [results] = await checkLimitQuery(sql, params)
    return results as T
}

export async function getConnection() {
    return await pool.getConnection()
}
