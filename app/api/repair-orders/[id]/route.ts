import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { RepairOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query(
            'SELECT * FROM REPAIR_ORDER WHERE repair_id = ?',
            [id]
        )) as RepairOrder[]
        if (rows.length === 0) {
            return errorResponse('Repair order not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching repair order', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as RepairOrder
        const {
            repair_problem_desc,
            repair_technician_note,
            repair_date_received,
            repair_date_completed,
            repair_labor_cost,
            repair_status,
            customer_id,
            item_id,
            update_by,
        } = body
        await query(
            'UPDATE REPAIR_ORDER SET repair_problem_desc = ?, repair_technician_note = ?, repair_date_received = ?, repair_date_completed = ?, repair_labor_cost = ?, repair_status = ?, customer_id = ?, item_id = ?, update_by = ? WHERE repair_id = ?',
            [
                repair_problem_desc,
                repair_technician_note,
                repair_date_received,
                repair_date_completed,
                repair_labor_cost,
                repair_status,
                customer_id,
                item_id,
                update_by || null,
                id,
            ]
        )
        return successResponse(
            { id, ...body },
            'Repair order updated successfully'
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating repair order', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM REPAIR_ORDER WHERE repair_id = ?', [id])
        return successResponse(null, 'Repair order deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting repair order', error)
    }
}
