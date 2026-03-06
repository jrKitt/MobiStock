import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ClaimOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query(
            'SELECT * FROM CLAIM_ORDER WHERE claim_id = ?',
            [id]
        )) as ClaimOrder[]
        if (rows.length === 0) {
            return errorResponse('Claim order not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching claim order', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as ClaimOrder
        const {
            claim_code,
            claim_date_received,
            claim_date_returned,
            claim_status,
            claim_resolution,
            supplier_id,
            customer_id,
            item_id,
            update_by,
        } = body
        await query(
            'UPDATE CLAIM_ORDER SET claim_code = ?, claim_date_received = ?, claim_date_returned = ?, claim_status = ?, claim_resolution = ?, supplier_id = ?, customer_id = ?, item_id = ?, update_by = ? WHERE claim_id = ?',
            [
                claim_code,
                claim_date_received,
                claim_date_returned,
                claim_status,
                claim_resolution,
                supplier_id || null,
                customer_id,
                item_id,
                update_by || null,
                id,
            ]
        )
        return successResponse(
            { id, ...body },
            'Claim order updated successfully'
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating claim order', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM CLAIM_ORDER WHERE claim_id = ?', [id])
        return successResponse(null, 'Claim order deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting claim order', error)
    }
}
