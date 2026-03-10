import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ClaimOrder } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')

        const queryParams: Array<string | number> = []
        const conditions: string[] = []

        if (status) {
            conditions.push(`co.claim_status = ?`)
            queryParams.push(status)
        }

        if (search) {
            conditions.push(`(
                co.claim_code LIKE ? OR
                c.customer_fname LIKE ? OR
                c.customer_lname LIKE ? OR
                pi.item_serial_number LIKE ? OR
                pm.model_name LIKE ? OR
                b.brand_name LIKE ?
            )`)
            const searchTerm = `%${search}%`
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
        }

        if (startDate) {
            conditions.push(`co.claim_date_received >= ?`)
            queryParams.push(startDate)
        }

        if (endDate) {
            conditions.push(`co.claim_date_received <= ?`)
            queryParams.push(endDate)
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM CLAIM_ORDER co
            LEFT JOIN CUSTOMER c ON co.customer_id = c.customer_id
            LEFT JOIN PRODUCT_ITEM pi ON co.item_id = pi.item_id
            LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id
            LEFT JOIN BRAND b ON pm.brand_id = b.brand_id
            ${whereClause}
        `
        const countResult = await query<{ total: number }[]>(
            countQuery,
            queryParams
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const selectQuery = `
            SELECT co.*,
                   c.customer_fname,
                   c.customer_lname,
                   pi.item_serial_number,
                   pm.model_name,
                   b.brand_name
            FROM CLAIM_ORDER co
            LEFT JOIN CUSTOMER c ON co.customer_id = c.customer_id
            LEFT JOIN PRODUCT_ITEM pi ON co.item_id = pi.item_id
            LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id
            LEFT JOIN BRAND b ON pm.brand_id = b.brand_id
            ${whereClause} 
            ORDER BY co.claim_id DESC 
            LIMIT ? OFFSET ?
        `
        const rows = (await query(selectQuery, [
            ...queryParams,
            limit,
            offset,
        ])) as ClaimOrder[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching claim orders', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ClaimOrder
        const {
            claim_code,
            claim_date_received,
            claim_date_returned,
            claim_status,
            claim_resolution,
            supplier_id,
            customer_id,
            item_id,
            create_by,
        } = body
        const result = await query(
            'INSERT INTO CLAIM_ORDER (claim_code, claim_date_received, claim_date_returned, claim_status, claim_resolution, supplier_id, customer_id, item_id, create_by, update_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                claim_code,
                claim_date_received,
                claim_date_returned || null,
                claim_status,
                claim_resolution,
                supplier_id || null,
                customer_id,
                item_id,
                create_by || null,
                create_by || null,
            ]
        )
        const insertedId = (result as ResultSetHeader).insertId

        // Log history
        await query(
            'INSERT INTO ORDER_HISTORY_LOG (order_type, order_id, action, description, new_data, action_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'claim',
                insertedId,
                'created',
                'Claim order created',
                JSON.stringify({
                    claim_code,
                    claim_date_received,
                    claim_date_returned,
                    claim_status,
                    claim_resolution,
                    supplier_id,
                    customer_id,
                    item_id,
                }),
                create_by || null,
            ]
        )

        return successResponse(
            { id: insertedId, ...body },
            'Claim order created successfully',
            201
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating claim order', error)
    }
}
