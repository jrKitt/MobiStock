import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const rows = await query('SELECT * FROM SPARE_PART WHERE part_id = ?', [id])
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ message: 'Spare part not found' }, { status: 404 })
        }
        return NextResponse.json((rows as any[])[0])
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching spare part' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { part_name, part_status } = body
        await query(
            'UPDATE SPARE_PART SET part_name = ?, part_status = ? WHERE part_id = ?',
            [part_name, part_status, id]
        )
        return NextResponse.json({ id, ...body })
    } catch (error) {
        return NextResponse.json({ message: 'Error updating spare part' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await query('DELETE FROM SPARE_PART WHERE part_id = ?', [id])
        return NextResponse.json({ message: 'Spare part deleted' })
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting spare part' }, { status: 500 })
    }
}
