import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { OrderHistoryLog } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query(
            'SELECT * FROM ORDER_HISTORY_LOG WHERE log_id = ?',
            [id]
        )) as OrderHistoryLog[]
        if (rows.length === 0) {
            return errorResponse('Log entry not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching log entry', error)
    }
}
