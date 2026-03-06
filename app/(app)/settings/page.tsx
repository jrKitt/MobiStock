'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

const STORE_NAME_STORAGE_KEY = 'mobistock_store_name'
const STORE_LOGO_STORAGE_KEY = 'mobistock_store_logo'
const PROMPTPAY_ID_STORAGE_KEY = 'mobistock_promptpay_id'
const STORE_CONFIG_UPDATED_EVENT = 'mobistock_store_config_updated'
const DEFAULT_STORE_NAME = 'MobiStock'
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result)
                return
            }
            reject(new Error('แปลงไฟล์ไม่สำเร็จ'))
        }
        reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
        reader.readAsDataURL(file)
    })
}

export default function SettingsPage() {
    const { showToast } = useToast()
    const [storeName, setStoreName] = useState('')
    const [storeLogo, setStoreLogo] = useState<string | null>(null)
    const [promptpayId, setPromptpayId] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        // โหลดชื่อร้านจาก localStorage
        try {
            setLoading(true)
            const savedName = localStorage.getItem(STORE_NAME_STORAGE_KEY)
            const savedLogo = localStorage.getItem(STORE_LOGO_STORAGE_KEY)
            const savedPromptpayId = localStorage.getItem(
                PROMPTPAY_ID_STORAGE_KEY
            )
            setStoreName(savedName || DEFAULT_STORE_NAME)
            setStoreLogo(savedLogo || null)
            setPromptpayId(savedPromptpayId || '')
        } catch {
            showToast('ไม่สามารถโหลดการตั้งค่าได้', 'error')
            setStoreName(DEFAULT_STORE_NAME)
            setStoreLogo(null)
            setPromptpayId('')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > MAX_LOGO_SIZE_BYTES) {
            showToast('ไฟล์โลโก้ต้องมีขนาดไม่เกิน 2MB', 'warning')
            e.target.value = ''
            return
        }

        try {
            const base64 = await fileToBase64(file)
            setStoreLogo(base64)
        } catch (error) {
            showToast(
                error instanceof Error
                    ? error.message
                    : 'ไม่สามารถอัปโหลดโลโก้ได้',
                'error'
            )
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeName.trim()) {
            showToast('กรุณาระบุชื่อร้าน', 'warning')
            return
        }

        try {
            setSaving(true)
            localStorage.setItem(STORE_NAME_STORAGE_KEY, storeName.trim())
            localStorage.setItem(PROMPTPAY_ID_STORAGE_KEY, promptpayId.trim())
            if (storeLogo) {
                localStorage.setItem(STORE_LOGO_STORAGE_KEY, storeLogo)
            } else {
                localStorage.removeItem(STORE_LOGO_STORAGE_KEY)
            }
            setStoreName(storeName.trim())
            setPromptpayId(promptpayId.trim())
            window.dispatchEvent(new Event(STORE_CONFIG_UPDATED_EVENT))
            showToast('บันทึกการตั้งค่าสำเร็จ', 'success')
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
                <h1 className="text-xl font-bold text-slate-900">
                    ตั้งค่าระบบ
                </h1>
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

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            โลโก้ร้านค้า
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            disabled={loading || saving}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            รองรับไฟล์ภาพขนาดไม่เกิน 2MB
                        </p>

                        {storeLogo && (
                            <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                                <Image
                                    src={storeLogo}
                                    alt="Store logo"
                                    width={56}
                                    height={56}
                                    unoptimized
                                    className="h-14 w-14 rounded-md border border-slate-200 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setStoreLogo(null)}
                                    disabled={loading || saving}
                                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    ลบโลโก้
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            รหัสพร้อมเพย์ (PromptPay ID)
                        </label>
                        <p className="mb-2 text-xs text-slate-500">
                            เบอร์โทรศัพท์, รหัสบัตรประชาชน หรือ e-Wallet ID
                            สำหรับสร้าง QR Code ชำระเงิน
                        </p>
                        <input
                            type="text"
                            value={promptpayId}
                            onChange={(e) => setPromptpayId(e.target.value)}
                            placeholder="เช่น 0812345678 หรือ 1123456789012"
                            maxLength={15}
                            disabled={loading || saving}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>

                    <div className="flex justify-end border-t border-slate-200 pt-4">
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
