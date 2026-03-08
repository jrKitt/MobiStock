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

        const search = searchParams.get('search')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const status = searchParams.get('status')

        let queryStr = `
            SELECT ro.*, 
                   c.customer_fname, c.customer_lname, c.customer_phone,
                   pi.item_serial_number, pi.item_imei,
                   pm.model_name
            FROM REPAIR_ORDER ro
            LEFT JOIN CUSTOMER c ON ro.customer_id = c.customer_id
            LEFT JOIN PRODUCT_ITEM pi ON ro.item_id = pi.item_id
            LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id
            WHERE 1=1
        `
        let countQueryStr = `
            SELECT COUNT(*) as total 
            FROM REPAIR_ORDER ro
            LEFT JOIN CUSTOMER c ON ro.customer_id = c.customer_id
            LEFT JOIN PRODUCT_ITEM pi ON ro.item_id = pi.item_id
            LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id
            WHERE 1=1
        `
        const queryParams: any[] = []

        if (search) {
            const searchTerm = `%${search}%`
            const searchCondition = ` AND (ro.repair_id LIKE ? OR c.customer_fname LIKE ? OR c.customer_lname LIKE ? OR c.customer_phone LIKE ? OR pi.item_serial_number LIKE ? OR pi.item_imei LIKE ?)`
            queryStr += searchCondition
            countQueryStr += searchCondition
            queryParams.push(
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm,
                searchTerm
            )
        }

        if (status) {
            queryStr += ` AND ro.repair_status = ?`
            countQueryStr += ` AND ro.repair_status = ?`
            queryParams.push(status)
        }

        if (startDate && startDate !== 'undefined' && startDate !== '') {
            queryStr += ` AND DATE(ro.repair_date_received) >= ?`
            countQueryStr += ` AND DATE(ro.repair_date_received) >= ?`
            queryParams.push(startDate)
        }

        if (endDate && endDate !== 'undefined' && endDate !== '') {
            queryStr += ` AND DATE(ro.repair_date_received) <= ?`
            countQueryStr += ` AND DATE(ro.repair_date_received) <= ?`
            queryParams.push(endDate)
        }

        const countResult = await query<{ total: number }[]>(
            countQueryStr,
            queryParams
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        queryStr += ` ORDER BY ro.repair_id DESC LIMIT ? OFFSET ?`
        queryParams.push(limit, offset)

        const rows = (await query(queryStr, queryParams)) as any[]

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
