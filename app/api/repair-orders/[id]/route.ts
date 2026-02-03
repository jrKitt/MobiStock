import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { RepairOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM REPAIR_ORDER WHERE repair_id = ?', [id])) as RepairOrder[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Repair order not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching repair order' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as RepairOrder
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
        console.error(error)
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
        console.error(error)
        return NextResponse.json({ message: 'Error deleting repair order' }, { status: 500 })
    }
}
