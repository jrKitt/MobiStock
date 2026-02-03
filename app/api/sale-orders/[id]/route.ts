import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM SALE_ORDER WHERE sale_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Sale order not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching sale order' }, { status: 500 })
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
            sale_code,
            sale_date,
            sale_total_amount,
            sale_status,
            customer_id,
        } = body
        await query(
            'UPDATE SALE_ORDER SET sale_code = ?, sale_date = ?, sale_total_amount = ?, sale_status = ?, customer_id = ? WHERE sale_id = ?',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                sale_status,
                customer_id,
                id,
            ]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating sale order' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SALE_ORDER WHERE sale_id = ?', [id])
        return NextResponse.json({ message: 'Sale order deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting sale order' }, { status: 500 })
    }
}
