import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SparePart } from '@/types/api'

export async function GET() {
    try {
        const rows = (await query('SELECT * FROM SPARE_PART ORDER BY part_id DESC')) as SparePart[]
        return successResponse(rows)
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching spare parts', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SparePart
        const { part_name, part_status } = body
        const result = await query(
            'INSERT INTO SPARE_PART (part_name, part_status) VALUES (?, ?)',
            [part_name, part_status]
        )
        return successResponse({ id: (result as ResultSetHeader).insertId, ...body }, 'Spare part created successfully', 201)
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating spare part', error)
    }
}
