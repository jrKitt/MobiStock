import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const supplier_id = searchParams.get('supplier_id')
        const part_id = searchParams.get('part_id')

        if (supplier_id && part_id) {
            const rows = await query(
                'SELECT * FROM SUPPLIER_SPARE_PART WHERE supplier_id = ? AND part_id = ?',
                [supplier_id, part_id]
            )
            if ((rows as any[]).length === 0) {
                return NextResponse.json(
                    { message: 'Supplier spare part not found' },
                    { status: 404 }
                )
            }
            return NextResponse.json((rows as any[])[0])
        }

        const rows = await query(
            'SELECT * FROM SUPPLIER_SPARE_PART ORDER BY create_at DESC'
        )
        return NextResponse.json(rows)
    } catch (error) {
        return NextResponse.json(
            { message: 'Error fetching supplier spare parts' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { supplier_id, part_id } = body
        await query(
            'INSERT INTO SUPPLIER_SPARE_PART (supplier_id, part_id) VALUES (?, ?)',
            [supplier_id, part_id]
        )
        return NextResponse.json({ ...body }, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error creating supplier spare part' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const supplier_id = searchParams.get('supplier_id')
        const part_id = searchParams.get('part_id')

        if (!supplier_id || !part_id) {
            return NextResponse.json(
                { message: 'Missing supplier_id or part_id' },
                { status: 400 }
            )
        }

        await query(
            'DELETE FROM SUPPLIER_SPARE_PART WHERE supplier_id = ? AND part_id = ?',
            [supplier_id, part_id]
        )
        return NextResponse.json({ message: 'Supplier spare part deleted' })
    } catch (error) {
        return NextResponse.json(
            { message: 'Error deleting supplier spare part' },
            { status: 500 }
        )
    }
}
