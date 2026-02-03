import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { PurchaseOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM PURCHASE_ORDER WHERE po_id = ?', [id])) as PurchaseOrder[]
        if (rows.length === 0) {
            return errorResponse('Purchase order not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching purchase order', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as PurchaseOrder
        const { po_code, po_date, po_status, supplier_id } = body
        await query(
            'UPDATE PURCHASE_ORDER SET po_code = ?, po_date = ?, po_status = ?, supplier_id = ? WHERE po_id = ?',
            [po_code, po_date, po_status, supplier_id, id]
        )
        return successResponse({ id, ...body }, 'Purchase order updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating purchase order', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PURCHASE_ORDER WHERE po_id = ?', [id])
        return successResponse(null, 'Purchase order deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting purchase order', error)
    }
}
