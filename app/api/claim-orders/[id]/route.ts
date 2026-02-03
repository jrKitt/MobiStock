import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { ClaimOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM CLAIM_ORDER WHERE claim_id = ?', [id])) as ClaimOrder[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Claim order not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching claim order' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as ClaimOrder
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
        console.error(error)
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
        console.error(error)
        return NextResponse.json({ message: 'Error deleting claim order' }, { status: 500 })
    }
}
