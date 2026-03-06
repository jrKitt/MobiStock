import { NextRequest } from 'next/server'
import { query, getConnection, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrder } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>(
            'SELECT COUNT(*) as total FROM SALE_ORDER'
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query(
            'SELECT * FROM SALE_ORDER ORDER BY sale_id DESC LIMIT ? OFFSET ?',
            [limit, offset]
        )) as SaleOrder[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching sale orders', error)
    }
}

export async function POST(req: NextRequest) {
    let connection
    try {
        const body = await req.json()
        const {
            sale_code,
            sale_date,
            sale_status,
            customer_id,
            create_by,
            items, // Array of { item_id, sale_price }
        } = body

        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse(
                'Sale order must have at least one item',
                null,
                400
            )
        }

        const sale_total_amount = items.reduce(
            (sum, item: any) => sum + Number(item.sale_price || 0),
            0
        )

        connection = await getConnection()
        await connection.beginTransaction()

        const [orderResult] = await connection.query(
            'INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_status, customer_id, create_by, update_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                sale_status,
                customer_id,
                create_by || null,
                create_by || null,
            ]
        )
        const saleId = (orderResult as ResultSetHeader).insertId

        for (const item of items) {
            await connection.query(
                'INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (?, ?, ?)',
                [item.sale_price, saleId, item.item_id]
            )

            // Update product item status based on order status
            const newItemStatus =
                sale_status === 'Completed'
                    ? 'Sold'
                    : sale_status === 'Pending' || sale_status === 'Processing'
                      ? 'Reserved'
                      : 'Available'

            await connection.query(
                'UPDATE PRODUCT_ITEM SET item_status = ? WHERE item_id = ?',
                [newItemStatus, item.item_id]
            )
        }

        await connection.commit()
        connection.release()

        return successResponse(
            { id: saleId, ...body, sale_total_amount },
            'Sale order created successfully',
            201
        )
    } catch (error) {
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        console.error(error)
        return errorResponse('Error creating sale order', error)
    }
}
