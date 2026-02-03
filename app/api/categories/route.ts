import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Category } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM CATEGORY ORDER BY category_id DESC')) as Category[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching categories', error)
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
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Category created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating category', error)
    }
}
