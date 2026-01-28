'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            alert('รหัสผ่านไม่ตรงกัน')
            return
        }
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/sign-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, username, email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
            }

            alert('สมัครสมาชิกสำเร็จ')
            router.push('/login')
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
                        สมัครสมาชิก
                    </h2>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                ชื่อ-นามสกุล
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="กรอกชื่อ-นามสกุลของคุณ"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                ชื่อผู้ใช้งาน (Username)
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ตั้งชื่อผู้ใช้งาน"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                อีเมล
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="กรอกอีเมลของคุณ"
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
                                placeholder="กำหนดรหัสผ่าน"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        มีบัญชีอยู่แล้ว?{' '}
                        <Link
                            href="/auth/login"
                            className="font-medium text-blue-600 hover:text-blue-700"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
