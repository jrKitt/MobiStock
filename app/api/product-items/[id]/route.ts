import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ProductItem } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM PRODUCT_ITEM WHERE item_id = ?', [id])) as ProductItem[]
        if (rows.length === 0) {
            return errorResponse('Product item not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching product item', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as ProductItem
        const {
            item_serial_number,
            item_imei,
            item_lot_number,
            item_status,
            model_id,
        } = body
        await query(
            'UPDATE PRODUCT_ITEM SET item_serial_number = ?, item_imei = ?, item_lot_number = ?, item_status = ?, model_id = ? WHERE item_id = ?',
            [
                item_serial_number,
                item_imei,
                item_lot_number,
                item_status,
                model_id,
                id,
            ]
        )
        return successResponse({ id, ...body }, 'Product item updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating product item', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PRODUCT_ITEM WHERE item_id = ?', [id])
        return successResponse(null, 'Product item deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting product item', error)
    }
}
