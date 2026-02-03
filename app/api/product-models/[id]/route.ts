import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM PRODUCT_MODEL WHERE model_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Product model not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching product model' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const {
            model_name,
            model_made_in,
            model_warranty_duration,
            brand_id,
            category_id,
        } = body
        await query(
            'UPDATE PRODUCT_MODEL SET model_name = ?, model_made_in = ?, model_warranty_duration = ?, brand_id = ?, category_id = ? WHERE model_id = ?',
            [
                model_name,
                model_made_in,
                model_warranty_duration,
                brand_id,
                category_id,
                id,
            ]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating product model' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM PRODUCT_MODEL WHERE model_id = ?', [id])
        return NextResponse.json({ message: 'Product model deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting product model' }, { status: 500 })
    }
}
