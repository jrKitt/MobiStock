import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { Category } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM CATEGORY ORDER BY category_id DESC')) as Category[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching categories' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Category
        const { category_name_th, category_name_en } = body
        const result = await query(
            'INSERT INTO CATEGORY (category_name_th, category_name_en) VALUES (?, ?)',
            [category_name_th, category_name_en]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error creating category' }, { status: 500 })
    }
}
