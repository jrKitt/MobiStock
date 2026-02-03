import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Supplier } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SUPPLIER ORDER BY supplier_id DESC')) as Supplier[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching suppliers', error)
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
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Supplier created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating supplier', error)
    }
}
