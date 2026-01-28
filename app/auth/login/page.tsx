'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ')
            }

            // In a real app, you might store the user data/token here
            // localStorage.setItem('user', JSON.stringify(data.user))

            router.push('/dashboard')
        } catch (error) {
            alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-semibold text-gray-800">
                        MobiStock
                    </h1>
                    <p className="text-gray-600">ระบบจัดการสต็อกร้านโทรศัพท์</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-8">
                    <h2 className="mb-6 text-xl font-semibold text-gray-800">
                        เข้าสู่ระบบ
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                ชื่อผู้ใช้งาน
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="กรอกชื่อผู้ใช้งานของคุณ"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="กรอกรหัสผ่านของคุณ"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex cursor-pointer items-center gap-2">
                                {/*<input
                                    type="checkbox"
                                    className="rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-gray-600">จำฉันไว้</span>*/}
                            </label>
                            <a
                                href="#"
                                className="text-blue-600 hover:text-blue-700"
                            >
                                ลืมรหัสผ่าน?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        ยังไม่มีบัญชี?{' '}
                        <a
                            href="/auth/sign-up"
                            className="font-medium text-blue-600 hover:text-blue-700"
                        >
                            สมัครสมาชิก
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
