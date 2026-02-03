import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { Customer } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM CUSTOMER ORDER BY customer_id DESC')) as Customer[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching customers' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Customer
        const {
            customer_fname,
            customer_lname,
            customer_phone,
            customer_tax_number,
            customer_address,
        } = body
        const result = await query(
            'INSERT INTO CUSTOMER (customer_fname, customer_lname, customer_phone, customer_tax_number, customer_address) VALUES (?, ?, ?, ?, ?)',
            [
                customer_fname,
                customer_lname,
                customer_phone,
                customer_tax_number,
                customer_address,
            ]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating customer' },
            { status: 500 }
        )
    }
}
