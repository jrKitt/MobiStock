import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Customer } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM CUSTOMER WHERE customer_id = ?', [id])) as Customer[]
        if (rows.length === 0) {
            return errorResponse('Customer not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching customer', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as Customer
        const {
            customer_fname,
            customer_lname,
            customer_phone,
            customer_tax_number,
            customer_address,
        } = body
        await query(
            'UPDATE CUSTOMER SET customer_fname = ?, customer_lname = ?, customer_phone = ?, customer_tax_number = ?, customer_address = ? WHERE customer_id = ?',
            [
                customer_fname,
                customer_lname,
                customer_phone,
                customer_tax_number,
                customer_address,
                id,
            ]
        )
        return successResponse({ id, ...body }, 'Customer updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating customer', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM CUSTOMER WHERE customer_id = ?', [id])
        return successResponse(null, 'Customer deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting customer', error)
    }
}
