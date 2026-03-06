import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { OrderHistoryLog } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = (page - 1) * limit

        const order_type = searchParams.get('order_type')
        const order_id = searchParams.get('order_id')

        let whereClause = ''
        const params: (string | number)[] = []

        if (order_type) {
            whereClause += ' WHERE order_type = ?'
            params.push(order_type)
        }
        if (order_id) {
            whereClause += whereClause
                ? ' AND order_id = ?'
                : ' WHERE order_id = ?'
            params.push(parseInt(order_id))
        }

        const countResult = await query<{ total: number }[]>(
            `SELECT COUNT(*) as total FROM ORDER_HISTORY_LOG${whereClause}`,
            params
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query(
            `SELECT * FROM ORDER_HISTORY_LOG${whereClause} ORDER BY log_id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )) as OrderHistoryLog[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching order history logs', error)
    }
}
