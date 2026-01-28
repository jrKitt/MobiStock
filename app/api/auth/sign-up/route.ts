import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, username, email, password } = body;

        if (!name || !username || !email || !password) {
            return NextResponse.json(
                { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUsers = await query<RowDataPacket>(
            'SELECT user_id FROM Users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return NextResponse.json(
                { message: 'อีเมลหรือชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        await query(
            'INSERT INTO Users ( username, email, password, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, username, email, hashedPassword]
        );

        return NextResponse.json(
            { message: 'สมัครสมาชิกสำเร็จ' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Sign up error:', error);
        return NextResponse.json(
            { message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
            { status: 500 }
        );
    }
}
