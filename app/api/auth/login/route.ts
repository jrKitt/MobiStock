import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' },
                { status: 400 }
            );
        }

        // Find user
        const users = await query<RowDataPacket>(
            'SELECT user_id, username, email, password FROM User WHERE username = ?',
            [username]
        );

        const user = users[0];

        if (!user) {
            return NextResponse.json(
                { message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            );
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            );
        }

        // Generate JWT
        const token = await signToken({
            id: user.user_id,
            username: user.username,
            email: user.email,
            name: user.name
        });

        // Create response
        const response = NextResponse.json(
            {
                message: 'เข้าสู่ระบบสำเร็จ',
                user: {
                    id: user.user_id,
                    name: user.name,
                    username: user.username,
                    email: user.email
                }
            },
            { status: 200 }
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
        return NextResponse.json(
            { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
            { status: 500 }
        );
    }
}
