import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

export type ProductRow = {
    prod_id: number
    prod_name: string
    status: string | null
    date_received: Date | null
    date_produced: Date | null
    cost_price: number | null
    sell_price: number | null
    made_in: string | null
    serial_number: string | null
    IMEI: string | null
    lot_number: string | null
    warranty_duration: number | null
    cat_id: number | null
    brand_id: number | null
    sup_id: number | null
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
        const pageSize = Math.min(
            Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1),
            100
        )
        const offset = (page - 1) * pageSize
        const search = searchParams.get('q')?.trim()

        const conditions: string[] = []
        const params: (string | number | null)[] = []

        if (search) {
            conditions.push(
                '(name LIKE ? OR serial_number LIKE ? OR IMEI LIKE ?)'
            )
            const pattern = `%${search}%`
            params.push(pattern, pattern, pattern)
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : ''

        // Cast expected result for count query
        const totalRows = (await query(
            `SELECT COUNT(*) AS total FROM Product ${whereClause}`,
            params
        )) as { total: number }[]
        const total = totalRows[0]?.total ?? 0

        // Cast expected result for rows query, ensuring params are passed
        const rows = (await query(
          `SELECT * FROM Product ${whereClause} ORDER BY prod_id DESC LIMIT ${pageSize} OFFSET ${offset}`,
            [...params, pageSize, offset]
        )) as ProductRow[]

        return successResponse({
            data: rows,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.max(Math.ceil(total / pageSize), 1),
            },
        })
    } catch (error) {
        console.error('Failed to fetch products', error)
        return errorResponse('Unable to fetch products', error)
    }
}
