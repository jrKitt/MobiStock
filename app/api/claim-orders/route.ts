import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ClaimOrder } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit
        const status = searchParams.get('status')

        const queryParams: any[] = []
        const conditions: string[] = []

        if (status) {
            conditions.push(`claim_status = ?`)
            queryParams.push(status)
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        const countQuery = `SELECT COUNT(*) as total FROM CLAIM_ORDER ${whereClause}`
        const countResult = await query<{ total: number }[]>(
            countQuery,
            queryParams
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const selectQuery = `
            SELECT * FROM CLAIM_ORDER 
            ${whereClause} 
            ORDER BY claim_id DESC 
            LIMIT ? OFFSET ?
        `
        const rows = (await query(selectQuery, [
            ...queryParams,
            limit,
            offset,
        ])) as ClaimOrder[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching claim orders', error)
    }
}

export async function POST(req: NextRequest) {
    try {
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
            create_by,
        } = body
        const result = await query(
            'INSERT INTO CLAIM_ORDER (claim_code, claim_date_received, claim_date_returned, claim_status, claim_resolution, supplier_id, customer_id, item_id, create_by, update_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                claim_code,
                claim_date_received,
                claim_date_returned,
                claim_status,
                claim_resolution,
                supplier_id || null,
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
                'claim',
                insertedId,
                'created',
                'Claim order created',
                JSON.stringify({
                    claim_code,
                    claim_date_received,
                    claim_date_returned,
                    claim_status,
                    claim_resolution,
                    supplier_id,
                    customer_id,
                    item_id,
                }),
                create_by || null,
            ]
        )

        return successResponse(
            { id: insertedId, ...body },
            'Claim order created successfully',
            201
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating claim order', error)
    }
}
