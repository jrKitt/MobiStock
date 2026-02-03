import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Supplier } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>('SELECT COUNT(*) as total FROM SUPPLIER')
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query('SELECT * FROM SUPPLIER ORDER BY supplier_id DESC LIMIT ? OFFSET ?', [limit, offset])) as Supplier[]
        
        return successResponse(rows, 'Success', 200, { page, limit, total, totalPages })
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
