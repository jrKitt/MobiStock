import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM CLAIM_ORDER ORDER BY claim_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching claim orders' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
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
        const result: any = await query(
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
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating claim order' },
            { status: 500 }
        )
    }
}
