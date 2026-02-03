import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { Supplier } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SUPPLIER ORDER BY supplier_id DESC')) as Supplier[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching suppliers' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Supplier
        const {
            supplier_name,
            supplier_phone,
            supplier_email,
            supplier_address,
            supplier_contact_person,
        } = body
        const result = await query(
            'INSERT INTO SUPPLIER (supplier_name, supplier_phone, supplier_email, supplier_address, supplier_contact_person) VALUES (?, ?, ?, ?, ?)',
            [
                supplier_name,
                supplier_phone,
                supplier_email,
                supplier_address,
                supplier_contact_person,
            ]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating supplier' },
            { status: 500 }
        )
    }
}
