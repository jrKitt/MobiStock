import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM SALE_ORDER ORDER BY sale_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching sale orders' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            sale_code,
            sale_date,
            sale_total_amount,
            sale_status,
            customer_id,
        } = body
        const result: any = await query(
            'INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_status, customer_id) VALUES (?, ?, ?, ?, ?)',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                sale_status,
                customer_id,
            ]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating sale order' },
            { status: 500 }
        )
    }
}
