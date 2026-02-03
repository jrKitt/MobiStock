import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Brand } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM BRAND ORDER BY brand_id DESC')) as Brand[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching brands', error)
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
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Brand created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating brand', error)
    }
}
