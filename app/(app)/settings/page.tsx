'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function SettingsPage() {
    const { showToast } = useToast()
    const [storeName, setStoreName] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/config', { cache: 'no-store' })
            if (!res.ok) {
                throw new Error('ไม่สามารถโหลดการตั้งค่าได้')
            }
            const data = await res.json()
            setStoreName(data?.data?.storeName || 'MobiStock')
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
                'error'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeName.trim()) {
            showToast('กรุณาระบุชื่อร้าน', 'warning')
            return
        }

        try {
            setSaving(true)
            const res = await fetch('/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ storeName: storeName.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data?.message || 'บันทึกไม่สำเร็จ')
            }

            setStoreName(data?.data?.storeName || storeName.trim())
            showToast('บันทึกชื่อร้านสำเร็จ', 'success')
        } catch (error) {
            showToast(
                error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
                'error'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
            <div className="bg-bg rounded-xl border border-slate-200 p-6">
                <h1 className="text-xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    แก้ไขข้อมูลชื่อร้านสำหรับการแสดงผลในระบบและงานพิมพ์
                </p>

                <form onSubmit={handleSave} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            ชื่อร้าน
                        </label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="เช่น MobiStock"
                            maxLength={100}
                            disabled={loading || saving}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
