import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM REPAIR_ORDER WHERE repair_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Repair order not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching repair order' }, { status: 500 })
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
            repair_problem_desc,
            repair_technician_note,
            repair_date_received,
            repair_date_completed,
            repair_labor_cost,
            repair_status,
            customer_id,
            item_id,
        } = body
        await query(
            'UPDATE REPAIR_ORDER SET repair_problem_desc = ?, repair_technician_note = ?, repair_date_received = ?, repair_date_completed = ?, repair_labor_cost = ?, repair_status = ?, customer_id = ?, item_id = ? WHERE repair_id = ?',
            [
                repair_problem_desc,
                repair_technician_note,
                repair_date_received,
                repair_date_completed,
                repair_labor_cost,
                repair_status,
                customer_id,
                item_id,
                id,
            ]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating repair order' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM REPAIR_ORDER WHERE repair_id = ?', [id])
        return NextResponse.json({ message: 'Repair order deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting repair order' }, { status: 500 })
    }
}
