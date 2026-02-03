import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { SaleOrderItem } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SALE_ORDER_ITEM ORDER BY sale_item_id DESC')) as SaleOrderItem[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching sale order items' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SaleOrderItem
        const { sale_price, sale_id, item_id } = body
        const result = await query(
            'INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (?, ?, ?)',
            [sale_price, sale_id, item_id]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating sale order item' },
            { status: 500 }
        )
    }
}
