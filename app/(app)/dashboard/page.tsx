'use client'

import { useState, useEffect } from 'react'
import type { ProductRow } from '../../api/products/route'
import { useToast } from '@/components/ui/Toast'

interface PhoneData extends ProductRow {
    id: number
    status: string
}

interface PaginationData {
    data: ProductRow[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export default function DashboardPage() {
    const { showToast } = useToast()
    const [phones, setPhones] = useState<PhoneData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<PhoneData | null>(
        null
    )
    const [formData, setFormData] = useState({
        prod_name: '',
        serial_number: '',
        IMEI: '',
        sell_price: 0,
        status: 'Available',
        made_in: '',
    })

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                const response = await fetch(
                    `/api/products?page=${currentPage}&pageSize=${pageSize}`
                )
                if (!response.ok) throw new Error('Failed to fetch products')

                const data: PaginationData = await response.json()
                const formattedPhones = (data.data as ProductRow[]).map(
                    (product) => {
                        let status = 'Available'
                        if (product.status) {
                            status = product.status
                        }

                        return {
                            ...product,
                            id: product.prod_id,
                            status,
                            brand:
                                product.prod_name?.split(' ')[0] || 'Unknown',
                            model:
                                product.prod_name
                                    ?.split(' ')
                                    .slice(1)
                                    .join(' ') || '',
                            color: product.made_in || 'N/A',
                            storage: 'N/A',
                            price: product.sell_price || 0,
                            stock: 0,
                        }
                    }
                )

                setPhones(formattedPhones)
                setTotalPages(data.pagination.totalPages)
                setTotalItems(data.pagination.total)
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load products'
                setError(message)
                showToast(message, 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [currentPage, pageSize])

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPageSize = parseInt(e.target.value, 10)
        setPageSize(newPageSize)
        setCurrentPage(1)
    }

    const handleEdit = (product: PhoneData) => {
        setSelectedProduct(product)
        setFormData({
            prod_name: product.prod_name || '',
            serial_number: product.serial_number || '',
            IMEI: product.IMEI || '',
            sell_price: product.sell_price || 0,
            status: product.status || 'Available',
            made_in: product.made_in || '',
        })
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedProduct(null)
        setFormData({
            prod_name: '',
            serial_number: '',
            IMEI: '',
            sell_price: 0,
            status: 'Available',
            made_in: '',
        })
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'sell_price' ? parseFloat(value) || 0 : value,
        }))
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct) return

        try {
            const response = await fetch(
                `/api/products/${selectedProduct.prod_id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                }
            )

            if (!response.ok) throw new Error('Failed to update product')

            showToast('Product updated successfully', 'success')
            handleCloseModal()

            // Refresh data
            const updatedResponse = await fetch(
                `/api/products?page=${currentPage}&pageSize=${pageSize}`
            )
            if (updatedResponse.ok) {
                const data: PaginationData = await updatedResponse.json()
                const formattedPhones = (data.data as ProductRow[]).map(
                    (product) => {
                        let status = 'Available'
                        if (product.status) {
                            status = product.status
                        }

                        return {
                            ...product,
                            id: product.prod_id,
                            status,
                            brand:
                                product.prod_name?.split(' ')[0] || 'Unknown',
                            model:
                                product.prod_name
                                    ?.split(' ')
                                    .slice(1)
                                    .join(' ') || '',
                            color: product.made_in || 'N/A',
                            storage: 'N/A',
                            price: product.sell_price || 0,
                            stock: 0,
                        }
                    }
                )
                setPhones(formattedPhones)
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to update product'
            showToast(message, 'error')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return
        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete product')
            showToast('Product deleted successfully', 'success')
            
            // Refresh local state or re-fetch
            setPhones(phones.filter(p => p.prod_id !== id))
            setTotalItems(prev => prev - 1)
        } catch (err) {
            showToast('Error deleting product', 'error')
        }
    }

    return (
        <>
            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    Error: {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-24">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                        <p className="text-sm text-slate-500">Loading products...</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                    <div className="border-b border-slate-100 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex w-full items-center gap-6 max-sm:flex-col">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Inventory
                                    </h2>
                                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                        <span>{totalItems} total items</span>
                                        <span className="text-slate-300">•</span>
                                        <span>Page {currentPage} of {totalPages}</span>
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-slate-100 max-sm:hidden"></div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Show
                                    </label>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                                    >
                                        <option value={5}>5 per page</option>
                                        <option value={10}>10 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Product Info
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Serial / IMEI
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Price
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {phones.length > 0 ? (
                                    phones.map((phone) => (
                                        <tr
                                            key={phone.prod_id}
                                            className="transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500">
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {phone.prod_name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                            {phone.made_in || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-medium text-slate-600">
                                                    SN: {phone.serial_number || '-'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    IMEI: {phone.IMEI || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                                ฿{phone.sell_price?.toLocaleString() || '0'}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold">
                                                {phone.status === 'Available' ? (
                                                    <span className="text-green-600">Available</span>
                                                ) : phone.status === 'oos' ? (
                                                    <span className="text-orange-600">Out of Stock</span>
                                                ) : (
                                                    <span className="text-slate-400">Unknown</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(phone)}
                                                        className="p-1 text-slate-400 transition-colors hover:text-blue-600"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(phone.prod_id)}
                                                        className="p-1 text-slate-400 transition-colors hover:text-red-500"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-gray-500 font-medium"
                                        >
                                            No products found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 p-4 max-sm:flex-col gap-4">
                        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="rounded px-2 py-1 text-xs font-bold text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                PREV
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    if (totalPages <= 5 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-7 w-7 rounded text-xs font-bold transition-all ${
                                                    currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-400 hover:text-blue-600'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="px-1 text-slate-300">...</span>
                                    }
                                    return null
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded px-2 py-1 text-xs font-bold text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                Edit Product Details
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        name="prod_name"
                                        value={formData.prod_name}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        Serial Number
                                    </label>
                                    <input
                                        type="text"
                                        name="serial_number"
                                        value={formData.serial_number}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        IMEI
                                    </label>
                                    <input
                                        type="text"
                                        name="IMEI"
                                        value={formData.IMEI}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        Sale Price (฿)
                                    </label>
                                    <input
                                        type="number"
                                        name="sell_price"
                                        value={formData.sell_price}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-bold"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-semibold"
                                    >
                                        <option value="Available">Available</option>
                                        <option value="oos">Out of Stock</option>
                                        <option value="Sold">Sold</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        Made In
                                    </label>
                                    <input
                                        type="text"
                                        name="made_in"
                                        value={formData.made_in}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="rounded-md px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-none active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
