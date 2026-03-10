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
        const search = searchParams.get('search')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const categoryId = searchParams.get('category_id')
        const brandId = searchParams.get('brand_id')
        const customerId = searchParams.get('customer_id')
        const status = searchParams.get('status')

        let baseQuery = `
            FROM SALE_ORDER so
            LEFT JOIN CUSTOMER c ON so.customer_id = c.customer_id
        `
        const queryParams: any[] = []
        const conditions: string[] = []

        // If filtering by item details, we need to join items and group
        const needsItemJoin = search || categoryId || brandId
        if (needsItemJoin) {
            baseQuery += `
                LEFT JOIN SALE_ORDER_ITEM soi ON so.sale_id = soi.sale_id
                LEFT JOIN PRODUCT_ITEM pi ON soi.item_id = pi.item_id
                LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id
            `
        }

        if (search) {
            conditions.push(`(
                so.sale_code LIKE ? OR 
                c.customer_fname LIKE ? OR 
                c.customer_lname LIKE ? OR
                pi.item_serial_number LIKE ? OR
                pi.item_imei LIKE ?
            )`)
            const searchPattern = `%${search}%`
            queryParams.push(
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern
            )
        }

        if (
            startDate &&
            startDate !== 'undefined' &&
            endDate &&
            endDate !== 'undefined'
        ) {
            conditions.push(`so.sale_date BETWEEN ? AND ?`)
            queryParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`)
        } else if (startDate && startDate !== 'undefined') {
            conditions.push(`so.sale_date >= ?`)
            queryParams.push(`${startDate} 00:00:00`)
        } else if (endDate && endDate !== 'undefined') {
            conditions.push(`so.sale_date <= ?`)
            queryParams.push(`${endDate} 23:59:59`)
        }

        if (categoryId) {
            conditions.push(`pm.category_id = ?`)
            queryParams.push(categoryId)
        }

        if (brandId) {
            conditions.push(`pm.brand_id = ?`)
            queryParams.push(brandId)
        }

        if (customerId) {
            conditions.push(`so.customer_id = ?`)
            queryParams.push(customerId)
        }

        if (status) {
            conditions.push(`so.sale_status = ?`)
            queryParams.push(status)
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        // Count query
        const countQuery = `
            SELECT COUNT(DISTINCT so.sale_id) as total 
            ${baseQuery}
            ${whereClause}
        `
        const countResult = await query<{ total: number }[]>(
            countQuery,
            queryParams
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        // Select query
        const selectQuery = `
            SELECT so.*, c.customer_fname, c.customer_lname
            ${baseQuery}
            ${whereClause}
            GROUP BY so.sale_id, c.customer_fname, c.customer_lname
            ORDER BY so.sale_id DESC 
            LIMIT ? OFFSET ?
        `
        const rows = (await query(selectQuery, [
            ...queryParams,
            limit,
            offset,
        ])) as SaleOrder[]

        // Fetch items for the resulting rows
        if (rows.length > 0) {
            const saleIds = rows.map((r) => r.sale_id)
            const placeholders = saleIds.map(() => '?').join(', ')
            const items = (await query(
                `
                SELECT soi.*, pi.item_serial_number, pi.item_imei, pi.item_lot_number, pm.model_name, b.brand_name
                FROM SALE_ORDER_ITEM soi
                JOIN PRODUCT_ITEM pi ON soi.item_id = pi.item_id
                LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id
                LEFT JOIN BRAND b ON pm.brand_id = b.brand_id
                WHERE soi.sale_id IN (${placeholders})
                `,
                saleIds.filter(id => id !== undefined) as number[]
            )) as Record<string, unknown>[]

            // Attach items to orders
            rows.forEach((row: SaleOrder) => {
                row.items = items.filter((item) => item.sale_id === row.sale_id)
            })
        }

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
            sale_additional_cost = 0,
            items, // Array of { item_id, sale_price }
        } = body

        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse(
                'Sale order must have at least one item',
                null,
                400
            )
        }

        const sale_total_amount =
            items.reduce(
                (sum, item: any) => sum + Number(item.sale_price || 0),
                0
            ) + Number(sale_additional_cost || 0)

        connection = await getConnection()
        await connection.beginTransaction()

        const [orderResult] = await connection.query(
            'INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_additional_cost, sale_status, customer_id, create_by, update_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                Number(sale_additional_cost || 0),
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
                    : sale_status === 'Pending'
                      ? 'Reserved'
                      : 'Available'

            await connection.query(
                'UPDATE PRODUCT_ITEM SET item_status = ? WHERE item_id = ?',
                [newItemStatus, item.item_id]
            )
        }

        // Log history
        await connection.query(
            'INSERT INTO ORDER_HISTORY_LOG (order_type, order_id, action, description, new_data, action_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                'sale',
                saleId,
                'created',
                'Sale order created',
                JSON.stringify({
                    sale_code,
                    sale_date,
                    sale_total_amount,
                    sale_status,
                    customer_id,
                    items,
                }),
                create_by || null,
            ]
        )

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
