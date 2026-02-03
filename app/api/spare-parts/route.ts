import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { SparePart } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SPARE_PART ORDER BY part_id DESC')) as SparePart[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching spare parts' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SparePart
        const { part_name, part_status } = body
        const result = await query(
            'INSERT INTO SPARE_PART (part_name, part_status) VALUES (?, ?)',
            [part_name, part_status]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { message: 'Error creating spare part' },
            { status: 500 }
        )
    }
}
