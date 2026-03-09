import { NextRequest } from 'next/server'
import { query, ResultSetHeader } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import { Brand } from '@/types/api'
import { validateBrand, formatValidationErrors } from '@/lib/validation-simple'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        const countResult = await query<{ total: number }[]>(
            'SELECT COUNT(*) as total FROM BRAND'
        )
        const total = countResult[0].total
        const totalPages = Math.ceil(total / limit)

        const rows = (await query(
            'SELECT * FROM BRAND ORDER BY brand_id DESC LIMIT ? OFFSET ?',
            [limit, offset]
        )) as Brand[]

        return successResponse(rows, 'Success', 200, {
            page,
            limit,
            total,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        return errorResponse('Error fetching brands', error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        
        // Simple validation
        const validation = validateBrand(body)
        if (!validation.isValid) {
            return errorResponse(
                'Validation failed',
                formatValidationErrors(validation),
                400
            )
        }

        const { brand_name, brand_country, image_url } = body
        
        // Check for duplicate brand name
        try {
            const existingBrand = await query(
                'SELECT brand_id FROM BRAND WHERE brand_name = ?',
                [brand_name.trim()]
            )
            
            if (Array.isArray(existingBrand) && existingBrand.length > 0) {
                return errorResponse(
                    'Brand already exists',
                    ['ชื่อแบรนด์นี้มีอยู่แล้วในระบบ'],
                    409
                )
            }
        } catch (dbError) {
            // Continue with creation if check fails
        }

        const result = await query(
            'INSERT INTO BRAND (brand_name, brand_country, image_url) VALUES (?, ?, ?)',
            [brand_name.trim(), brand_country?.trim() || null, image_url?.trim() || null]
        )
        
        return successResponse(
            { id: (result as ResultSetHeader).insertId, ...body },
            'สร้างแบรนด์สำเร็จ',
            201
        )
    } catch (error) {
        console.error(error)
        
        // Handle basic database constraint errors
        if (error instanceof Error) {
            if (error.message.includes('chk_brand_name_not_empty')) {
                return errorResponse(
                    'Validation failed',
                    ['ชื่อแบรนด์ต้องไม่ว่างเปล่า'],
                    400
                )
            }
        }
        
        return errorResponse('Error creating brand', error)
    }
}
