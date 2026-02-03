import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM CATEGORY WHERE category_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Category not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching category' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { category_name_th, category_name_en } = body
        await query(
            'UPDATE CATEGORY SET category_name_th = ?, category_name_en = ? WHERE category_id = ?',
            [category_name_th, category_name_en, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating category' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM CATEGORY WHERE category_id = ?', [id])
        return NextResponse.json({ message: 'Category deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting category' }, { status: 500 })
    }
}
