import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ProductModel } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM PRODUCT_MODEL WHERE model_id = ?', [id])) as ProductModel[]
        if (rows.length === 0) {
            return errorResponse('Product model not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching product model', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as ProductModel
        const {
            model_name,
            model_made_in,
            model_warranty_duration,
            brand_id,
            category_id,
        } = body
        await query(
            'UPDATE PRODUCT_MODEL SET model_name = ?, model_made_in = ?, model_warranty_duration = ?, brand_id = ?, category_id = ? WHERE model_id = ?',
            [
                model_name,
                model_made_in,
                model_warranty_duration,
                brand_id,
                category_id,
                id,
            ]
        )
        return successResponse({ id, ...body }, 'Product model updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating product model', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PRODUCT_MODEL WHERE model_id = ?', [id])
        return successResponse(null, 'Product model deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting product model', error)
    }
}
