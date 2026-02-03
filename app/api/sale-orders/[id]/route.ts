import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { SaleOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM SALE_ORDER WHERE sale_id = ?', [id])) as SaleOrder[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Sale order not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching sale order' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as SaleOrder
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
        console.error(error)
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
        console.error(error)
        return NextResponse.json({ message: 'Error deleting sale order' }, { status: 500 })
    }
}
