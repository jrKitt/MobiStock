import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrderItem } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>('SELECT COUNT(*) as total FROM SALE_ORDER_ITEM')
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query('SELECT * FROM SALE_ORDER_ITEM ORDER BY sale_item_id DESC LIMIT ? OFFSET ?', [limit, offset])) as SaleOrderItem[]
        
        return successResponse(rows, 'Success', 200, { page, limit, total, totalPages })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching sale order items', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SaleOrderItem
        const { sale_price, sale_id, item_id } = body
        const result = await query(
            'INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (?, ?, ?)',
            [sale_price, sale_id, item_id]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Sale order item created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating sale order item', error)
    }
}
