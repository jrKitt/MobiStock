import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrderImage } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const saleId = searchParams.get('sale_id')
        if (!saleId) {
            return errorResponse('sale_id is required', null, 400)
        }
        const rows = await query<SaleOrderImage[]>(
            'SELECT * FROM SALE_ORDER_IMAGE WHERE sale_id = ? ORDER BY create_at ASC',
            [saleId]
        )
        return successResponse(rows)
    } catch (error) {
        return errorResponse('Error fetching sale images', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SaleOrderImage
        const { sale_id, image_url, image_caption } = body
        if (!sale_id || !image_url) {
            return errorResponse(
                'sale_id and image_url are required',
                null,
                400
            )
        }
        const result = await query(
            'INSERT INTO SALE_ORDER_IMAGE (sale_id, image_url, image_caption) VALUES (?, ?, ?)',
            [sale_id, image_url, image_caption || null]
        )
        const insertedId = (result as ResultSetHeader).insertId
        return successResponse(
            { image_id: insertedId, sale_id, image_url, image_caption },
            'Image added',
            201
        )
    } catch (error) {
        return errorResponse('Error adding sale image', error)
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const imageId = searchParams.get('image_id')
        if (!imageId) {
            return errorResponse('image_id is required', null, 400)
        }
        await query('DELETE FROM SALE_ORDER_IMAGE WHERE image_id = ?', [
            imageId,
        ])
        return successResponse(null, 'Image deleted')
    } catch (error) {
        return errorResponse('Error deleting sale image', error)
    }
}
