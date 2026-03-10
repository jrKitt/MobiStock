import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/response'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { serviceKey } = body

        if (!serviceKey) {
            return errorResponse('กรุณากรอกรหัสบริการ', null, 400)
        }

        // ดึงรหัสบริการจาก environment variable
        const correctServiceKey = process.env.PWD_SERVICE

        if (!correctServiceKey) {
            return errorResponse(
                'ระบบไม่ได้กำหนดรหัสบริการ กรุณาติดต่อผู้ดูแลระบบ',
                null,
                500
            )
        }

        // ตรวจสอบรหัสบริการ
        if (serviceKey !== correctServiceKey) {
            return errorResponse('รหัสบริการไม่ถูกต้อง', null, 401)
        }

        return successResponse(null, 'ยืนยันรหัสบริการสำเร็จ', 200)
    } catch (error) {
        console.error('Verify service key error:', error)
        return errorResponse('เกิดข้อผิดพลาดในการตรวจสอบรหัสบริการ', error)
    }
}
