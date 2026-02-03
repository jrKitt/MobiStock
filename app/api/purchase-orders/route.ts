import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { PurchaseOrder } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM PURCHASE_ORDER ORDER BY po_id DESC')) as PurchaseOrder[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching purchase orders' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as PurchaseOrder
        const { po_code, po_date, po_status, supplier_id } = body
        const result = await query(
            'INSERT INTO PURCHASE_ORDER (po_code, po_date, po_status, supplier_id) VALUES (?, ?, ?, ?)',
            [po_code, po_date, po_status, supplier_id]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating purchase order' },
            { status: 500 }
        )
    }
}
