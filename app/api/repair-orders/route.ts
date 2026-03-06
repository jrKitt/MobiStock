import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { RepairOrder } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>(
            'SELECT COUNT(*) as total FROM REPAIR_ORDER'
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query(
            'SELECT * FROM REPAIR_ORDER ORDER BY repair_id DESC LIMIT ? OFFSET ?',
            [limit, offset]
        )) as RepairOrder[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
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
            create_by,
        } = body
        const result = await query(
            'INSERT INTO REPAIR_ORDER (repair_problem_desc, repair_technician_note, repair_date_received, repair_date_completed, repair_labor_cost, repair_status, customer_id, item_id, create_by, update_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                repair_problem_desc,
                repair_technician_note,
                repair_date_received,
                repair_date_completed,
                repair_labor_cost,
                repair_status,
                customer_id,
                item_id,
                create_by || null,
                create_by || null,
            ]
        )
        const insertedId = (result as ResultSetHeader).insertId

        // Log history
        await query(
            'INSERT INTO ORDER_HISTORY_LOG (order_type, order_id, action, description, new_data, action_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'repair',
                insertedId,
                'created',
                'Repair order created',
                JSON.stringify({
                    repair_problem_desc,
                    repair_technician_note,
                    repair_date_received,
                    repair_date_completed,
                    repair_labor_cost,
                    repair_status,
                    customer_id,
                    item_id,
                }),
                create_by || null,
            ]
        )

        return successResponse(
            { id: insertedId, ...body },
            'Repair order created successfully',
            201
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating repair order', error)
    }
}
