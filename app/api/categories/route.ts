import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM CATEGORY ORDER BY category_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching categories' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { category_name_th, category_name_en } = body
        const result: any = await query(
            'INSERT INTO CATEGORY (category_name_th, category_name_en) VALUES (?, ?)',
            [category_name_th, category_name_en]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ message: 'Error creating category' }, { status: 500 })
    }
}
