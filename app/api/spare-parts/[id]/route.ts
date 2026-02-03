import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SparePart } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM SPARE_PART WHERE part_id = ?', [id])) as SparePart[]
        if (rows.length === 0) {
            return errorResponse('Spare part not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching spare part', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as SparePart
        const { part_name, part_status } = body
        await query(
            'UPDATE SPARE_PART SET part_name = ?, part_status = ? WHERE part_id = ?',
            [part_name, part_status, id]
        )
        return successResponse({ id, ...body }, 'Spare part updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating spare part', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SPARE_PART WHERE part_id = ?', [id])
        return successResponse(null, 'Spare part deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting spare part', error)
    }
}
