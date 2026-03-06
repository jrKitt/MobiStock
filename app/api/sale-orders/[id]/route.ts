import { NextRequest } from 'next/server'
import { query, getConnection } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrder } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query(
            'SELECT * FROM SALE_ORDER WHERE sale_id = ?',
            [id]
        )) as SaleOrder[]
        if (rows.length === 0) {
            return errorResponse('Sale order not found', null, 404)
        }

        const saleOrder = rows[0]

        // Fetch items associated
        const items = await query(
            `
            SELECT soi.*, pi.item_serial_number, pi.item_imei, pi.item_lot_number 
            FROM SALE_ORDER_ITEM soi
            JOIN PRODUCT_ITEM pi ON soi.item_id = pi.item_id
            WHERE soi.sale_id = ?
        `,
            [id]
        )

        return successResponse({ ...saleOrder, items })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching sale order', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection
    try {
        const { id } = await params
        const body = await req.json()
        const {
            sale_code,
            sale_date,
            sale_status,
            customer_id,
            update_by,
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
            (sum: number, item: { sale_price: string | number }) =>
                sum + Number(item.sale_price || 0),
            0
        )

        connection = await getConnection()
        await connection.beginTransaction()

        // 1. Update Sale Order
        await connection.query(
            'UPDATE SALE_ORDER SET sale_code = ?, sale_date = ?, sale_total_amount = ?, sale_status = ?, customer_id = ?, update_by = ? WHERE sale_id = ?',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                sale_status,
                customer_id,
                update_by || null,
                id,
            ]
        )

        // 2. Fetch Existing Items
        const existingItems = (await connection.query(
            'SELECT item_id FROM SALE_ORDER_ITEM WHERE sale_id = ?',
            [id]
        )) as [{ item_id: number }[], unknown]
        const existingItemIds = existingItems[0].map((row) => row.item_id)
        const incomingItemIds = items.map((i: { item_id: number }) => i.item_id)

        // 3. Items to Remove: Revert their status to 'Available' and delete from SALE_ORDER_ITEM
        const itemsToRemove = existingItemIds.filter(
            (itemId) => !incomingItemIds.includes(itemId)
        )
        for (const itemId of itemsToRemove) {
            await connection.query(
                'UPDATE PRODUCT_ITEM SET item_status = ? WHERE item_id = ?',
                ['Available', itemId]
            )
            await connection.query(
                'DELETE FROM SALE_ORDER_ITEM WHERE sale_id = ? AND item_id = ?',
                [id, itemId]
            )
        }

        // 4. Items to Add / Update Status for All Current Items
        const newItemStatus =
            sale_status === 'Completed'
                ? 'Sold'
                : sale_status === 'Pending' || sale_status === 'Processing'
                  ? 'Reserved'
                  : 'Available'

        for (const item of items) {
            if (!existingItemIds.includes(item.item_id)) {
                // It's a newly added item to this order
                await connection.query(
                    'INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (?, ?, ?)',
                    [item.sale_price, id, item.item_id]
                )
            } else {
                // Update price if it changed
                await connection.query(
                    'UPDATE SALE_ORDER_ITEM SET sale_price = ? WHERE sale_id = ? AND item_id = ?',
                    [item.sale_price, id, item.item_id]
                )
            }

            // Update status for all items in this order
            await connection.query(
                'UPDATE PRODUCT_ITEM SET item_status = ? WHERE item_id = ?',
                [newItemStatus, item.item_id]
            )
        }

        await connection.commit()
        connection.release()

        return successResponse(
            { id, ...body, sale_total_amount },
            'Sale order updated successfully'
        )
    } catch (error) {
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        console.error(error)
        return errorResponse('Error updating sale order', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection
    try {
        const { id } = await params
        connection = await getConnection()
        await connection.beginTransaction()

        // Revert product statuses
        const existingItems = (await connection.query(
            'SELECT item_id FROM SALE_ORDER_ITEM WHERE sale_id = ?',
            [id]
        )) as [{ item_id: number }[], unknown]
        for (const row of existingItems[0]) {
            await connection.query(
                'UPDATE PRODUCT_ITEM SET item_status = ? WHERE item_id = ?',
                ['Available', row.item_id]
            )
        }

        // Delete order and cascade items
        await connection.query(
            'DELETE FROM SALE_ORDER_ITEM WHERE sale_id = ?',
            [id]
        )
        await connection.query('DELETE FROM SALE_ORDER WHERE sale_id = ?', [id])

        await connection.commit()
        connection.release()

        return successResponse(null, 'Sale order deleted successfully')
    } catch (error) {
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        console.error(error)
        return errorResponse('Error deleting sale order', error)
    }
}
