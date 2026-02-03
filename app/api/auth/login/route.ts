import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return errorResponse('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน', null, 400);
        }

        // Find user
        const users = await query<RowDataPacket>(
            'SELECT user_id, username, email, password FROM User WHERE username = ?',
            [username]
        );

        const user = users[0];

        if (!user) {
            return errorResponse('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', null, 401);
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return errorResponse('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง', null, 401);
        }

        // Generate JWT
        const token = await signToken({
            id: user.user_id,
            username: user.username,
            email: user.email,
            name: user.name
        });

        // Create response
        const response = successResponse(
            {
                user: {
                    id: user.user_id,
                    name: user.name,
                    username: user.username,
                    email: user.email
                }
            },
            'เข้าสู่ระบบสำเร็จ'
        );

        // Set Cookie
        response.cookies.set({
            name: 'token_mobi',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error);
    }
}
