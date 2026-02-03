import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Customer } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM CUSTOMER ORDER BY customer_id DESC')) as Customer[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching customers', error)
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
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Customer created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating customer', error)
    }
}
