import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Category } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM CATEGORY WHERE category_id = ?', [id])) as Category[]
        if (rows.length === 0) {
            return errorResponse('Category not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching category', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as Category
        const { category_name_th, category_name_en } = body
        await query(
            'UPDATE CATEGORY SET category_name_th = ?, category_name_en = ? WHERE category_id = ?',
            [category_name_th, category_name_en, id]
        )
        return successResponse({ id, ...body }, 'Category updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating category', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM CATEGORY WHERE category_id = ?', [id])
        return successResponse(null, 'Category deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting category', error)
    }
}
