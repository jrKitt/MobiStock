import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Supplier } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM SUPPLIER WHERE supplier_id = ?', [id])) as Supplier[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Supplier not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching supplier' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as Supplier
        const {
            supplier_name,
            supplier_phone,
            supplier_email,
            supplier_address,
            supplier_contact_person,
        } = body
        await query(
            'UPDATE SUPPLIER SET supplier_name = ?, supplier_phone = ?, supplier_email = ?, supplier_address = ?, supplier_contact_person = ? WHERE supplier_id = ?',
            [
                supplier_name,
                supplier_phone,
                supplier_email,
                supplier_address,
                supplier_contact_person,
                id,
            ]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error updating supplier' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SUPPLIER WHERE supplier_id = ?', [id])
        return NextResponse.json({ message: 'Supplier deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error deleting supplier' }, { status: 500 })
    }
}
