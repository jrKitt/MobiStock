import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM SUPPLIER WHERE supplier_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Supplier not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching supplier' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
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
        return NextResponse.json({ message: 'Error deleting supplier' }, { status: 500 })
    }
}
