import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { SaleOrderItem } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM SALE_ORDER_ITEM WHERE sale_item_id = ?', [id])) as SaleOrderItem[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Sale order item not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching sale order item' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as SaleOrderItem
        const { sale_price, sale_id, item_id } = body
        await query(
            'UPDATE SALE_ORDER_ITEM SET sale_price = ?, sale_id = ?, item_id = ? WHERE sale_item_id = ?',
            [sale_price, sale_id, item_id, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error updating sale order item' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SALE_ORDER_ITEM WHERE sale_item_id = ?', [id])
        return NextResponse.json({ message: 'Sale order item deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error deleting sale order item' }, { status: 500 })
    }
}
