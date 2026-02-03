import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM BRAND WHERE brand_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Brand not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching brand' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { brand_name, brand_country } = body
        await query(
            'UPDATE BRAND SET brand_name = ?, brand_country = ? WHERE brand_id = ?',
            [brand_name, brand_country, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
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
        return NextResponse.json({ message: 'Error deleting brand' }, { status: 500 })
    }
}
