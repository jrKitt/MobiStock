import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { PurchaseOrderItem } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM PURCHASE_ORDER_ITEM ORDER BY po_item_id DESC')) as PurchaseOrderItem[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching purchase order items' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as PurchaseOrderItem
        const { po_price, po_quantity, po_id, model_id } = body
        const result = await query(
            'INSERT INTO PURCHASE_ORDER_ITEM (po_price, po_quantity, po_id, model_id) VALUES (?, ?, ?, ?)',
            [po_price, po_quantity, po_id, model_id]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating purchase order item' },
            { status: 500 }
        )
    }
}
