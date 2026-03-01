import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ProductModel } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>(
            'SELECT COUNT(*) as total FROM PRODUCT_MODEL'
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query(
            'SELECT * FROM PRODUCT_MODEL ORDER BY model_id DESC LIMIT ? OFFSET ?',
            [limit, offset]
        )) as ProductModel[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching product models', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ProductModel
        const {
            model_name,
            model_made_in,
            model_warranty_duration,
            brand_id,
            category_id,
            image_url,
        } = body
        const result = await query(
            'INSERT INTO PRODUCT_MODEL (model_name, model_made_in, model_warranty_duration, brand_id, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [
                model_name,
                model_made_in,
                model_warranty_duration,
                brand_id,
                category_id,
                image_url || null,
            ]
        )
        return successResponse(
            { id: (result as ResultSetHeader).insertId, ...body },
            'Product model created successfully',
            201
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating product model', error)
    }
}
