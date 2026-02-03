import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM REPAIR_ORDER ORDER BY repair_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching repair orders' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
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
        const result: any = await query(
            'INSERT INTO REPAIR_ORDER (repair_problem_desc, repair_technician_note, repair_date_received, repair_date_completed, repair_labor_cost, repair_status, customer_id, item_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                repair_problem_desc,
                repair_technician_note,
                repair_date_received,
                repair_date_completed,
                repair_labor_cost,
                repair_status,
                customer_id,
                item_id,
            ]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating repair order' },
            { status: 500 }
        )
    }
}
