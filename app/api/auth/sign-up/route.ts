import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/response'
import bcrypt from 'bcryptjs'
import { RowDataPacket } from 'mysql2'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, username, email, password } = body

        if (!name || !username || !email || !password) {
            return errorResponse('กรุณากรอกข้อมูลให้ครบถ้วน', null, 400)
        }

        // Check if user already exists
        const existingUsers = await query<RowDataPacket>(
            'SELECT user_id FROM User WHERE email = ? OR username = ?',
            [email, username]
        )

        if (existingUsers.length > 0) {
            return errorResponse('อีเมลหรือชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว', null, 409)
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Insert user
        await query(
            'INSERT INTO User( username, email, password) VALUES ( ?, ?, ?)',
            [username, email, hashedPassword]
        )

        return successResponse(null, 'สมัครสมาชิกสำเร็จ', 201)
    } catch (error) {
        console.error('Sign up error:', error)
        return errorResponse('เกิดข้อผิดพลาดในการสมัครสมาชิก', error)
    }
}
