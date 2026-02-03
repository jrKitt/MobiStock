import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Brand } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM BRAND WHERE brand_id = ?', [id])) as Brand[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Brand not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching brand' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as Brand
        const { brand_name, brand_country } = body
        await query(
            'UPDATE BRAND SET brand_name = ?, brand_country = ? WHERE brand_id = ?',
            [brand_name, brand_country, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error updating brand' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM BRAND WHERE brand_id = ?', [id])
        return NextResponse.json({ message: 'Brand deleted' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error deleting brand' }, { status: 500 })
    }
}
