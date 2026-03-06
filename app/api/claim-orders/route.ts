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

        const countResult = await query<{ total: number }[]>(
            'SELECT COUNT(*) as total FROM CLAIM_ORDER'
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query(
            'SELECT * FROM CLAIM_ORDER ORDER BY claim_id DESC LIMIT ? OFFSET ?',
            [limit, offset]
        )) as ClaimOrder[]

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
        return successResponse(
            { id: (result as ResultSetHeader).insertId, ...body },
            'Claim order created successfully',
            201
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating claim order', error)
    }
}
