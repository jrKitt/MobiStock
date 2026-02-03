import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM PRODUCT_ITEM ORDER BY item_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching product items' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            item_serial_number,
            item_imei,
            item_lot_number,
            item_status,
            model_id,
        } = body
        const result: any = await query(
            'INSERT INTO PRODUCT_ITEM (item_serial_number, item_imei, item_lot_number, item_status, model_id) VALUES (?, ?, ?, ?, ?)',
            [
                item_serial_number,
                item_imei,
                item_lot_number,
                item_status,
                model_id,
            ]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating product item' },
            { status: 500 }
        )
    }
}
