import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrder } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SALE_ORDER ORDER BY sale_id DESC')) as SaleOrder[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching sale orders', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SaleOrder
        const {
            sale_code,
            sale_date,
            sale_total_amount,
            sale_status,
            customer_id,
        } = body
        const result = await query(
            'INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_status, customer_id) VALUES (?, ?, ?, ?, ?)',
            [
                sale_code,
                sale_date,
                sale_total_amount,
                sale_status,
                customer_id,
            ]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Sale order created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating sale order', error)
    }
}
