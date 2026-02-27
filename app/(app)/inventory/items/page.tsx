'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ProductItem, ProductModel } from '@/types/api'

interface PaginationData {
    data: ProductItem[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export default function ProductItemsPage() {
    const { showToast } = useToast()
    const [items, setItems] = useState<ProductItem[]>([])
    const [models, setModels] = useState<ProductModel[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [formData, setFormData] = useState({
        item_serial_number: '',
        item_imei: '',
        item_lot_number: '',
        item_status: 'Available',
        model_id: 0,
    })

    const fetchData = async (page: number = 1, limit: number = 10) => {
        try {
            setLoading(true)
            const [itemsRes, modelsRes] = await Promise.all([
                fetch(`/api/product-items?page=${page}&limit=${limit}`),
                fetch('/api/product-models?page=1&limit=100'),
            ])

            if (!itemsRes.ok || !modelsRes.ok) throw new Error('Failed to fetch data')

            const [itemsData, modelsData] = await Promise.all([
                itemsRes.json(),
                modelsRes.json(),
            ])

            setItems(itemsData.data)
            setModels(modelsData.data)
            setTotalPages(itemsData.pagination?.totalPages || 1)
            setTotalItems(itemsData.pagination?.total || 0)
        } catch (err) {
            showToast('ไม่สามารถโหลดข้อมูลสินค้าได้', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData(currentPage, pageSize)
    }, [currentPage, pageSize])

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPageSize = parseInt(e.target.value, 10)
        setPageSize(newPageSize)
        setCurrentPage(1)
    }

    const handleEdit = (item: ProductItem) => {
        setSelectedItem(item)
        setFormData({
            item_serial_number: item.item_serial_number || '',
            item_imei: item.item_imei || '',
            item_lot_number: item.item_lot_number || '',
            item_status: item.item_status || 'Available',
            model_id: item.model_id || 0,
        })
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
        setFormData({
            item_serial_number: '',
            item_imei: '',
            item_lot_number: '',
            item_status: 'Available',
            model_id: models[0]?.model_id || 0,
        })
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'model_id' ? parseInt(value) || 0 : value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedItem) return

        try {
            const response = await fetch(
                `/api/product-items/${selectedItem.item_id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                }
            )

            if (!response.ok) throw new Error('Failed to update item')
            showToast('อัปเดตรายการเรียบร้อยแล้ว', 'success')
            handleCloseModal()

            // Refresh data
            fetchData(currentPage, pageSize)
        } catch (err) {
            showToast('ไม่สามารถอัปเดตรายการได้', 'error')
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/product-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to create item')
            showToast('สร้างรายการเรียบร้อยแล้ว', 'success')
            handleCloseModal()

            // Refresh data
            setCurrentPage(1)
            fetchData(1, pageSize)
        } catch (err) {
            showToast('ไม่สามารถสร้างรายการได้', 'error')
        }
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        if (selectedItem) {
            handleSubmit(e)
        } else {
            handleCreate(e)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return
        try {
            const response = await fetch(`/api/product-items/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete item')
            showToast('ลบรายการเรียบร้อยแล้ว', 'success')

            setItems(items.filter((i) => i.item_id !== id))
            setTotalItems((prev) => prev - 1)
        } catch (err) {
            showToast('ไม่สามารถลบรายการได้', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">รายการสินค้า</h1>
                </div>
                <button
                    onClick={() => {
                        setSelectedItem(null)
                        setFormData({
                            item_serial_number: '',
                            item_imei: '',
                            item_lot_number: '',
                            item_status: 'Available',
                            model_id: models[0]?.model_id || 0,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    เพิ่มรายการ
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-24">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                        <p className="text-sm text-slate-500">กำลังโหลดรายการ...</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                    <div className="border-b border-slate-100 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex w-full items-center gap-6 max-sm:flex-col">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        รายการสินค้า
                                    </h2>
                                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                        <span>ทั้งหมด {totalItems} รายการ</span>
                                        <span className="text-slate-300">
                                            •
                                        </span>
                                        <span>
                                            หน้า {currentPage} จาก {totalPages}
                                        </span>
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-slate-100 max-sm:hidden"></div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                        แสดง
                                    </label>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                                    >
                                        <option value={5}>
                                            5 รายการต่อหน้า
                                        </option>
                                        <option value={10}>
                                            10 รายการต่อหน้า
                                        </option>
                                        <option value={25}>
                                            25 รายการต่อหน้า
                                        </option>
                                        <option value={50}>
                                            50 รายการต่อหน้า
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">รุ่น / SN</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">IMEI / แบตช์</th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">สถานะ</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500">
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
                                                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            {models.find(m => m.model_id === item.model_id)?.model_name || 'Unknown Model'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium uppercase">SN: {item.item_serial_number || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900">IMEI: {item.item_imei || '-'}</div>
                                                <div className="text-xs text-slate-400">Lot: {item.item_lot_number || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-semibold ${
                                                    item.item_status === 'Available' ? 'text-green-600' : 
                                                    item.item_status === 'Sold' ? 'text-gray-600' :
                                                    item.item_status === 'Reserved' ? 'text-orange-600' :
                                                    'text-slate-400'
                                                }`}>
                                                    {item.item_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-1 text-slate-400 transition-colors hover:text-blue-600"
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
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            item.item_id && handleDelete(item.item_id)
                                                        }
                                                        className="p-1 text-slate-400 transition-colors hover:text-red-500"
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
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center font-medium text-gray-500"
                                        >
                                            ไม่พบรายการ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/30 p-4 max-sm:flex-col">
                        <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            แสดง {(currentPage - 1) * pageSize + 1} -{' '}
                            {Math.min(currentPage * pageSize, totalItems)} จาก{' '}
                            {totalItems}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className="rounded px-2 py-1 text-xs font-bold text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                ก่อนหน้า
                            </button>

                            <div className="flex gap-1">
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                ).map((page) => {
                                    if (
                                        totalPages <= 5 ||
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
                                                className={`h-7 w-7 rounded text-xs font-bold transition-all ${
                                                    currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-400 hover:text-blue-600'
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
                                                className="px-1 text-slate-300"
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
                                className="rounded px-2 py-1 text-xs font-bold text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">{selectedItem ? 'แก้ไขรายการ' : 'สร้างรายการใหม่'}</h2>
                            <button
                                onClick={handleCloseModal}
                                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-blue-600"
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

                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        รุ่นสินค้า
                                    </label>
                                    <select
                                        required
                                        name="model_id"
                                        value={formData.model_id}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    >
                                        <option value={0}>เลือกรุ่น</option>
                                        {models.map(model => (
                                            <option key={model.model_id} value={model.model_id}>{model.model_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">หมายเลขซีเรียล</label>
                                    <input
                                        type="text"
                                        name="item_serial_number"
                                        value={formData.item_serial_number}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">IMEI</label>
                                    <input
                                        type="text"
                                        name="item_imei"
                                        value={formData.item_imei}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">หมายเลขแบตช์</label>
                                    <input
                                        type="text"
                                        name="item_lot_number"
                                        value={formData.item_lot_number}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">สถานะ</label>
                                    <select
                                        required
                                        name="item_status"
                                        value={formData.item_status}
                                        onChange={handleInputChange}
                                        className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    >
                                        <option value="Available">พร้อมใช้</option>
                                        <option value="Sold">ขายแล้ว</option>
                                        <option value="Damaged">เสียหาย</option>
                                        <option value="Reserved">จองแล้ว</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="rounded-md px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-none active:scale-95"
                                >
                                    {selectedItem ? 'อัปเดต' : 'สร้าง'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}