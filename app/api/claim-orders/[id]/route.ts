import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM CLAIM_ORDER WHERE claim_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Claim order not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching claim order' }, { status: 500 })
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
            claim_code,
            claim_date_received,
            claim_date_returned,
            claim_status,
            claim_resolution,
            supplier_id,
            customer_id,
            item_id,
        } = body
        await query(
            'UPDATE CLAIM_ORDER SET claim_code = ?, claim_date_received = ?, claim_date_returned = ?, claim_status = ?, claim_resolution = ?, supplier_id = ?, customer_id = ?, item_id = ? WHERE claim_id = ?',
            [
                claim_code,
                claim_date_received,
                claim_date_returned,
                claim_status,
                claim_resolution,
                supplier_id,
                customer_id,
                item_id,
                id,
            ]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating claim order' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM CLAIM_ORDER WHERE claim_id = ?', [id])
        return NextResponse.json({ message: 'Claim order deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting claim order' }, { status: 500 })
    }
}
