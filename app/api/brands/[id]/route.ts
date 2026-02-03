import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Brand } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM BRAND WHERE brand_id = ?', [id])) as Brand[]
        if (rows.length === 0) {
            return errorResponse('Brand not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching brand', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as Brand
        const { brand_name, brand_country } = body
        await query(
            'UPDATE BRAND SET brand_name = ?, brand_country = ? WHERE brand_id = ?',
            [brand_name, brand_country, id]
        )
        return successResponse({ id, ...body }, 'Brand updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating brand', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM BRAND WHERE brand_id = ?', [id])
        return successResponse(null, 'Brand deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting brand', error)
    }
}
