'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

const STORAGE_KEY = 'mobistock_store_name'
const DEFAULT_STORE_NAME = 'MobiStock'

export default function SettingsPage() {
    const { showToast } = useToast()
    const [storeName, setStoreName] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        // โหลดชื่อร้านจาก localStorage
        try {
            setLoading(true)
            const savedName = localStorage.getItem(STORAGE_KEY)
            setStoreName(savedName || DEFAULT_STORE_NAME)
        } catch (error) {
            showToast('ไม่สามารถโหลดการตั้งค่าได้', 'error')
            setStoreName(DEFAULT_STORE_NAME)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeName.trim()) {
            showToast('กรุณาระบุชื่อร้าน', 'warning')
            return
        }

        try {
            setSaving(true)
            localStorage.setItem(STORAGE_KEY, storeName.trim())
            setStoreName(storeName.trim())
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
