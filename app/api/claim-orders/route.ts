import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ClaimOrder } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM CLAIM_ORDER ORDER BY claim_id DESC')) as ClaimOrder[]
        return successResponse(rows)
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
        } = body
        const result = await query(
            'INSERT INTO CLAIM_ORDER (claim_code, claim_date_received, claim_date_returned, claim_status, claim_resolution, supplier_id, customer_id, item_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                claim_code,
                claim_date_received,
                claim_date_returned,
                claim_status,
                claim_resolution,
                supplier_id,
                customer_id,
                item_id,
            ]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Claim order created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating claim order', error)
    }
}
