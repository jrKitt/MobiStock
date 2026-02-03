import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { RepairOrderPart } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const repair_id = searchParams.get('repair_id')
        const part_id = searchParams.get('part_id')

        if (repair_id && part_id) {
            const rows = (await query(
                'SELECT * FROM REPAIR_ORDER_PART WHERE repair_id = ? AND part_id = ?',
                [repair_id, part_id]
            )) as RepairOrderPart[]
            if (rows.length === 0) {
                return NextResponse.json(
                    { message: 'Repair order part not found' },
                    { status: 404 }
                )
            }
            return NextResponse.json(rows[0])
        }

        const rows = (await query('SELECT * FROM REPAIR_ORDER_PART ORDER BY create_at DESC')) as RepairOrderPart[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error fetching repair order parts' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RepairOrderPart
        const { repair_id, part_id, repair_part_quantity, repair_part_unit_price } = body
        await query<ResultSetHeader>(
            'INSERT INTO REPAIR_ORDER_PART (repair_id, part_id, repair_part_quantity, repair_part_unit_price) VALUES (?, ?, ?, ?)',
            [repair_id, part_id, repair_part_quantity, repair_part_unit_price]
        )
        return NextResponse.json({ ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating repair order part' },
            { status: 500 }
        )
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const repair_id = searchParams.get('repair_id')
        const part_id = searchParams.get('part_id')

        if (!repair_id || !part_id) {
            return NextResponse.json(
                { message: 'Missing repair_id or part_id' },
                { status: 400 }
            )
        }

        const body = (await req.json()) as RepairOrderPart
        const { repair_part_quantity, repair_part_unit_price } = body

        await query<ResultSetHeader>(
            'UPDATE REPAIR_ORDER_PART SET repair_part_quantity = ?, repair_part_unit_price = ? WHERE repair_id = ? AND part_id = ?',
            [repair_part_quantity, repair_part_unit_price, repair_id, part_id]
        )
        return NextResponse.json({ ...body, repair_id: Number(repair_id), part_id: Number(part_id) })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error updating repair order part' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const repair_id = searchParams.get('repair_id')
        const part_id = searchParams.get('part_id')

        if (!repair_id || !part_id) {
            return NextResponse.json(
                { message: 'Missing repair_id or part_id' },
                { status: 400 }
            )
        }

        await query<ResultSetHeader>(
            'DELETE FROM REPAIR_ORDER_PART WHERE repair_id = ? AND part_id = ?',
            [repair_id, part_id]
        )
        return NextResponse.json({ message: 'Repair order part deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error deleting repair order part' },
            { status: 500 }
        )
    }
}
