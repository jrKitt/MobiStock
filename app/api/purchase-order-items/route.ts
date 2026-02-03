import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { PurchaseOrderItem } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>('SELECT COUNT(*) as total FROM PURCHASE_ORDER_ITEM')
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query('SELECT * FROM PURCHASE_ORDER_ITEM ORDER BY po_item_id DESC LIMIT ? OFFSET ?', [limit, offset])) as PurchaseOrderItem[]
        
        return successResponse(rows, 'Success', 200, { page, limit, total, totalPages })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching purchase order items', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as PurchaseOrderItem
        const { po_price, po_quantity, po_id, model_id } = body
        const result = await query(
            'INSERT INTO PURCHASE_ORDER_ITEM (po_price, po_quantity, po_id, model_id) VALUES (?, ?, ?, ?)',
            [po_price, po_quantity, po_id, model_id]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Purchase order item created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating purchase order item', error)
    }
}
