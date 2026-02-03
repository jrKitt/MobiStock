import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM SPARE_PART ORDER BY part_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching spare parts' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { part_name, part_status } = body
        const result: any = await query(
            'INSERT INTO SPARE_PART (part_name, part_status) VALUES (?, ?)',
            [part_name, part_status]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating spare part' },
            { status: 500 }
        )
    }
}
