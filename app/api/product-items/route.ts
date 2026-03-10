import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { ProductItem } from '@/types/api'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const search = searchParams.get('search') || ''
        const modelId = searchParams.get('model_id')
        const status = searchParams.get('status')
        const brandId = searchParams.get('brand_id')
        const categoryId = searchParams.get('category_id')

        const whereConditions: string[] = []
        const queryParams: (string | number)[] = []

        if (search) {
            whereConditions.push(
                '(pi.item_serial_number LIKE ? OR pi.item_imei LIKE ?)'
            )
            queryParams.push(`%${search}%`, `%${search}%`)
        }

        if (modelId && parseInt(modelId) > 0) {
            whereConditions.push('pi.model_id = ?')
            queryParams.push(modelId)
        }

        if (status && status !== 'All') {
            whereConditions.push('pi.item_status = ?')
            queryParams.push(status)
        }

        if (brandId && parseInt(brandId) > 0) {
            whereConditions.push('pm.brand_id = ?')
            queryParams.push(brandId)
        }

        if (categoryId && parseInt(categoryId) > 0) {
            whereConditions.push('pm.category_id = ?')
            queryParams.push(categoryId)
        }

        const whereClause =
            whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : ''

        const countQuery = `
            SELECT COUNT(pi.item_id) as total 
            FROM PRODUCT_ITEM pi 
            LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id 
            ${whereClause}
        `
        const countResult = await query<{ total: number }[]>(
            countQuery,
            queryParams
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const itemsQuery = `
            SELECT 
                pi.*,
                pm.model_name,
                b.brand_name,
                c.category_name_th
            FROM PRODUCT_ITEM pi 
            LEFT JOIN PRODUCT_MODEL pm ON pi.model_id = pm.model_id 
            LEFT JOIN BRAND b ON pm.brand_id = b.brand_id
            LEFT JOIN CATEGORY c ON pm.category_id = c.category_id
            ${whereClause} 
            ORDER BY pi.item_id DESC LIMIT ? OFFSET ?
        `
        const itemsParams = [...queryParams, limit, offset]
        const rows = (await query(itemsQuery, itemsParams)) as ProductItem[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching product items', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ProductItem
        const {
            item_serial_number,
            item_imei,
            item_lot_number,
            item_status,
            model_id,
        } = body
        const result = await query(
            'INSERT INTO PRODUCT_ITEM (item_serial_number, item_imei, item_lot_number, item_status, model_id) VALUES (?, ?, ?, ?, ?)',
            [
                item_serial_number,
                item_imei,
                item_lot_number,
                item_status,
                model_id,
            ]
        )
        return successResponse(
            { id: (result as ResultSetHeader).insertId, ...body },
            'Product item created successfully',
            201
        )
    } catch (error) {
        console.error(error)
        return errorResponse('Error creating product item', error)
    }
}
