import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import 'dotenv/config'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function addColumnIfNotExists(
    connection,
    tableName,
    columnName,
    columnDefinition
) {
    const [rows] = await connection.query(
        `
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
    `,
        [tableName, columnName]
    )

    if (rows[0].count === 0) {
        console.log(`Adding column ${columnName} to ${tableName}...`)
        await connection.query(
            `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
        )
    } else {
        console.log(`Column ${columnName} already exists in ${tableName}.`)
    }
}

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
        const schemaPath = path.join(__dirname, '../database/schema.sql')
        const schemaSql = fs.readFileSync(schemaPath, 'utf8')

        console.log('Executing schema.sql...')
        await connection.query(schemaSql)

        console.log('Ensuring all image_url columns exist...')
        await addColumnIfNotExists(
            connection,
            'BRAND',
            'image_url',
            'VARCHAR(255) NULL'
        )
        await addColumnIfNotExists(
            connection,
            'PRODUCT_MODEL',
            'image_url',
            'VARCHAR(255) NULL'
        )
        await addColumnIfNotExists(
            connection,
            'SPARE_PART',
            'image_url',
            'VARCHAR(255) NULL'
        )
        await addColumnIfNotExists(
            connection,
            'SUPPLIER',
            'image_url',
            'VARCHAR(255) NULL'
        )

        console.log('Migration completed successfully.')
    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        await connection.end()
    }
}

runMigration()
