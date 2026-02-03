import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SupplierSparePart } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const supplier_id = searchParams.get('supplier_id')
        const part_id = searchParams.get('part_id')

        if (supplier_id && part_id) {
            const rows = (await query(
                'SELECT * FROM SUPPLIER_SPARE_PART WHERE supplier_id = ? AND part_id = ?',
                [supplier_id, part_id]
            )) as SupplierSparePart[]
            if (rows.length === 0) {
                return errorResponse('Supplier spare part not found', null, 404)
            }
            return successResponse(rows[0])
        }

        const rows = (await query(
            'SELECT * FROM SUPPLIER_SPARE_PART ORDER BY create_at DESC'
        )) as SupplierSparePart[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching supplier spare parts', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SupplierSparePart
        const { supplier_id, part_id } = body
        await query<ResultSetHeader>(
            'INSERT INTO SUPPLIER_SPARE_PART (supplier_id, part_id) VALUES (?, ?)',
            [supplier_id, part_id]
        )
        return successResponse({ ...body }, 'Supplier spare part created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating supplier spare part', error)
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const supplier_id = searchParams.get('supplier_id')
        const part_id = searchParams.get('part_id')

        if (!supplier_id || !part_id) {
            return errorResponse('Missing supplier_id or part_id', null, 400)
        }

        await query<ResultSetHeader>(
            'DELETE FROM SUPPLIER_SPARE_PART WHERE supplier_id = ? AND part_id = ?',
            [supplier_id, part_id]
        )
        return successResponse(null, 'Supplier spare part deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting supplier spare part', error)
    }
}
