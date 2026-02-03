import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { PurchaseOrder } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM PURCHASE_ORDER ORDER BY po_id DESC')) as PurchaseOrder[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching purchase orders', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as PurchaseOrder
        const { po_code, po_date, po_status, supplier_id } = body
        const result = await query(
            'INSERT INTO PURCHASE_ORDER (po_code, po_date, po_status, supplier_id) VALUES (?, ?, ?, ?)',
            [po_code, po_date, po_status, supplier_id]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Purchase order created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating purchase order', error)
    }
}
