'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

interface ImageUploadProps {
    value?: string | null
    onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const { showToast } = useToast()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error('Upload failed')

            const data = await res.json()
            onChange(data.url)
            showToast('Image uploaded successfully', 'success')
        } catch (err) {
            console.error('Upload error', err)
            showToast('Failed to upload image', 'error')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex items-center gap-4">
            {value ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt="Uploaded preview"
                        className="h-full w-full bg-white object-cover"
                    />
                </div>
            ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
                    <span className="text-xs text-slate-400">No Img</span>
                </div>
            )}
            <div className="flex-1">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                {uploading && (
                    <p className="mt-1 text-xs font-medium text-blue-600">
                        Uploading...
                    </p>
                )}
            </div>
        </div>
    )
}
