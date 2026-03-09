'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { SparePart } from '@/types/api'
import ImageUpload from '@/components/ImageUpload'

export default function SparePartsPage() {
    const { showToast } = useToast()
    const [parts, setParts] = useState<SparePart[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPart, setSelectedPart] = useState<SparePart | null>(null)
    const [formData, setFormData] = useState({
        part_name: '',
        part_quantity: 0,
        image_url: '' as string | null,
    })

    const fetchParts = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/spare-parts?page=1&limit=100')
            if (!response.ok) throw new Error('Failed to fetch spare parts')
            const result = await response.json()
            setParts(result.data)
        } catch (err) {
            showToast('Failed to load spare parts', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchParts()
    }, [])

    const handleEdit = (part: SparePart) => {
        setSelectedPart(part)
        setFormData({
            part_name: part.part_name,
            part_quantity: part.part_quantity || 0,
            image_url: part.image_url || null,
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this spare part?')) return
        try {
            const response = await fetch(`/api/spare-parts/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete spare part')
            showToast('Spare part deleted successfully', 'success')
            fetchParts()
        } catch (err) {
            showToast('Failed to delete spare part', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedPart
                ? `/api/spare-parts/${selectedPart.part_id}`
                : '/api/spare-parts'
            const method = selectedPart ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save spare part')
            showToast(
                `Spare part ${selectedPart ? 'updated' : 'created'} successfully`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedPart(null)
            setFormData({
                part_name: '',
                part_quantity: 0,
                image_url: null,
            })
            fetchParts()
        } catch (err) {
            showToast('Failed to save spare part', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Spare Parts
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage components and replacement parts inventory
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedPart(null)
                        setFormData({
                            part_name: '',
                            part_quantity: 0,
                            image_url: null,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Add Part
                </button>
            </div>

            {loading ? (
                <div className="bg-bg flex items-center justify-center rounded-lg border border-slate-200 p-24">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                </div>
            ) : (
                <div className="bg-bg overflow-hidden rounded-lg border border-slate-200 shadow-xs">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="w-20 px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Image
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Part Name
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Quantity (In Stock)
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {parts.map((part) => (
                                <tr
                                    key={part.part_id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4">
                                        {part.image_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={part.image_url}
                                                alt={part.part_name}
                                                className="h-10 w-10 rounded-full border border-slate-200 bg-white object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-400">
                                                N/A
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                        {part.part_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`text-xs font-bold ${(part.part_quantity || 0) > 0 ? 'text-green-600' : 'text-rose-600'}`}
                                        >
                                            {(part.part_quantity || 0) > 0
                                                ? `${part.part_quantity} In Stock`
                                                : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(part)}
                                                className="text-slate-400 transition-colors hover:text-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    part.part_id &&
                                                    handleDelete(part.part_id)
                                                }
                                                className="text-slate-400 transition-colors hover:text-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-bg w-full max-w-md rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            {selectedPart ? 'Edit Part' : 'Add New Part'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Part Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.part_name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            part_name: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={formData.part_quantity}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            part_quantity:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Part Image
                                </label>
                                <ImageUpload
                                    value={formData.image_url}
                                    onChange={(url) =>
                                        setFormData({
                                            ...formData,
                                            image_url: url,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    {selectedPart ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
