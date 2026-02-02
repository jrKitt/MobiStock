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
        name: '',
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
            name: product.prod_name || '',
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
            name: '',
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

            showToast('แก้ไขข้อมูลสำเร็จ', 'success')
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

    return (
        <>
            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    เกิดข้อผิดพลาด: {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12 shadow-lg">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-7">
                        <div className="flex items-center justify-between">
                            <div className="flex w-full items-center gap-8 max-sm:flex-col max-sm:justify-center">
                                <div>
                                    <div className="mb-3 flex items-center gap-3 max-sm:justify-center">
                                        <div>
                                            <h2 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent">
                                                คลังสินค้า
                                            </h2>
                                        </div>
                                    </div>
                                    <p className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                            รวม {totalItems} รายการ
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                            หน้า {currentPage}/{totalPages}
                                        </span>
                                    </p>
                                </div>
                                <div className="h-16 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent max-sm:hidden"></div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <svg
                                            className="h-4 w-4 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                        แสดงต่อหน้า:
                                    </label>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:border-gray-300 focus:border-blue-500 focus:ring-0 focus:outline-none"
                                    >
                                        <option value={5}>5 รายการ</option>
                                        <option value={10}>10 รายการ</option>
                                        <option value={25}>25 รายการ</option>
                                        <option value={50}>50 รายการ</option>
                                        <option value={100}>100 รายการ</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="h-4 w-4 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            </svg>
                                            ชื่อสินค้า
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        Serial Number
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        IMEI
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="h-4 w-4 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            ราคาขาย
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="h-4 w-4 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            สถานะ
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <svg
                                                className="h-4 w-4 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                            การจัดการ
                                        </div>
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
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                                                        <svg
                                                            className="h-5 w-5 text-gray-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {phone.prod_name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {phone.serial_number ||
                                                                'ไม่ระบุ'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {phone.serial_number || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {phone.IMEI || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    ฿
                                                    {phone.sell_price?.toLocaleString() ||
                                                        '0'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                                        phone.status ===
                                                        'Available'
                                                            ? 'bg-green-100 text-green-800 ring-1 ring-green-200'
                                                            : phone.status ===
                                                                'oos'
                                                              ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-200'
                                                              : 'bg-red-100 text-red-800 ring-1 ring-red-200'
                                                    }`}
                                                >
                                                    {phone.status ===
                                                        'Available' && (
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    )}
                                                    {phone.status ===
                                                    'Available'
                                                        ? 'พร้อมขาย'
                                                        : phone.status === 'oos'
                                                          ? 'หมดสต็อก'
                                                          : 'ไม่ระบุ'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(phone)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-all duration-200 hover:bg-blue-100"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                        แก้ไข
                                                    </button>
                                                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-all duration-200 hover:bg-red-100">
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                        ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            ไม่มีข้อมูลสินค้า
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between border-t border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6 max-sm:flex-col">
                        <div className="text-sm font-medium text-gray-600">
                            <span className="text-gray-900">
                                แสดงรายการที่ {(currentPage - 1) * pageSize + 1}
                            </span>
                            <span className="mx-2 text-gray-400">ถึง</span>
                            <span className="text-gray-900">
                                {Math.min(currentPage * pageSize, totalItems)}
                            </span>
                            <span className="mx-2 text-gray-400">
                                จากทั้งหมด
                            </span>
                            <span className="text-gray-900">{totalItems}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-white"
                            >
                                ←
                            </button>

                            <div className="flex gap-1.5">
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                ).map((page) => {
                                    if (
                                        totalPages <= 7 ||
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 &&
                                            page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    setCurrentPage(page)
                                                }
                                                className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                                    currentPage === page
                                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
                                                        : 'border-2 border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return (
                                            <span
                                                key={page}
                                                className="px-2 py-2 font-semibold text-gray-400"
                                            >
                                                ...
                                            </span>
                                        )
                                    }
                                    return null
                                })}
                            </div>

                            <button
                                onClick={() =>
                                    setCurrentPage(
                                        Math.min(totalPages, currentPage + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-white"
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
