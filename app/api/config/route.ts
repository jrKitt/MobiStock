import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, successResponse } from '@/lib/response'
import { readStoreConfig, writeStoreConfig } from '@/lib/store-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function withCors(response: NextResponse) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })
    return response
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    })
}

export async function GET() {
    try {
        const config = await readStoreConfig()
        return withCors(successResponse(config, 'Success'))
    } catch (error) {
        return withCors(errorResponse('ไม่สามารถอ่านค่า config ได้', error))
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = (await req.json()) as { storeName?: unknown }
        const storeName =
            typeof body.storeName === 'string' ? body.storeName.trim() : ''

        if (!storeName) {
            return withCors(errorResponse('กรุณาระบุชื่อร้าน', null, 400))
        }

        if (storeName.length > 100) {
            return withCors(errorResponse('ชื่อร้านต้องไม่เกิน 100 ตัวอักษร', null, 400))
        }

        const saved = await writeStoreConfig({ storeName })
        return withCors(successResponse(saved, 'บันทึกการตั้งค่าสำเร็จ'))
    } catch (error) {
        return withCors(errorResponse('ไม่สามารถบันทึกค่า config ได้', error))
    }
}
