'use client'

import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import {
    RepairOrder,
    Customer,
    ProductItem,
    SparePart,
    RepairOrderPart,
    ProductModel,
} from '@/types/api'
import { PrintIcon, EditIcon, DeleteIcon, CloseIcon } from '@/lib/icons'

export default function RepairOrdersPage() {
    const { showToast } = useToast()
    const [storeName, setStoreName] = useState('MobiStock')
    const [storeLogo, setStoreLogo] = useState<string | null>(null)
    const [repairs, setRepairs] = useState<
        (RepairOrder & { parts?: RepairOrderPart[] })[]
    >([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [items, setItems] = useState<ProductItem[]>([])
    const [spareParts, setSpareParts] = useState<SparePart[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPrintOpen, setIsPrintOpen] = useState(false)
    const [selectedRepair, setSelectedRepair] = useState<RepairOrder | null>(
        null
    )
    const [isPartsModalOpen, setIsPartsModalOpen] = useState(false)
    const [selectedPartsRepair, setSelectedPartsRepair] =
        useState<RepairOrder | null>(null)
    const [repairParts, setRepairParts] = useState<RepairOrderPart[]>([])
    const printRef = useRef<HTMLDivElement>(null)
    const [formData, setFormData] = useState({
        repair_problem_desc: '',
        repair_technician_note: '',
        repair_date_received: new Date().toISOString().split('T')[0],
        repair_date_completed: '',
        repair_labor_cost: 0,
        repair_status: 'received',
        customer_id: 0,
        item_id: 0,
    })
    const [partFormData, setPartFormData] = useState({
        part_id: 0,
        repair_part_quantity: 1,
        repair_part_unit_price: 0,
    })

    // Search and Filter States
    const [filterQuery, setFilterQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterStartDate, setFilterStartDate] = useState('')
    const [filterEndDate, setFilterEndDate] = useState('')

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const itemsPerPage = 10

    // Inline Creation States
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
    const [isCreatingItem, setIsCreatingItem] = useState(false)
    const [newCustomerData, setNewCustomerData] = useState({
        customer_fname: '',
        customer_lname: '',
        customer_phone: '',
    })
    const [newItemData, setNewItemData] = useState({
        item_serial_number: '',
        item_imei: '',
        model_id: 0,
    })
    const [models, setModels] = useState<ProductModel[]>([])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('limit', itemsPerPage.toString())
            if (filterQuery) params.append('search', filterQuery)
            if (filterStatus) params.append('status', filterStatus)
            if (filterStartDate) params.append('start_date', filterStartDate)
            if (filterEndDate) params.append('end_date', filterEndDate)

            const [repairsRes, customersRes, itemsRes, partsRes, modelsRes] =
                await Promise.all([
                    fetch(`/api/repair-orders?${params.toString()}`),
                    fetch('/api/customers?page=1&limit=1000'),
                    fetch('/api/product-items?page=1&limit=1000'),
                    fetch('/api/spare-parts?page=1&limit=1000'),
                    fetch('/api/product-models?page=1&limit=1000'),
                ])

            if (
                !repairsRes.ok ||
                !customersRes.ok ||
                !itemsRes.ok ||
                !partsRes.ok ||
                !modelsRes.ok
            ) {
                throw new Error('ไม่สามารถดึงข้อมูลได้')
            }

            const [
                repairsData,
                customersData,
                itemsData,
                partsData,
                modelsData,
            ] = await Promise.all([
                repairsRes.json(),
                customersRes.json(),
                itemsRes.json(),
                partsRes.json(),
                modelsRes.json(),
            ])

            setRepairs(repairsData.data)
            if (repairsData.pagination) {
                setTotalPages(repairsData.pagination.totalPages)
                setTotalItems(repairsData.pagination.total)
            }
            setCustomers(customersData.data)
            setItems(itemsData.data)
            setSpareParts(partsData.data)
            setModels(modelsData.data)
        } catch {
            showToast('ไม่สามารถโหลดข้อมูลซ่อมได้', 'error')
        } finally {
            setLoading(false)
        }
    }, [
        currentPage,
        filterQuery,
        filterStatus,
        filterStartDate,
        filterEndDate,
        showToast,
    ])

    const fetchRepairParts = async (repairId: number) => {
        try {
            const response = await fetch(
                `/api/repair-order-parts?repair_id=${repairId}`
            )
            if (response.ok) {
                const data = await response.json()
                setRepairParts(Array.isArray(data.data) ? data.data : [])
            }
        } catch (err) {
            console.error('Failed to fetch repair parts:', err)
        }
    }

    useEffect(() => {
        // Use a small delay for search to debounce
        const timer = setTimeout(() => {
            fetchData()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchData])

    useEffect(() => {
        // โหลดชื่อร้านจาก localStorage
        try {
            const savedName = localStorage.getItem('mobistock_store_name')
            const savedLogo = localStorage.getItem('mobistock_store_logo')
            if (savedName && savedName.trim()) {
                setStoreName(savedName)
            }
            setStoreLogo(savedLogo || null)
        } catch {}
    }, [])

    const handleEdit = (repair: RepairOrder) => {
        setSelectedRepair(repair)
        setFormData({
            repair_problem_desc: repair.repair_problem_desc,
            repair_technician_note: repair.repair_technician_note,
            repair_date_received: new Date(repair.repair_date_received)
                .toISOString()
                .split('T')[0],
            repair_date_completed: repair.repair_date_completed
                ? new Date(repair.repair_date_completed)
                      .toISOString()
                      .split('T')[0]
                : '',
            repair_labor_cost: repair.repair_labor_cost || 0,
            repair_status: repair.repair_status || 'received',
            customer_id: repair.customer_id || 0,
            item_id: repair.item_id || 0,
        })
        setIsModalOpen(true)
    }

    const handleOpenParts = async (repair: RepairOrder) => {
        setSelectedPartsRepair(repair)
        setPartFormData({
            part_id: 0,
            repair_part_quantity: 1,
            repair_part_unit_price: 0,
        })
        if (repair.repair_id) {
            await fetchRepairParts(repair.repair_id)
        }
        setIsPartsModalOpen(true)
    }

    const handleAddPart = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPartsRepair?.repair_id) return

        try {
            const response = await fetch('/api/repair-order-parts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repair_id: selectedPartsRepair.repair_id,
                    ...partFormData,
                }),
            })

            if (!response.ok) throw new Error('Failed to add part')
            showToast('อะไหล่เพิ่มสำเร็จ', 'success')
            setPartFormData({
                part_id: 0,
                repair_part_quantity: 1,
                repair_part_unit_price: 0,
            })
            await fetchRepairParts(selectedPartsRepair.repair_id)
        } catch {
            showToast('ไม่สามารถเพิ่มอะไหล่ได้', 'error')
        }
    }

    const handleDeletePart = async (partId: number) => {
        if (!selectedPartsRepair?.repair_id) return
        if (!confirm('ต้องการลบอะไหล่นี้หรือไม่?')) return

        try {
            const response = await fetch(
                `/api/repair-order-parts?repair_id=${selectedPartsRepair.repair_id}&part_id=${partId}`,
                { method: 'DELETE' }
            )
            if (!response.ok) throw new Error('Failed to delete part')
            showToast('อะไหล่ลบสำเร็จ', 'success')
            await fetchRepairParts(selectedPartsRepair.repair_id)
        } catch {
            showToast('ไม่สามารถลบอะไหล่ได้', 'error')
        }
    }

    const handlePrint = (repair: RepairOrder) => {
        setSelectedRepair(repair)
        setIsPrintOpen(true)
        setTimeout(() => {
            window.print()
        }, 100)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบคำขอซ่อมนี้หรือไม่?')) return
        try {
            const response = await fetch(`/api/repair-orders/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete repair')
            showToast('คำขอซ่อมลบสำเร็จ', 'success')
            fetchData()
        } catch {
            showToast('ไม่สามารถลบคำขอซ่อมได้', 'error')
        }
    }

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomerData),
            })
            if (!response.ok) throw new Error('Failed to create customer')
            const result = await response.json()

            setCustomers([...customers, result.data])
            setFormData({ ...formData, customer_id: result.data.customer_id })
            setIsCreatingCustomer(false)
            setNewCustomerData({
                customer_fname: '',
                customer_lname: '',
                customer_phone: '',
            })
            showToast('เพิ่มลูกค้าใหม่สำเร็จ', 'success')
        } catch {
            showToast('ไม่สามารถเพิ่มลูกค้าใหม่ได้', 'error')
        }
    }

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/product-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newItemData,
                    item_status: 'Available',
                }),
            })
            if (!response.ok) throw new Error('Failed to create item')
            const result = await response.json()

            setItems([...items, result.data])
            setFormData({ ...formData, item_id: result.data.item_id })
            setIsCreatingItem(false)
            setNewItemData({
                item_serial_number: '',
                item_imei: '',
                model_id: 0,
            })
            showToast('เพิ่มสินค้าใหม่สำเร็จ', 'success')
        } catch {
            showToast('ไม่สามารถเพิ่มสินค้าใหม่ได้', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedRepair
                ? `/api/repair-orders/${selectedRepair.repair_id}`
                : '/api/repair-orders'
            const method = selectedRepair ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save repair')
            showToast(
                `คำขอซ่อม${selectedRepair ? 'อัปเดต' : 'สร้าง'}สำเร็จ`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedRepair(null)
            fetchData()
        } catch {
            showToast('ไม่สามารถบันทึกคำขอซ่อมได้', 'error')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600'
            case 'cancelled':
                return 'text-red-600'
            case 'in_progress':
                return 'text-blue-600'
            case 'received':
            default:
                return 'text-orange-500'
        }
    }

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            received: 'รับแล้ว',
            in_progress: 'กำลังซ่อม',
            completed: 'เสร็จสิ้น',
            cancelled: 'ยกเลิก',
        }
        return statusMap[status] || status
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        คำขอซ่อม
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        จัดการคำขอซ่อมสินค้า และเพิ่มอะไหล่
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedRepair(null)
                        setFormData({
                            repair_problem_desc: '',
                            repair_technician_note: '',
                            repair_date_received: new Date()
                                .toISOString()
                                .split('T')[0],
                            repair_date_completed: '',
                            repair_labor_cost: 0,
                            repair_status: 'received',
                            customer_id: customers[0]?.customer_id || 0,
                            item_id: items[0]?.item_id || 0,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    + สร้างคำขอซ่อม
                </button>
            </div>

            <div className="bg-bg rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                            ค้นหา
                        </label>
                        <input
                            type="text"
                            placeholder="ค้นหารหัส, ชื่อลูกค้า, เบอร์โทร, S/N..."
                            value={filterQuery}
                            onChange={(e) => {
                                setFilterQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-0"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                            สถานะ
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-0"
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="received">รับแล้ว</option>
                            <option value="in_progress">กำลังซ่อม</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="cancelled">ยกเลิก</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                            ตั้งแต่วันที่
                        </label>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => {
                                setFilterStartDate(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-0"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                            ถึงวันที่
                        </label>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => {
                                setFilterEndDate(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-0"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => {
                            setFilterQuery('')
                            setFilterStatus('')
                            setFilterStartDate('')
                            setFilterEndDate('')
                            setCurrentPage(1)
                        }}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                        ล้างตัวกรอง
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-bg flex items-center justify-center rounded-lg border border-slate-200 p-24">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                </div>
            ) : repairs.length === 0 ? (
                <div className="bg-bg flex flex-col items-center justify-center rounded-lg border border-slate-200 p-24 text-slate-500">
                    <svg
                        className="mb-4 h-12 w-12 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <p className="text-lg font-medium text-slate-900">
                        ไม่พบข้อมูลซ่อม
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มข้อมูลซ่อมใหม่
                    </p>
                </div>
            ) : (
                <div className="bg-bg overflow-hidden rounded-lg border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        รหัสซ่อม / วันที่รับ
                                    </th>
                                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        ลูกค้า
                                    </th>
                                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        สินค้า (S/N)
                                    </th>
                                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        ปัญหา
                                    </th>
                                    <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        สถานะ
                                    </th>
                                    <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {repairs.map((repair: RepairOrder) => (
                                    <tr
                                        key={repair.repair_id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-slate-900">
                                                #{repair.repair_id}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(
                                                    repair.repair_date_received
                                                ).toLocaleDateString('th-TH')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-900">
                                                {repair.customer_fname || ''}{' '}
                                                {repair.customer_lname || ''}
                                            </div>
                                            {repair.customer_phone && (
                                                <div className="text-xs text-slate-500">
                                                    {repair.customer_phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-900">
                                                {repair.model_name ||
                                                    'ไม่ระบุรุ่น'}
                                            </div>
                                            <div className="font-mono text-xs text-slate-500">
                                                {repair.item_serial_number ||
                                                    repair.item_imei ||
                                                    'ไม่ระบุ S/N'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {repair.repair_problem_desc.length >
                                            30
                                                ? `${repair.repair_problem_desc.substring(0, 30)}...`
                                                : repair.repair_problem_desc}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                                                    repair.repair_status ===
                                                    'completed'
                                                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                                                        : repair.repair_status ===
                                                            'cancelled'
                                                          ? 'bg-red-50 text-red-700 ring-1 ring-red-600/10 ring-inset'
                                                          : repair.repair_status ===
                                                              'in_progress'
                                                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10 ring-inset'
                                                            : 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 ring-inset'
                                                }`}
                                            >
                                                {getStatusLabel(
                                                    repair.repair_status
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleOpenParts(repair)
                                                    }
                                                    className="rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 hover:text-purple-800"
                                                    title="จัดการอะไหล่"
                                                >
                                                    จัดการอะไหล่
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handlePrint(repair)
                                                    }
                                                    className="rounded p-1 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
                                                    title="พิมพ์ใบรับซ่อม"
                                                >
                                                    <PrintIcon />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleEdit(repair)
                                                    }
                                                    className="rounded p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                    title="แก้ไข"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        repair.repair_id &&
                                                        handleDelete(
                                                            repair.repair_id
                                                        )
                                                    }
                                                    className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                                    title="ลบ"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    แสดง{' '}
                                    <span className="font-semibold">
                                        {(currentPage - 1) * itemsPerPage + 1}
                                    </span>{' '}
                                    ถึง{' '}
                                    <span className="font-semibold">
                                        {Math.min(
                                            currentPage * itemsPerPage,
                                            totalItems
                                        )}
                                    </span>{' '}
                                    จาก{' '}
                                    <span className="font-semibold">
                                        {totalItems}
                                    </span>{' '}
                                    รายการ
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus:z-20 focus:outline-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">
                                            Previous
                                        </span>
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 ring-inset focus:z-20 focus:outline-0">
                                        หน้า {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus:z-20 focus:outline-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Repair Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {selectedRepair
                                    ? 'แก้ไขคำขอซ่อม'
                                    : 'สร้างคำขอซ่อมใหม่'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <form
                            onSubmit={handleSubmit}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto p-8 pt-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                                ลูกค้า *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsCreatingCustomer(
                                                        !isCreatingCustomer
                                                    )
                                                }
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                                {isCreatingCustomer
                                                    ? 'เลือกจากรายชื่อ'
                                                    : '+ เพิ่มลูกค้าใหม่'}
                                            </button>
                                        </div>
                                        {isCreatingCustomer ? (
                                            <div className="space-y-2 rounded-md border border-blue-100 bg-blue-50/50 p-3">
                                                <input
                                                    type="text"
                                                    placeholder="ชื่อ"
                                                    value={
                                                        newCustomerData.customer_fname
                                                    }
                                                    onChange={(e) =>
                                                        setNewCustomerData({
                                                            ...newCustomerData,
                                                            customer_fname:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="นามสกุล"
                                                    value={
                                                        newCustomerData.customer_lname
                                                    }
                                                    onChange={(e) =>
                                                        setNewCustomerData({
                                                            ...newCustomerData,
                                                            customer_lname:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="เบอร์โทร"
                                                    value={
                                                        newCustomerData.customer_phone
                                                    }
                                                    onChange={(e) =>
                                                        setNewCustomerData({
                                                            ...newCustomerData,
                                                            customer_phone:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleCreateCustomer
                                                    }
                                                    disabled={
                                                        !newCustomerData.customer_fname ||
                                                        !newCustomerData.customer_phone
                                                    }
                                                    className="w-full rounded bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    บันทึกลูกค้า
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                required
                                                value={formData.customer_id}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer_id: parseInt(
                                                            e.target.value
                                                        ),
                                                    })
                                                }
                                                className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                            >
                                                <option value={0}>
                                                    เลือกลูกค้า
                                                </option>
                                                {customers.map((c) => (
                                                    <option
                                                        key={c.customer_id}
                                                        value={c.customer_id}
                                                    >
                                                        {c.customer_fname}{' '}
                                                        {c.customer_lname}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
                                        <div className="mb-1 flex items-center justify-between">
                                            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                                สินค้า *
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsCreatingItem(
                                                        !isCreatingItem
                                                    )
                                                }
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                                {isCreatingItem
                                                    ? 'เลือกจากรายการ'
                                                    : '+ เพิ่มสินค้าใหม่'}
                                            </button>
                                        </div>
                                        {isCreatingItem ? (
                                            <div className="space-y-2 rounded-md border border-blue-100 bg-blue-50/50 p-3">
                                                <input
                                                    type="text"
                                                    placeholder="Serial Number"
                                                    value={
                                                        newItemData.item_serial_number
                                                    }
                                                    onChange={(e) =>
                                                        setNewItemData({
                                                            ...newItemData,
                                                            item_serial_number:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="IMEI (ถ้ามี)"
                                                    value={
                                                        newItemData.item_imei
                                                    }
                                                    onChange={(e) =>
                                                        setNewItemData({
                                                            ...newItemData,
                                                            item_imei:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                                                />
                                                <select
                                                    value={newItemData.model_id}
                                                    onChange={(e) =>
                                                        setNewItemData({
                                                            ...newItemData,
                                                            model_id: parseInt(
                                                                e.target.value
                                                            ),
                                                        })
                                                    }
                                                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-600 focus:outline-none"
                                                >
                                                    <option value={0}>
                                                        เลือกรุ่นสินค้า
                                                    </option>
                                                    {models?.map((m) => (
                                                        <option
                                                            key={m.model_id}
                                                            value={m.model_id}
                                                        >
                                                            {m.model_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={handleCreateItem}
                                                    disabled={
                                                        !newItemData.item_serial_number ||
                                                        !newItemData.model_id
                                                    }
                                                    className="w-full rounded bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    บันทึกสินค้า
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                required
                                                value={formData.item_id}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        item_id: parseInt(
                                                            e.target.value
                                                        ),
                                                    })
                                                }
                                                className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                            >
                                                <option value={0}>
                                                    เลือกสินค้า
                                                </option>
                                                {items.map((item) => (
                                                    <option
                                                        key={item.item_id}
                                                        value={item.item_id}
                                                    >
                                                        {item.item_serial_number ||
                                                            item.item_imei}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            วันที่รับ *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={
                                                formData.repair_date_received
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    repair_date_received:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        />
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            วันที่เสร็จ
                                        </label>
                                        <input
                                            type="date"
                                            value={
                                                formData.repair_date_completed
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    repair_date_completed:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            ปัญหา *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.repair_problem_desc}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    repair_problem_desc:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                            rows={3}
                                            placeholder="อธิบายปัญหาของสินค้า"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            หมายเหตุช่างซ่อม
                                        </label>
                                        <textarea
                                            value={
                                                formData.repair_technician_note
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    repair_technician_note:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                            rows={2}
                                            placeholder="หมายเหตุจากช่างซ่อม"
                                        />
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            ค่าแรง (฿)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.repair_labor_cost}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    repair_labor_cost:
                                                        parseFloat(
                                                            e.target.value
                                                        ),
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            สถานะ
                                        </label>
                                        <select
                                            value={formData.repair_status}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    repair_status:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        >
                                            <option value="received">
                                                รับแล้ว
                                            </option>
                                            <option value="in_progress">
                                                กำลังซ่อม
                                            </option>
                                            <option value="completed">
                                                เสร็จสิ้น
                                            </option>
                                            <option value="cancelled">
                                                ยกเลิก
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-8 py-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                                >
                                    {selectedRepair
                                        ? 'อัปเดตคำขอซ่อม'
                                        : 'สร้างคำขอซ่อม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Spare Parts Management Modal */}
            {isPartsModalOpen && selectedPartsRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-bg max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                จัดการอะไหล่ -{' '}
                                {
                                    customers.find(
                                        (c) =>
                                            c.customer_id ===
                                            selectedPartsRepair.customer_id
                                    )?.customer_fname
                                }
                            </h2>
                            <button
                                onClick={() => setIsPartsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Add Part Form */}
                        <form
                            onSubmit={handleAddPart}
                            className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4"
                        >
                            <h3 className="mb-4 text-sm font-bold text-slate-900">
                                เพิ่มอะไหล่
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        เลือกอะไหล่ *
                                    </label>
                                    <select
                                        required
                                        value={partFormData.part_id}
                                        onChange={(e) =>
                                            setPartFormData({
                                                ...partFormData,
                                                part_id: parseInt(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    >
                                        <option value={0}>เลือกอะไหล่</option>
                                        {spareParts.map((part) => (
                                            <option
                                                key={part.part_id}
                                                value={part.part_id}
                                            >
                                                {part.part_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        จำนวน
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={
                                            partFormData.repair_part_quantity
                                        }
                                        onChange={(e) =>
                                            setPartFormData({
                                                ...partFormData,
                                                repair_part_quantity: parseInt(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        ราคาต่อหน่วย (฿)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={
                                            partFormData.repair_part_unit_price
                                        }
                                        onChange={(e) =>
                                            setPartFormData({
                                                ...partFormData,
                                                repair_part_unit_price:
                                                    parseFloat(e.target.value),
                                            })
                                        }
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                + เพิ่มอะไหล่
                            </button>
                        </form>

                        {/* Parts List */}
                        <div>
                            <h3 className="mb-4 text-sm font-bold text-slate-900">
                                อะไหล่ที่ใช้
                            </h3>
                            {repairParts.length > 0 ? (
                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                    อะไหล่
                                                </th>
                                                <th className="px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                    จำนวน
                                                </th>
                                                <th className="px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                    ราคาต่อหน่วย
                                                </th>
                                                <th className="px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                    รวม
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                    ลบ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {repairParts.map((part) => (
                                                <tr
                                                    key={`${part.repair_id}-${part.part_id}`}
                                                    className="hover:bg-slate-50/50"
                                                >
                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        {spareParts.find(
                                                            (p) =>
                                                                p.part_id ===
                                                                part.part_id
                                                        )?.part_name ||
                                                            'ไม่ระบุ'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        {
                                                            part.repair_part_quantity
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        ฿
                                                        {part.repair_part_unit_price.toLocaleString(
                                                            'th-TH'
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                                                        ฿
                                                        {(
                                                            part.repair_part_quantity *
                                                            part.repair_part_unit_price
                                                        ).toLocaleString(
                                                            'th-TH'
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() =>
                                                                handleDeletePart(
                                                                    part.part_id
                                                                )
                                                            }
                                                            className="text-slate-400 transition-colors hover:text-red-500"
                                                        >
                                                            <DeleteIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-slate-200 bg-slate-50/50 font-bold">
                                                <td
                                                    colSpan={3}
                                                    className="px-4 py-3 text-right"
                                                >
                                                    รวมอะไหล่:
                                                </td>
                                                <td
                                                    colSpan={2}
                                                    className="px-4 py-3 text-slate-900"
                                                >
                                                    ฿
                                                    {repairParts
                                                        .reduce(
                                                            (sum, p) =>
                                                                sum +
                                                                p.repair_part_quantity *
                                                                    p.repair_part_unit_price,
                                                            0
                                                        )
                                                        .toLocaleString(
                                                            'th-TH'
                                                        )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
                                    <p className="text-sm text-slate-500">
                                        ยังไม่มีอะไหล่ที่เพิ่ม
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-6">
                            <button
                                type="button"
                                onClick={() => setIsPartsModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            {isPrintOpen && selectedRepair && (
                <>
                    <style>{`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #printArea, #printArea * {
                                visibility: visible;
                            }
                            #printArea {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                        }
                    `}</style>
                    <div
                        id="printArea"
                        ref={printRef}
                        className="bg-bg fixed inset-0 z-50 overflow-auto p-8 print:p-0"
                    >
                        <div className="mx-auto max-w-4xl print:max-w-none">
                            <div className="mb-8 flex items-center justify-between print:hidden">
                                <h1 className="text-3xl font-bold text-slate-900">
                                    ใบซ่อม
                                </h1>
                                <button
                                    onClick={() => setIsPrintOpen(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            {/* Invoice Header */}
                            <div className="mb-8 border-b-2 border-slate-200 pb-8">
                                <div className="mb-4 grid grid-cols-3 gap-4">
                                    <div className="flex items-start gap-3">
                                        {storeLogo && (
                                            <Image
                                                src={storeLogo}
                                                alt="Store logo"
                                                width={56}
                                                height={56}
                                                unoptimized
                                                className="h-14 w-14 rounded-md border border-slate-200 object-cover"
                                            />
                                        )}
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">
                                                {storeName}
                                            </h2>
                                            <p className="text-sm text-slate-600">
                                                ระบบจัดเก็บสินค้า
                                            </p>
                                        </div>
                                    </div>
                                    <div></div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-600">
                                            ใบรับซ่อม
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            NO.{' '}
                                            {selectedRepair.repair_id
                                                ?.toString()
                                                .padStart(5, '0')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="mb-8 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        ลูกค้า
                                    </p>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900">
                                            {(() => {
                                                const c = customers.find(
                                                    (cust) =>
                                                        cust.customer_id ===
                                                        selectedRepair.customer_id
                                                )
                                                return c
                                                    ? `${c.customer_fname} ${c.customer_lname}`
                                                    : 'ไม่ระบุ'
                                            })()}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {(() => {
                                                const c = customers.find(
                                                    (cust) =>
                                                        cust.customer_id ===
                                                        selectedRepair.customer_id
                                                )
                                                return c?.customer_phone || '-'
                                            })()}
                                        </p>
                                    </div>

                                    <p className="mt-4 mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        ข้อมูลอุปกรณ์
                                    </p>
                                    <div className="space-y-1">
                                        {(() => {
                                            const item = items.find(
                                                (i) =>
                                                    i.item_id ===
                                                    selectedRepair.item_id
                                            )
                                            const model = models.find(
                                                (m) =>
                                                    m.model_id ===
                                                    item?.model_id
                                            )
                                            return item ? (
                                                <>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {model?.model_name ||
                                                            'ไม่ระบุ'}
                                                    </p>
                                                    <p className="font-mono text-sm text-slate-600">
                                                        S/N:{' '}
                                                        {item.item_serial_number ||
                                                            item.item_imei ||
                                                            '-'}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-slate-500">
                                                    ไม่ระบุ
                                                </p>
                                            )
                                        })()}
                                    </div>
                                </div>
                                <div className="space-y-2 text-right">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            วันที่รับ
                                        </p>
                                        <p className="text-sm text-slate-900">
                                            {new Date(
                                                selectedRepair.repair_date_received
                                            ).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            สถานะ
                                        </p>
                                        <p
                                            className={`text-sm font-bold ${getStatusColor(
                                                selectedRepair.repair_status
                                            )}`}
                                        >
                                            {getStatusLabel(
                                                selectedRepair.repair_status
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Problem Describe */}
                            <div className="mb-4 rounded-lg bg-slate-50 p-4">
                                <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    อาการเสีย / งานซ่อม
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-slate-900">
                                    {selectedRepair.repair_problem_desc}
                                </p>
                            </div>

                            {selectedRepair.repair_technician_note && (
                                <div className="mb-8 rounded-lg bg-slate-50 p-4">
                                    <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        หมายเหตุช่างซ่อม
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap text-slate-900">
                                        {selectedRepair.repair_technician_note}
                                    </p>
                                </div>
                            )}

                            {/* Cost Breakdown */}
                            <div className="mb-8 border-b-2 border-slate-200 pb-4">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200">
                                        <tr>
                                            <th className="py-2 font-bold text-slate-600 uppercase">
                                                รายการอะไหล่และค่าบริการ
                                            </th>
                                            <th className="py-2 text-right font-bold text-slate-600 uppercase">
                                                ราคา
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {repairParts.map((part, index) => {
                                            const p = spareParts.find(
                                                (sp) =>
                                                    sp.part_id === part.part_id
                                            )
                                            return (
                                                <tr key={index}>
                                                    <td className="py-3">
                                                        <div className="font-bold text-slate-900">
                                                            {p?.part_name ||
                                                                'อะไหล่ไม่ทราบชื่อ'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            จำนวน:{' '}
                                                            {
                                                                part.repair_part_quantity
                                                            }{' '}
                                                            x ฿
                                                            {part.repair_part_unit_price.toLocaleString(
                                                                'th-TH',
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                }
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right font-bold text-slate-900">
                                                        ฿
                                                        {(
                                                            part.repair_part_quantity *
                                                            part.repair_part_unit_price
                                                        ).toLocaleString(
                                                            'th-TH',
                                                            {
                                                                minimumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}

                                        {repairParts.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    className="py-4 text-center text-slate-400 italic"
                                                >
                                                    ไม่มีรายการอะไหล่
                                                </td>
                                            </tr>
                                        )}

                                        {/* Labor Cost Row */}
                                        <tr className="bg-slate-50/50">
                                            <td className="py-3 font-bold text-slate-900">
                                                ค่าแรงการซ่อมแซม
                                            </td>
                                            <td className="py-3 text-right font-bold text-slate-900">
                                                ฿
                                                {(
                                                    selectedRepair.repair_labor_cost ||
                                                    0
                                                ).toLocaleString('th-TH', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Table */}
                            <div className="mb-8">
                                <div className="grid grid-cols-3 gap-4 text-right">
                                    <div></div>
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            รวมทั้งสิ้น
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            ฿
                                            {(
                                                repairParts.reduce(
                                                    (sum, p) =>
                                                        sum +
                                                        p.repair_part_quantity *
                                                            p.repair_part_unit_price,
                                                    0
                                                ) +
                                                (selectedRepair.repair_labor_cost ||
                                                    0)
                                            ).toLocaleString('th-TH', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-16 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
                                <p>
                                    เอกสารนี้สร้างขึ้นอย่างเป็นอิเล็กทรอนิกส์จากระบบจัดเก็บสินค้า{' '}
                                    {storeName}
                                </p>
                                <p>{new Date().toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
