import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM SALE_ORDER_ITEM ORDER BY sale_item_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching sale order items' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { sale_price, sale_id, item_id } = body
        const result: any = await query(
            'INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (?, ?, ?)',
            [sale_price, sale_id, item_id]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating sale order item' },
            { status: 500 }
        )
    }
}
