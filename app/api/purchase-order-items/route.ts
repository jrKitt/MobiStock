import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM PURCHASE_ORDER_ITEM ORDER BY po_item_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching purchase order items' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { po_price, po_quantity, po_id, model_id } = body
        const result: any = await query(
            'INSERT INTO PURCHASE_ORDER_ITEM (po_price, po_quantity, po_id, model_id) VALUES (?, ?, ?, ?)',
            [po_price, po_quantity, po_id, model_id]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating purchase order item' },
            { status: 500 }
        )
    }
}
