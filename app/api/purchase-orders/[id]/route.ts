import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM PURCHASE_ORDER WHERE po_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Purchase order not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching purchase order' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { po_code, po_date, po_status, supplier_id } = body
        await query(
            'UPDATE PURCHASE_ORDER SET po_code = ?, po_date = ?, po_status = ?, supplier_id = ? WHERE po_id = ?',
            [po_code, po_date, po_status, supplier_id, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating purchase order' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PURCHASE_ORDER WHERE po_id = ?', [id])
        return NextResponse.json({ message: 'Purchase order deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting purchase order' }, { status: 500 })
    }
}
