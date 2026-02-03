import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { RepairOrderPart } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const repair_id = searchParams.get('repair_id')
        const part_id = searchParams.get('part_id')

        if (repair_id && part_id) {
            const rows = (await query(
                'SELECT * FROM REPAIR_ORDER_PART WHERE repair_id = ? AND part_id = ?',
                [repair_id, part_id]
            )) as RepairOrderPart[]
            if (rows.length === 0) {
                return errorResponse('Repair order part not found', null, 404)
            }
            return successResponse(rows[0])
        }

        const rows = (await query('SELECT * FROM REPAIR_ORDER_PART ORDER BY create_at DESC')) as RepairOrderPart[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching repair order parts', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RepairOrderPart
        const { repair_id, part_id, repair_part_quantity, repair_part_unit_price } = body
        await query<ResultSetHeader>(
            'INSERT INTO REPAIR_ORDER_PART (repair_id, part_id, repair_part_quantity, repair_part_unit_price) VALUES (?, ?, ?, ?)',
            [repair_id, part_id, repair_part_quantity, repair_part_unit_price]
        )
        return successResponse({ ...body }, 'Repair order part created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating repair order part', error)
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const repair_id = searchParams.get('repair_id')
        const part_id = searchParams.get('part_id')

        if (!repair_id || !part_id) {
            return errorResponse('Missing repair_id or part_id', null, 400)
        }

        const body = (await req.json()) as RepairOrderPart
        const { repair_part_quantity, repair_part_unit_price } = body

        await query<ResultSetHeader>(
            'UPDATE REPAIR_ORDER_PART SET repair_part_quantity = ?, repair_part_unit_price = ? WHERE repair_id = ? AND part_id = ?',
            [repair_part_quantity, repair_part_unit_price, repair_id, part_id]
        )
        return successResponse({ ...body, repair_id: Number(repair_id), part_id: Number(part_id) }, 'Repair order part updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating repair order part', error)
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const repair_id = searchParams.get('repair_id')
        const part_id = searchParams.get('part_id')

        if (!repair_id || !part_id) {
            return errorResponse('Missing repair_id or part_id', null, 400)
        }

        await query<ResultSetHeader>(
            'DELETE FROM REPAIR_ORDER_PART WHERE repair_id = ? AND part_id = ?',
            [repair_id, part_id]
        )
        return successResponse(null, 'Repair order part deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting repair order part', error)
    }
}
