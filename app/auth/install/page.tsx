'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function InstallPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [step, setStep] = useState<'key' | 'register'>('key')
    const [serviceKey, setServiceKey] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const verifyServiceKey = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsVerifying(true)

        try {
            const res = await fetch('/api/auth/verify-service-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serviceKey }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'รหัสบริการไม่ถูกต้อง')
            }

            showToast('ยืนยันรหัสบริการสำเร็จ', 'success')
            setStep('register')
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'รหัสบริการไม่ถูกต้อง',
                'error'
            )
        } finally {
            setIsVerifying(false)
        }
    }

    const handleInstall = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (password !== confirmPassword) {
            showToast('รหัสผ่านไม่ตรงกัน', 'error')
            return
        }

        if (password.length < 6) {
            showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error')
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/sign-up', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    username,
                    email,
                    password,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(
                    data.message || 'เกิดข้อผิดพลาดในการติดตั้งระบบ'
                )
            }

            showToast('ติดตั้งระบบสำเร็จ กำลังเข้าสู่ระบบ...', 'success')
            
            setTimeout(() => {
                router.push('/auth/login')
            }, 1500)
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
                'error'
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="w-full max-w-md relative z-10">
            
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
                    {step === 'key' ? (
                        <>
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    ยืนยันรหัสบริการ
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    กรอกรหัสบริการเพื่อเริ่มติดตั้งระบบ
                                </p>
                            </div>

                            <form onSubmit={verifyServiceKey} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        รหัสบริการ (Service Key)
                                    </label>
                                    <input
                                        type="password"
                                        value={serviceKey}
                                        onChange={(e) => setServiceKey(e.target.value)}
                                        placeholder="กรอกรหัสบริการที่ได้รับจากผู้ติดตั้ง"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        ติดต่อผู้ดูแลระบบหากไม่มีรหัสบริการ
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isVerifying || !serviceKey}
                                    className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isVerifying ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัสบริการ'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="mb-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        สร้างบัญชีผู้ดูแลระบบ
                                    </h2>
                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                        ✓ ยืนยันแล้ว
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    สร้างบัญชีแอดมินสำหรับเข้าใช้งานระบบ
                                </p>
                            </div>

                            <form onSubmit={handleInstall} className="space-y-4">
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
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        ชื่อผู้ใช้งาน (Username)
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value.toLowerCase())
                                        }
                                        placeholder="ตั้งชื่อผู้ใช้งาน"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        placeholder="example@email.com"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                                        required
                                        minLength={6}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        ยืนยันรหัสผ่าน
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                                        required
                                        minLength={6}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('key')
                                            setName('')
                                            setUsername('')
                                            setEmail('')
                                            setPassword('')
                                            setConfirmPassword('')
                                        }}
                                        className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                    >
                                        ย้อนกลับ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isLoading ? 'กำลังติดตั้ง...' : 'ติดตั้งระบบ'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
                        <p>
                            ต้องการเข้าสู่ระบบ?{' '}
                            <a
                                href="/auth/login"
                                className="font-medium text-blue-600 hover:text-blue-700"
                            >
                                เข้าสู่ระบบที่นี่
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-gray-500">
                    <p>MobiStock - ระบบจัดการสต็อกร้านโทรศัพท์</p>
                </div>
            </div>
        </div>
    )
}
