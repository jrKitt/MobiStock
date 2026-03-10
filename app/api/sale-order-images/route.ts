import { NextRequest, NextResponse } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { SaleOrderImage } from '@/types/api'

// CORS headers helper
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': 'https://mobistock.jrkitt.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    }
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const saleId = searchParams.get('sale_id')
        if (!saleId) {
            const response = errorResponse('sale_id is required', null, 400)
            // Add CORS headers to error response
            const headers = new Headers(response.headers)
            Object.entries(corsHeaders()).forEach(([key, value]) => {
                headers.set(key, value)
            })
            return new NextResponse(response.body, {
                status: response.status,
                headers,
            })
        }
        const rows = await query<SaleOrderImage[]>(
            'SELECT * FROM SALE_ORDER_IMAGE WHERE sale_id = ? ORDER BY create_at ASC',
            [saleId]
        )
        const response = successResponse(rows)
        // Add CORS headers to success response
        const headers = new Headers(response.headers)
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            headers.set(key, value)
        })
        return new NextResponse(response.body, {
            status: response.status,
            headers,
        })
    } catch (error) {
        const response = errorResponse('Error fetching sale images', error)
        // Add CORS headers to error response
        const headers = new Headers(response.headers)
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            headers.set(key, value)
        })
        return new NextResponse(response.body, {
            status: response.status,
            headers,
        })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SaleOrderImage
        const { sale_id, image_url, image_caption } = body
        if (!sale_id || !image_url) {
            const response = errorResponse(
                'sale_id and image_url are required',
                null,
                400
            )
            // Add CORS headers to error response
            const headers = new Headers(response.headers)
            Object.entries(corsHeaders()).forEach(([key, value]) => {
                headers.set(key, value)
            })
            return new NextResponse(response.body, {
                status: response.status,
                headers,
            })
        }
        const result = await query(
            'INSERT INTO SALE_ORDER_IMAGE (sale_id, image_url, image_caption) VALUES (?, ?, ?)',
            [sale_id, image_url, image_caption || null]
        )
        const insertedId = (result as ResultSetHeader).insertId
        const response = successResponse(
            { image_id: insertedId, sale_id, image_url, image_caption },
            'Image added',
            201
        )
        // Add CORS headers to success response
        const headers = new Headers(response.headers)
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            headers.set(key, value)
        })
        return new NextResponse(response.body, {
            status: response.status,
            headers,
        })
    } catch (error) {
        const response = errorResponse('Error adding sale image', error)
        // Add CORS headers to error response
        const headers = new Headers(response.headers)
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            headers.set(key, value)
        })
        return new NextResponse(response.body, {
            status: response.status,
            headers,
        })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const imageId = searchParams.get('image_id')
        if (!imageId) {
            const response = errorResponse('image_id is required', null, 400)
            // Add CORS headers to error response
            const headers = new Headers(response.headers)
            Object.entries(corsHeaders()).forEach(([key, value]) => {
                headers.set(key, value)
            })
            return new NextResponse(response.body, {
                status: response.status,
                headers,
            })
        }
        await query('DELETE FROM SALE_ORDER_IMAGE WHERE image_id = ?', [
            imageId,
        ])
        const response = successResponse(null, 'Image deleted')
        // Add CORS headers to success response
        const headers = new Headers(response.headers)
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            headers.set(key, value)
        })
        return new NextResponse(response.body, {
            status: response.status,
            headers,
        })
    } catch (error) {
        const response = errorResponse('Error deleting sale image', error)
        // Add CORS headers to error response
        const headers = new Headers(response.headers)
        Object.entries(corsHeaders()).forEach(([key, value]) => {
            headers.set(key, value)
        })
        return new NextResponse(response.body, {
            status: response.status,
            headers,
        })
    }
}
