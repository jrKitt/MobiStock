import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM BRAND ORDER BY brand_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching brands' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { brand_name, brand_country } = body
        const result: any = await query(
            'INSERT INTO BRAND (brand_name, brand_country) VALUES (?, ?)',
            [brand_name, brand_country]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ message: 'Error creating brand' }, { status: 500 })
    }
}
