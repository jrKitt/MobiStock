import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ClaimOrderImage } from '@/types/api/ClaimOrderImage'

interface ClaimEvidenceRow {
    image_id: number
    claim_id: number
    image_url: string
    image_caption: string | null
    create_at: Date
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const claimId = searchParams.get('claim_id')
        if (!claimId) {
            return errorResponse('claim_id is required', null, 400)
        }
        const rows = await query<ClaimEvidenceRow[]>(
            `SELECT
                log_id AS image_id,
                order_id AS claim_id,
                JSON_UNQUOTE(JSON_EXTRACT(new_data, '$.image_url')) AS image_url,
                JSON_UNQUOTE(JSON_EXTRACT(new_data, '$.image_caption')) AS image_caption,
                create_at
            FROM ORDER_HISTORY_LOG
            WHERE order_type = 'claim'
              AND order_id = ?
              AND action = 'status_changed'
              AND description = 'Claim evidence image added'
            ORDER BY create_at ASC`,
            [claimId]
        )
        return successResponse(rows)
    } catch (error) {
        return errorResponse('Error fetching claim images', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ClaimOrderImage
        const { claim_id, image_url, image_caption } = body
        if (!claim_id || !image_url) {
            return errorResponse(
                'claim_id and image_url are required',
                null,
                400
            )
        }
        const result = await query(
            'INSERT INTO ORDER_HISTORY_LOG (order_type, order_id, action, description, new_data, action_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'claim',
                claim_id,
                'status_changed',
                'Claim evidence image added',
                JSON.stringify({
                    image_url,
                    image_caption: image_caption || null,
                }),
                null,
            ]
        )
        const insertedId = (result as ResultSetHeader).insertId
        return successResponse(
            { image_id: insertedId, claim_id, image_url, image_caption },
            'Image added',
            201
        )
    } catch (error) {
        return errorResponse('Error adding claim image', error)
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const imageId = searchParams.get('image_id')
        if (!imageId) {
            return errorResponse('image_id is required', null, 400)
        }
        await query(
            `DELETE FROM ORDER_HISTORY_LOG
            WHERE log_id = ?
              AND order_type = 'claim'
              AND action = 'status_changed'
              AND description = 'Claim evidence image added'`,
            [imageId]
        )
        return successResponse(null, 'Image deleted')
    } catch (error) {
        return errorResponse('Error deleting claim image', error)
    }
}
