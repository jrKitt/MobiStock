import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Category } from '@/types/api'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = (await query('SELECT * FROM CATEGORY WHERE category_id = ?', [id])) as Category[]
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Category not found' }, { status: 404 })
        }
        return NextResponse.json(rows[0])
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Error fetching category' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = (await req.json()) as Category
        const { category_name_th, category_name_en } = body
        await query(
            'UPDATE CATEGORY SET category_name_th = ?, category_name_en = ? WHERE category_id = ?',
            [category_name_th, category_name_en, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        console.error(error)
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
        console.error(error)
        return NextResponse.json({ message: 'Error deleting category' }, { status: 500 })
    }
}
