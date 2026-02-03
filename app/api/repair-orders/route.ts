import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { RepairOrder } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM REPAIR_ORDER ORDER BY repair_id DESC')) as RepairOrder[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching repair orders', error)
    }
}

export async function POST(req: NextRequest) {
    try {
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
        } = body
        const result = await query(
            'INSERT INTO REPAIR_ORDER (repair_problem_desc, repair_technician_note, repair_date_received, repair_date_completed, repair_labor_cost, repair_status, customer_id, item_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                repair_problem_desc,
                repair_technician_note,
                repair_date_received,
                repair_date_completed,
                repair_labor_cost,
                repair_status,
                customer_id,
                item_id,
            ]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Repair order created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating repair order', error)
    }
}
