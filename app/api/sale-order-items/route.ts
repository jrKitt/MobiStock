import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrderItem } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SALE_ORDER_ITEM ORDER BY sale_item_id DESC')) as SaleOrderItem[]
        return successResponse(rows)
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
