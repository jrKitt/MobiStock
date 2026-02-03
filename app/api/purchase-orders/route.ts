import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM PURCHASE_ORDER ORDER BY po_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching purchase orders' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { po_code, po_date, po_status, supplier_id } = body
        const result: any = await query(
            'INSERT INTO PURCHASE_ORDER (po_code, po_date, po_status, supplier_id) VALUES (?, ?, ?, ?)',
            [po_code, po_date, po_status, supplier_id]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating purchase order' },
            { status: 500 }
        )
    }
}
