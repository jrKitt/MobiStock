import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'


interface KeyedProduct {
    prod_id: number
    prod_name: string
    serial_number?: string
    IMEI?: string
    sell_price: number
    status: string
    made_in?: string
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const productId = parseInt(id)

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: 'Invalid product ID' },
                { status: 400 }
            )
        }

        const result = (await query(
            'SELECT * FROM Product WHERE prod_id = ?',
            [productId]
        )) as KeyedProduct[]

        if (!result || result.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(result[0])
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const productId = parseInt(id)

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: 'Invalid product ID' },
                { status: 400 }
            )
        }

        const body = (await request.json()) as KeyedProduct
        const {
            prod_name,
            serial_number,
            IMEI,
            sell_price,
            status,
            made_in
        } = body

        const existingProduct = (await query(
            'SELECT * FROM Product WHERE prod_id = ?',
            [productId]
        )) as KeyedProduct[]

        if (!existingProduct || existingProduct.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        // Fix table name consistency: 'Product' seems to be the intended one based on GET
        // Fix column names: existing code used 'name', 'product_id' in PUT vs 'prod_name', 'prod_id' in GET
        // I will standardize to 'prod_name', 'prod_id' as seen in GET to be safe? 
        // Or keep them as is if I suspect the schema is messy?
        // Actually, looking at GET: 'SELECT * FROM Product WHERE prod_id = ?'
        // looking at PUT: 'UPDATE products ... WHERE product_id = ?'
        // This file is definitely using mixed schema conventions. 
        // I will assume the GET one (prod_id) is correct as it's the primary read operation.
        // And I'll update the PUT to matches.

        await query<ResultSetHeader>(
            `UPDATE Product
             SET prod_name = ?,
                 serial_number = ?,
                 IMEI = ?,
                 sell_price = ?,
                 status = ?,
                 made_in = ?
             WHERE prod_id = ?`,
            [
                prod_name || null,
                serial_number || null,
                IMEI || null,
                sell_price || 0,
                status || 'Available',
                made_in || null,
                productId
            ]
        )

        const updatedProduct = (await query(
            'SELECT * FROM Product WHERE prod_id = ?',
            [productId]
        )) as KeyedProduct[]

        return NextResponse.json({
            message: 'Product updated successfully',
            product: updatedProduct[0]
        })
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const productId = parseInt(id)

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: 'Invalid product ID' },
                { status: 400 }
            )
        }

        const existingProduct = (await query(
            'SELECT * FROM Product WHERE prod_id = ?',
            [productId]
        )) as KeyedProduct[]

        if (!existingProduct || existingProduct.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        await query<ResultSetHeader>(
            'DELETE FROM Product WHERE prod_id = ?',
            [productId]
        )

        return NextResponse.json({
            message: 'Product deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}
