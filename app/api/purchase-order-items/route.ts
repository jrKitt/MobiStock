import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { PurchaseOrderItem } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM PURCHASE_ORDER_ITEM ORDER BY po_item_id DESC')) as PurchaseOrderItem[]
        return successResponse(rows)
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
