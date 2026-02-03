import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { PurchaseOrderItem } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM PURCHASE_ORDER_ITEM WHERE po_item_id = ?', [id])) as PurchaseOrderItem[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Purchase order item not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching purchase order item' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as PurchaseOrderItem
        const { po_price, po_quantity, po_id, model_id } = body
        await query(
            'UPDATE PURCHASE_ORDER_ITEM SET po_price = ?, po_quantity = ?, po_id = ?, model_id = ? WHERE po_item_id = ?',
            [po_price, po_quantity, po_id, model_id, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        console.error(error)
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
        console.error(error)
        return NextResponse.json({ message: 'Error deleting purchase order item' }, { status: 500 })
    }
}
