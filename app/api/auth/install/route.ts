import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import bcrypt from 'bcryptjs'
import { RowDataPacket } from 'mysql2'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { serviceKey, name, username, email, password } = body

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!serviceKey || !name || !username || !email || !password) {
            return errorResponse('กรุณากรอกข้อมูลให้ครบถ้วน', null, 400)
        }

        // ตรวจสอบรหัสบริการอีกครั้ง
        const correctServiceKey = process.env.PWD_SERVICE

        if (!correctServiceKey) {
            return errorResponse(
                'ระบบไม่ได้กำหนดรหัสบริการ กรุณาติดต่อผู้ดูแลระบบ',
                null,
                500
            )
        }

        if (serviceKey !== correctServiceKey) {
            return errorResponse('รหัสบริการไม่ถูกต้อง', null, 401)
        }

        // ตรวจสอบว่ามีผู้ใช้งานในระบบแล้วหรือไม่
        const existingUsers = await query<RowDataPacket>(
            'SELECT user_id FROM User LIMIT 1',
            []
        )

        if (existingUsers.length > 0) {
            return errorResponse(
                'ระบบได้ถูกติดตั้งแล้ว ไม่สามารถสร้างบัญชีใหม่ผ่านหน้านี้ได้',
                null,
                403
            )
        }

        // ตรวจสอบว่า username หรือ email ซ้ำหรือไม่ (เผื่อกรณีมีข้อมูลค้างในระบบ)
        const existingAccount = await query<RowDataPacket>(
            'SELECT user_id FROM User WHERE email = ? OR username = ?',
            [email, username]
        )

        if (existingAccount.length > 0) {
            return errorResponse('อีเมลหรือชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว', null, 409)
        }

        // ตรวจสอบความยาวรหัสผ่าน
        if (password.length < 6) {
            return errorResponse('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', null, 400)
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // สร้างผู้ใช้งานแอดมินคนแรก
        await query(
            'INSERT INTO User(username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        )

        return successResponse(
            { username, email },
            'ติดตั้งระบบสำเร็จ สามารถเข้าสู่ระบบได้แล้ว',
            201
        )
    } catch (error) {
        console.error('Install error:', error)
        return errorResponse('เกิดข้อผิดพลาดในการติดตั้งระบบ', error)
    }
}
