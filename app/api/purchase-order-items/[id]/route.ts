import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM PURCHASE_ORDER_ITEM WHERE po_item_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Purchase order item not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching purchase order item' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { po_price, po_quantity, po_id, model_id } = body
        await query(
            'UPDATE PURCHASE_ORDER_ITEM SET po_price = ?, po_quantity = ?, po_id = ?, model_id = ? WHERE po_item_id = ?',
            [po_price, po_quantity, po_id, model_id, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating purchase order item' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PURCHASE_ORDER_ITEM WHERE po_item_id = ?', [id])
        return NextResponse.json({ message: 'Purchase order item deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting purchase order item' }, { status: 500 })
    }
}
