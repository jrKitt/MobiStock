import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM SALE_ORDER WHERE sale_id = ?', [id])) as SaleOrder[]
        if (rows.length === 0) {
            return errorResponse('Sale order not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching sale order', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as SaleOrder
        const {
            sale_code,
            sale_date,
            sale_total_amount,
            sale_status,
            customer_id,
        } = body
        await query(
            'UPDATE SALE_ORDER SET sale_code = ?, sale_date = ?, sale_total_amount = ?, sale_status = ?, customer_id = ? WHERE sale_id = ?',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                sale_status,
                customer_id,
                id,
            ]
        )
        return successResponse({ id, ...body }, 'Sale order updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating sale order', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SALE_ORDER WHERE sale_id = ?', [id])
        return successResponse(null, 'Sale order deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting sale order', error)
    }
}
