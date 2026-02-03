import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { ClaimOrder } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM CLAIM_ORDER ORDER BY claim_id DESC')) as ClaimOrder[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching claim orders' }, { status: 500 })
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
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating claim order' },
            { status: 500 }
        )
    }
}
