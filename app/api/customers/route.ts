import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM CUSTOMER ORDER BY customer_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching customers' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            customer_fname,
            customer_lname,
            customer_phone,
            customer_tax_number,
            customer_address,
        } = body
        const result: any = await query(
            'INSERT INTO CUSTOMER (customer_fname, customer_lname, customer_phone, customer_tax_number, customer_address) VALUES (?, ?, ?, ?, ?)',
            [
                customer_fname,
                customer_lname,
                customer_phone,
                customer_tax_number,
                customer_address,
            ]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating customer' },
            { status: 500 }
        )
    }
}
