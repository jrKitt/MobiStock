import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { SaleOrder } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SALE_ORDER ORDER BY sale_id DESC')) as SaleOrder[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching sale orders' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SaleOrder
        const {
            sale_code,
            sale_date,
            sale_total_amount,
            sale_status,
            customer_id,
        } = body
        const result = await query(
            'INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_status, customer_id) VALUES (?, ?, ?, ?, ?)',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                sale_status,
                customer_id,
            ]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating sale order' },
            { status: 500 }
        )
    }
}
