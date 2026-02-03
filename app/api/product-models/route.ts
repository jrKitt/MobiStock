import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const rows = await query('SELECT * FROM PRODUCT_MODEL ORDER BY model_id DESC')
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching product models' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            model_name,
            model_made_in,
            model_warranty_duration,
            brand_id,
            category_id,
        } = body
        const result: any = await query(
            'INSERT INTO PRODUCT_MODEL (model_name, model_made_in, model_warranty_duration, brand_id, category_id) VALUES (?, ?, ?, ?, ?)',
            [
                model_name,
                model_made_in,
                model_warranty_duration,
                brand_id,
                category_id,
            ]
        )
        return NextResponse.json({ id: result.insertId, ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating product model' },
            { status: 500 }
        )
    }
}
