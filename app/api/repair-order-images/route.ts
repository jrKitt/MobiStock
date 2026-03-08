import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { RepairOrderImage } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const repairId = searchParams.get('repair_id')
        if (!repairId) {
            return errorResponse('repair_id is required', null, 400)
        }
        const imageType = searchParams.get('image_type')
        const rows = await query<RepairOrderImage[]>(
            imageType
                ? 'SELECT * FROM REPAIR_ORDER_IMAGE WHERE repair_id = ? AND image_type = ? ORDER BY create_at ASC'
                : 'SELECT * FROM REPAIR_ORDER_IMAGE WHERE repair_id = ? ORDER BY create_at ASC',
            imageType ? [repairId, imageType] : [repairId]
        )
        return successResponse(rows)
    } catch (error) {
        return errorResponse('Error fetching repair images', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RepairOrderImage
        const { repair_id, image_url, image_caption, image_type } = body
        if (!repair_id || !image_url) {
            return errorResponse(
                'repair_id and image_url are required',
                null,
                400
            )
        }
        const type = image_type === 'completed' ? 'completed' : 'received'
        const result = await query(
            'INSERT INTO REPAIR_ORDER_IMAGE (repair_id, image_url, image_caption, image_type) VALUES (?, ?, ?, ?)',
            [repair_id, image_url, image_caption || null, type]
        )
        const insertedId = (result as ResultSetHeader).insertId
        return successResponse(
            {
                image_id: insertedId,
                repair_id,
                image_url,
                image_caption,
                image_type: type,
            },
            'Image added',
            201
        )
    } catch (error) {
        return errorResponse('Error adding repair image', error)
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const imageId = searchParams.get('image_id')
        if (!imageId) {
            return errorResponse('image_id is required', null, 400)
        }
        await query('DELETE FROM REPAIR_ORDER_IMAGE WHERE image_id = ?', [
            imageId,
        ])
        return successResponse(null, 'Image deleted')
    } catch (error) {
        return errorResponse('Error deleting repair image', error)
    }
}
