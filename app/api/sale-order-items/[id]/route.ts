import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrderItem } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM SALE_ORDER_ITEM WHERE sale_item_id = ?', [id])) as SaleOrderItem[]
        if (rows.length === 0) {
            return errorResponse('Sale order item not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching sale order item', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as SaleOrderItem
        const { sale_price, sale_id, item_id } = body
        await query(
            'UPDATE SALE_ORDER_ITEM SET sale_price = ?, sale_id = ?, item_id = ? WHERE sale_item_id = ?',
            [sale_price, sale_id, item_id, id]
        )
        return successResponse({ id, ...body }, 'Sale order item updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating sale order item', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SALE_ORDER_ITEM WHERE sale_item_id = ?', [id])
        return successResponse(null, 'Sale order item deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting sale order item', error)
    }
}
