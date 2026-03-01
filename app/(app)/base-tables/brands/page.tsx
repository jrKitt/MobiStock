'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Brand } from '@/types/api'

export default function BrandsPage() {
    const { showToast } = useToast()
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
    const [formData, setFormData] = useState({
        brand_name: '',
        brand_country: '',
    })

    const fetchBrands = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/brands?page=1&limit=100')
            if (!response.ok) throw new Error('Failed to fetch brands')
            const result = await response.json()
            setBrands(result.data)
        } catch (err) {
            showToast('Failed to load brands', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBrands()
    }, [])

    const handleEdit = (brand: Brand) => {
        setSelectedBrand(brand)
        setFormData({
            brand_name: brand.brand_name,
            brand_country: brand.brand_country || '',
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this brand?')) return
        try {
            const response = await fetch(`/api/brands/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete brand')
            showToast('Brand deleted successfully', 'success')
            fetchBrands()
        } catch (err) {
            showToast('Failed to delete brand', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedBrand
                ? `/api/brands/${selectedBrand.brand_id}`
                : '/api/brands'
            const method = selectedBrand ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save brand')
            showToast(
                `Brand ${selectedBrand ? 'updated' : 'created'} successfully`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedBrand(null)
            setFormData({ brand_name: '', brand_country: '' })
            fetchBrands()
        } catch (err) {
            showToast('Failed to save brand', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Brands
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage your product brands and origins
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedBrand(null)
                        setFormData({ brand_name: '', brand_country: '' })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Add Brand
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
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Brand Name
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Country
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {brands.map((brand) => (
                                <tr
                                    key={brand.brand_id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                                        {brand.brand_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {brand.brand_country || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() =>
                                                    handleEdit(brand)
                                                }
                                                className="text-slate-400 transition-colors hover:text-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    brand.brand_id &&
                                                    handleDelete(brand.brand_id)
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
                            {selectedBrand ? 'Edit Brand' : 'Add New Brand'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Brand Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.brand_name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            brand_name: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    value={formData.brand_country}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            brand_country: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
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
                                    {selectedBrand ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
