'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Supplier } from '@/types/api'
import ImageUpload from '@/components/ImageUpload'

export default function SuppliersPage() {
    const { showToast } = useToast()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
        null
    )
    const [formData, setFormData] = useState({
        supplier_name: '',
        supplier_phone: '',
        supplier_email: '',
        supplier_address: '',
        supplier_contact_person: '',
        image_url: '' as string | null,
    })

    const fetchSuppliers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/suppliers?page=1&limit=100')
            if (!response.ok) throw new Error('Failed to fetch suppliers')
            const result = await response.json()
            setSuppliers(result.data)
        } catch (err) {
            showToast('Failed to load suppliers', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier)
        setFormData({
            supplier_name: supplier.supplier_name,
            supplier_phone: supplier.supplier_phone || '',
            supplier_email: supplier.supplier_email || '',
            supplier_address: supplier.supplier_address || '',
            supplier_contact_person: supplier.supplier_contact_person || '',
            image_url: supplier.image_url || null,
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return
        try {
            const response = await fetch(`/api/suppliers/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete supplier')
            showToast('Supplier deleted successfully', 'success')
            fetchSuppliers()
        } catch (err) {
            showToast('Failed to delete supplier', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedSupplier
                ? `/api/suppliers/${selectedSupplier.supplier_id}`
                : '/api/suppliers'
            const method = selectedSupplier ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save supplier')
            showToast(
                `Supplier ${selectedSupplier ? 'updated' : 'created'} successfully`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedSupplier(null)
            setFormData({
                supplier_name: '',
                supplier_phone: '',
                supplier_email: '',
                supplier_address: '',
                supplier_contact_person: '',
                image_url: null,
            })
            fetchSuppliers()
        } catch (err) {
            showToast('Failed to save supplier', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Suppliers
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage your product vendors and partners
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedSupplier(null)
                        setFormData({
                            supplier_name: '',
                            supplier_phone: '',
                            supplier_email: '',
                            supplier_address: '',
                            supplier_contact_person: '',
                            image_url: null,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Add Supplier
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
                                    Logo
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Supplier
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Contact
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Email / Phone
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {suppliers.map((supplier) => (
                                <tr
                                    key={supplier.supplier_id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4">
                                        {supplier.image_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={supplier.image_url}
                                                alt={supplier.supplier_name}
                                                className="h-10 w-10 rounded-lg border border-slate-200 bg-white object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-400">
                                                N/A
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {supplier.supplier_name}
                                        </div>
                                        <div className="max-w-xs truncate text-[10px] font-medium text-slate-400 uppercase">
                                            {supplier.supplier_address ||
                                                'No Address'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                        {supplier.supplier_contact_person ||
                                            '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900">
                                            {supplier.supplier_email || '-'}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {supplier.supplier_phone || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() =>
                                                    handleEdit(supplier)
                                                }
                                                className="text-slate-400 transition-colors hover:text-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    supplier.supplier_id &&
                                                    handleDelete(
                                                        supplier.supplier_id
                                                    )
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
                    <div className="bg-bg w-full max-w-lg rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            {selectedSupplier
                                ? 'Edit Supplier'
                                : 'Add New Supplier'}
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Supplier Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.supplier_name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            supplier_name: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    value={formData.supplier_contact_person}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            supplier_contact_person:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={formData.supplier_phone}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            supplier_phone: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.supplier_email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            supplier_email: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Address
                                </label>
                                <textarea
                                    value={formData.supplier_address}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            supplier_address: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                    rows={3}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Supplier Logo
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
                            <div className="col-span-2 flex justify-end gap-3 pt-4">
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
                                    {selectedSupplier ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
