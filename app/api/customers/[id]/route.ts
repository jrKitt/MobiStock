import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Customer } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM CUSTOMER WHERE customer_id = ?', [id])) as Customer[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching customer' }, { status: 500 })
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
        return NextResponse.json({ id, ...body })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error updating customer' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM CUSTOMER WHERE customer_id = ?', [id])
        return NextResponse.json({ message: 'Customer deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error deleting customer' }, { status: 500 })
    }
}
