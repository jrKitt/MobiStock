import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface Product {
    product_id: number
    name: string
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

        const result = await query(
            'SELECT * FROM products WHERE product_id = ?',
            [productId]
        )

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

        const body = await request.json()
        const {
            name,
            serial_number,
            IMEI,
            sell_price,
            status,
            made_in
        } = body

        const existingProduct = await query(
            'SELECT * FROM products WHERE product_id = ?',
            [productId]
        )

        if (!existingProduct || existingProduct.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        await query(
            `UPDATE products 
             SET name = ?, 
                 serial_number = ?, 
                 IMEI = ?, 
                 sell_price = ?, 
                 status = ?, 
                 made_in = ?
             WHERE product_id = ?`,
            [
                name || null,
                serial_number || null,
                IMEI || null,
                sell_price || 0,
                status || 'Available',
                made_in || null,
                productId
            ]
        )

        const updatedProduct = await query(
            'SELECT * FROM products WHERE product_id = ?',
            [productId]
        )

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

        const existingProduct = await query(
            'SELECT * FROM products WHERE product_id = ?',
            [productId]
        )

        if (!existingProduct || existingProduct.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        await query(
            'DELETE FROM products WHERE product_id = ?',
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
