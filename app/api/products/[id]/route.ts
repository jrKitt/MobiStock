import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'

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
            return errorResponse('Invalid product ID', null, 400)
        }

        const result = (await query(
            'SELECT * FROM Product WHERE prod_id = ?',
            [productId]
        )) as KeyedProduct[]

        if (!result || result.length === 0) {
            return errorResponse('Product not found', null, 404)
        }

        return successResponse(result[0])
    } catch (error) {
        console.error('Error fetching product:', error)
        return errorResponse('Failed to fetch product', error)
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
            return errorResponse('Invalid product ID', null, 400)
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
            return errorResponse('Product not found', null, 404)
        }

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

        return successResponse({
            message: 'Product updated successfully',
            product: updatedProduct[0]
        })
    } catch (error) {
        console.error('Error updating product:', error)
        return errorResponse('Failed to update product', error)
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
            return errorResponse('Invalid product ID', null, 400)
        }

        const existingProduct = (await query(
            'SELECT * FROM Product WHERE prod_id = ?',
            [productId]
        )) as KeyedProduct[]

        if (!existingProduct || existingProduct.length === 0) {
            return errorResponse('Product not found', null, 404)
        }

        await query<ResultSetHeader>(
            'DELETE FROM Product WHERE prod_id = ?',
            [productId]
        )

        return successResponse({
            message: 'Product deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting product:', error)
        return errorResponse('Failed to delete product', error)
    }
}
