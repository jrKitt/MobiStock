import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM PRODUCT_ITEM WHERE item_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Product item not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching product item' }, { status: 500 })
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
            item_serial_number,
            item_imei,
            item_lot_number,
            item_status,
            model_id,
        } = body
        await query(
            'UPDATE PRODUCT_ITEM SET item_serial_number = ?, item_imei = ?, item_lot_number = ?, item_status = ?, model_id = ? WHERE item_id = ?',
            [
                item_serial_number,
                item_imei,
                item_lot_number,
                item_status,
                model_id,
                id,
            ]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating product item' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PRODUCT_ITEM WHERE item_id = ?', [id])
        return NextResponse.json({ message: 'Product item deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting product item' }, { status: 500 })
    }
}
