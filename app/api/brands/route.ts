import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { Brand } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM BRAND ORDER BY brand_id DESC')) as Brand[]
        return NextResponse.json(rows)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching brands' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Brand
        const { brand_name, brand_country } = body
        const result = await query(
            'INSERT INTO BRAND (brand_name, brand_country) VALUES (?, ?)',
            [brand_name, brand_country]
        )
        return NextResponse.json({ id: (result as ResultSetHeader).insertId, ...body }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error creating brand' }, { status: 500 })
    }
}
