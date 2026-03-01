import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import 'dotenv/config'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// addColumnIfNotExists removed as we drop tables now

async function runMigration() {
    console.log('Starting migration...')

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 3306),
        multipleStatements: true,
        ssl: {
            rejectUnauthorized: true,
        },
    })

    try {
        console.log('Dropping tables (except User)...')
        const tablesToDrop = [
            'CLAIM_ORDER',
            'REPAIR_ORDER_PART',
            'REPAIR_ORDER',
            'SUPPLIER_SPARE_PART',
            'SPARE_PART',
            'SALE_ORDER_ITEM',
            'SALE_ORDER',
            'PRODUCT_ITEM',
            'PRODUCT_MODEL',
            'CUSTOMER',
            'SUPPLIER',
            'CATEGORY',
            'BRAND',
        ]

        await connection.query('SET FOREIGN_KEY_CHECKS = 0')
        for (const table of tablesToDrop) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`)
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1')

        const schemaPath = path.join(__dirname, '../database/schema.sql')
        const schemaSql = fs.readFileSync(schemaPath, 'utf8')

        console.log('Executing schema.sql...')
        await connection.query(schemaSql)

        console.log('Migration completed successfully.')
    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        await connection.end()
    }
}

runMigration()
