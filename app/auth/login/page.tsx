'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { FaGithub } from 'react-icons/fa'
import { useAppSettings } from '@/hooks/useAppSettings'

interface Developer {
    name: string
    github: string
}

interface AppConfig {
    app: {
        name: string
        version: string
        description: string
    }
    developers: Developer[]
    lastUpdated: string
}

export default function LoginPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [config, setConfig] = useState<AppConfig | null>(null)
    
    useAppSettings() // This will set tab icon and title based on settings

    useEffect(() => {
        // Load config.json
        fetch('/config.json')
            .then((res) => res.json())
            .then((data) => setConfig(data))
            .catch((err) => console.error('Failed to load config:', err))
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setUsernameError('')
        setPasswordError('')

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
                if (data.message === 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ') {
                    setUsernameError(data.message)
                } else if (data.message === 'รหัสผ่านไม่ถูกต้อง') {
                    setPasswordError(data.message)
                }
                throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ')
            }

            showToast('เข้าสู่ระบบสำเร็จ', 'success')
            router.push('/dashboard')
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
        <div
            className="flex min-h-screen items-center justify-center px-4"
        >
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
                                onChange={(e) => {
                                    setUsername(e.target.value)
                                    setUsernameError('')
                                }}
                                placeholder="กรอกชื่อผู้ใช้งานของคุณ"
                                required
                                className={`w-full rounded-lg border px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:outline-none ${usernameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                            />
                            {usernameError && (
                                <p className="mt-1 text-sm text-red-500">
                                    {usernameError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setPasswordError('')
                                }}
                                placeholder="กรอกรหัสผ่านของคุณ"
                                required
                                className={`w-full rounded-lg border px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:outline-none ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                            />
                            {passwordError && (
                                <p className="mt-1 text-sm text-red-500">
                                    {passwordError}
                                </p>
                            )}
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

                {/* Footer with Build Info */}
                {config && (
                    <div className="mt-10 text-center">
                        {/* <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white/80 px-5 py-4 text-xs text-gray-500 shadow-sm backdrop-blur-sm">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <span className="text-gray-400">Built by</span>

                                {config.developers.map((dev, index) => (
                                    <a
                                        key={dev.name}
                                        href={dev.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-medium text-blue-600 transition-colors hover:text-blue-700"
                                    >
                                        <FaGithub className="h-3.5 w-3.5" />
                                        {dev.name}
                                    </a>
                                ))}
                            </div>

                            <div className="my-3 h-px w-full bg-gray-100" />

                            <div className="flex flex-col items-center gap-1 text-gray-400 sm:flex-row sm:justify-center sm:gap-3">
                                <span>Last updated: {config.lastUpdated}</span>
                            </div>
                        </div> */}
                    </div>
                )}
            </div>
        </div>
    )
}
