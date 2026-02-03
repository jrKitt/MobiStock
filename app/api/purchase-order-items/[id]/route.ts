import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { PurchaseOrderItem } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM PURCHASE_ORDER_ITEM WHERE po_item_id = ?', [id])) as PurchaseOrderItem[]
        if (rows.length === 0) {
            return errorResponse('Purchase order item not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching purchase order item', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as PurchaseOrderItem
        const { po_price, po_quantity, po_id, model_id } = body
        await query(
            'UPDATE PURCHASE_ORDER_ITEM SET po_price = ?, po_quantity = ?, po_id = ?, model_id = ? WHERE po_item_id = ?',
            [po_price, po_quantity, po_id, model_id, id]
        )
        return successResponse({ id, ...body }, 'Purchase order item updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating purchase order item', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PURCHASE_ORDER_ITEM WHERE po_item_id = ?', [id])
        return successResponse(null, 'Purchase order item deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting purchase order item', error)
    }
}
