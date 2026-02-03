import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ProductItem } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>('SELECT COUNT(*) as total FROM PRODUCT_ITEM')
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query('SELECT * FROM PRODUCT_ITEM ORDER BY item_id DESC LIMIT ? OFFSET ?', [limit, offset])) as ProductItem[]

        return successResponse(rows, 'Success', 200, { page, limit, total, totalPages })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching product items', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ProductItem
        const {
            item_serial_number,
            item_imei,
            item_lot_number,
            item_status,
            model_id,
        } = body
        const result = await query(
            'INSERT INTO PRODUCT_ITEM (item_serial_number, item_imei, item_lot_number, item_status, model_id) VALUES (?, ?, ?, ?, ?)',
            [
                item_serial_number,
                item_imei,
                item_lot_number,
                item_status,
                model_id,
            ]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Product item created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating product item', error)
    }
}
