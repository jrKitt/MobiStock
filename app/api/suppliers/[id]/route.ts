import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Supplier } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query(
            'SELECT * FROM SUPPLIER WHERE supplier_id = ?',
            [id]
        )) as Supplier[]
        if (rows.length === 0) {
            return errorResponse('Supplier not found', null, 404)
        }
        return successResponse(rows[0])
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching supplier', error)
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as Supplier
        const {
            supplier_name,
            supplier_phone,
            supplier_email,
            supplier_address,
            supplier_contact_person,
            image_url,
        } = body
        await query(
            'UPDATE SUPPLIER SET supplier_name = ?, supplier_phone = ?, supplier_email = ?, supplier_address = ?, supplier_contact_person = ?, image_url = ? WHERE supplier_id = ?',
            [
                supplier_name,
                supplier_phone,
                supplier_email,
                supplier_address,
                supplier_contact_person,
                image_url || null,
                id,
            ]
        )
        return successResponse({ id, ...body }, 'Supplier updated successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error updating supplier', error)
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SUPPLIER WHERE supplier_id = ?', [id])
        return successResponse(null, 'Supplier deleted successfully')
    } catch (error) {
        console.error(error)
        return errorResponse('Error deleting supplier', error)
    }
}
