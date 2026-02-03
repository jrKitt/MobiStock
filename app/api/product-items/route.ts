import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { ProductItem } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM PRODUCT_ITEM ORDER BY item_id DESC')) as ProductItem[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching product items' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ProductItem
        const {
            item_serial_number,
            item_imei,
            item_lot_number,
            item_status,
            model_id,
        } = body
        const result = await query(
            'INSERT INTO PRODUCT_ITEM (item_serial_number, item_imei, item_lot_number, item_status, model_id) VALUES (?, ?, ?, ?, ?)',
            [
                item_serial_number,
                item_imei,
                item_lot_number,
                item_status,
                model_id,
            ]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating product item' },
            { status: 500 }
        )
    }
}
