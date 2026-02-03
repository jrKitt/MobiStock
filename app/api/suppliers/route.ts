import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM SUPPLIER ORDER BY supplier_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching suppliers' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            supplier_name,
            supplier_phone,
            supplier_email,
            supplier_address,
            supplier_contact_person,
        } = body
        const result: any = await query(
            'INSERT INTO SUPPLIER (supplier_name, supplier_phone, supplier_email, supplier_address, supplier_contact_person) VALUES (?, ?, ?, ?, ?)',
            [
                supplier_name,
                supplier_phone,
                supplier_email,
                supplier_address,
                supplier_contact_person,
            ]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating supplier' },
            { status: 500 }
        )
    }
}
