import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { PurchaseOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM PURCHASE_ORDER WHERE po_id = ?', [id])) as PurchaseOrder[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Purchase order not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching purchase order' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as PurchaseOrder
        const { po_code, po_date, po_status, supplier_id } = body
        await query(
            'UPDATE PURCHASE_ORDER SET po_code = ?, po_date = ?, po_status = ?, supplier_id = ? WHERE po_id = ?',
            [po_code, po_date, po_status, supplier_id, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        console.error(error)
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
        console.error(error)
        return NextResponse.json({ message: 'Error deleting purchase order' }, { status: 500 })
    }
}
