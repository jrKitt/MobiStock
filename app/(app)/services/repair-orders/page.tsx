'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import {
    RepairOrder,
    Customer,
    ProductItem,
    SparePart,
    RepairOrderPart,
    RepairOrderImage,
    ProductModel,
} from '@/types/api'
import { CloseIcon, DeleteIcon } from '@/lib/icons'
export default function RepairOrdersPage() {
    const { showToast } = useToast()
    const [repairs, setRepairs] = useState<
        (RepairOrder & { parts?: RepairOrderPart[] })[]
    >([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [items, setItems] = useState<ProductItem[]>([])
    const [spareParts, setSpareParts] = useState<SparePart[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [selectedRepair, setSelectedRepair] = useState<RepairOrder | null>(
        null
    )
    const [isPartsModalOpen, setIsPartsModalOpen] = useState(false)
    const [selectedPartsRepair, setSelectedPartsRepair] =
        useState<RepairOrder | null>(null)
    const [repairParts, setRepairParts] = useState<RepairOrderPart[]>([])

    // Work modal (received → in_progress): technician note + labor cost + parts
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false)
    const [workRepair, setWorkRepair] = useState<RepairOrder | null>(null)
    const [workFormData, setWorkFormData] = useState({
        repair_technician_note: '',
        repair_labor_cost: 0,
    })

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

    // Repair images state
    const [pendingImages, setPendingImages] = useState<
        { url: string; caption: string; uploading: boolean }[]
    >([])
    const [repairImages, setRepairImages] = useState<RepairOrderImage[]>([])

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
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [newCustomerData, setNewCustomerData] = useState({
        customer_fname: '',
        customer_lname: '',
        customer_phone: '',
        customer_tax_number: '',
        customer_address: '',
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
            setIsCustomerModalOpen(false)
            setNewCustomerData({
                customer_fname: '',
                customer_lname: '',
                customer_phone: '',
                customer_tax_number: '',
                customer_address: '',
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
            setIsItemModalOpen(false)
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
            const result = await response.json()

            // Save pending images when creating a new repair order
            if (!selectedRepair && pendingImages.length > 0) {
                const newRepairId = result.data?.id
                if (newRepairId) {
                    await Promise.all(
                        pendingImages
                            .filter((img) => !img.uploading)
                            .map((img) =>
                                fetch('/api/repair-order-images', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        repair_id: newRepairId,
                                        image_url: img.url,
                                        image_caption: img.caption || null,
                                        image_type: 'received',
                                    }),
                                })
                            )
                    )
                }
                setPendingImages([])
            }

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

    const fetchRepairImages = async (repairId: number) => {
        try {
            const res = await fetch(
                `/api/repair-order-images?repair_id=${repairId}`
            )
            if (res.ok) {
                const data = await res.json()
                setRepairImages(Array.isArray(data.data) ? data.data : [])
            }
        } catch (err) {
            console.error('Failed to fetch repair images:', err)
        }
    }

    const handlePendingImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        // Add placeholder entries while uploading
        const placeholders = files.map(() => ({
            url: '',
            caption: '',
            uploading: true,
        }))
        setPendingImages((prev) => [...prev, ...placeholders])
        const startIndex = pendingImages.length
        await Promise.all(
            files.map(async (file, i) => {
                const fd = new FormData()
                fd.append('file', file)
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: fd,
                })
                if (res.ok) {
                    const data = await res.json()
                    setPendingImages((prev) => {
                        const updated = [...prev]
                        updated[startIndex + i] = {
                            url: data.url,
                            caption: '',
                            uploading: false,
                        }
                        return updated
                    })
                } else {
                    setPendingImages((prev) =>
                        prev.filter((_, idx) => idx !== startIndex + i)
                    )
                    showToast('อัปโหลดรูปภาพไม่สำเร็จ', 'error')
                }
            })
        )
        // reset file input
        e.target.value = ''
    }

    const handleOpenWorkModal = async (repair: RepairOrder) => {
        setWorkRepair(repair)
        setWorkFormData({
            repair_technician_note: repair.repair_technician_note || '',
            repair_labor_cost: repair.repair_labor_cost || 0,
        })
        // reuse selectedPartsRepair so handleAddPart / handleDeletePart work unchanged
        setSelectedPartsRepair(repair)
        setPartFormData({
            part_id: 0,
            repair_part_quantity: 1,
            repair_part_unit_price: 0,
        })
        if (repair.repair_id) await fetchRepairParts(repair.repair_id)
        setIsWorkModalOpen(true)
    }

    const handleSaveWork = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!workRepair?.repair_id) return
        try {
            const response = await fetch(
                `/api/repair-orders/${workRepair.repair_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...workRepair,
                        repair_technician_note:
                            workFormData.repair_technician_note,
                        repair_labor_cost: workFormData.repair_labor_cost,
                        repair_status: 'in_progress',
                    }),
                }
            )
            if (!response.ok) throw new Error('Failed to update')
            showToast('บันทึกข้อมูลการซ่อมสำเร็จ', 'success')
            setIsWorkModalOpen(false)
            setWorkRepair(null)
            fetchData()
        } catch {
            showToast('ไม่สามารถบันทึกข้อมูลได้', 'error')
        }
    }

    const handleMarkCompleted = async (repair: RepairOrder) => {
        if (!confirm('ยืนยันซ่อมเสร็จสิ้น?')) return
        try {
            const response = await fetch(
                `/api/repair-orders/${repair.repair_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...repair,
                        repair_status: 'completed',
                        repair_date_completed: new Date()
                            .toISOString()
                            .split('T')[0],
                    }),
                }
            )
            if (!response.ok) throw new Error('Failed to update')
            showToast('อัปเดตสถานะซ่อมเสร็จสำเร็จ', 'success')
            fetchData()
        } catch {
            showToast('ไม่สามารถอัปเดตสถานะได้', 'error')
        }
    }

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            received: 'รับเรื่อง / รอซ่อม',
            in_progress: 'กำลังซ่อม',
            completed: 'ซ่อมเสร็จ / รอรับเครื่อง',
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
                        setPendingImages([])
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

            {/* Status Tabs */}
            <div className="flex space-x-1 rounded-lg bg-slate-100/50 p-1">
                {[
                    { id: '', label: 'ทั้งหมด' },
                    { id: 'received', label: 'รับเรื่อง / รอซ่อม' },
                    { id: 'in_progress', label: 'กำลังซ่อม' },
                    { id: 'completed', label: 'ซ่อมเสร็จ / รอรับเครื่อง' },
                    { id: 'cancelled', label: 'ยกเลิก' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setFilterStatus(tab.id)
                            setCurrentPage(1)
                        }}
                        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                            filterStatus === tab.id
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-bg rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                                                {repair.repair_status ===
                                                    'received' && (
                                                    <button
                                                        onClick={() =>
                                                            handleOpenWorkModal(
                                                                repair
                                                            )
                                                        }
                                                        className="rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 hover:text-orange-800"
                                                    >
                                                        เริ่มซ่อม
                                                    </button>
                                                )}
                                                {repair.repair_status ===
                                                    'in_progress' && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleMarkCompleted(
                                                                    repair
                                                                )
                                                            }
                                                            className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 hover:text-green-800"
                                                        >
                                                            ซ่อมเสร็จ
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleOpenParts(
                                                                    repair
                                                                )
                                                            }
                                                            className="rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 hover:text-purple-800"
                                                        >
                                                            อะไหล่
                                                        </button>
                                                    </>
                                                )}
                                                {repair.repair_status ===
                                                    'completed' && (
                                                    <button
                                                        onClick={() =>
                                                            handleOpenParts(
                                                                repair
                                                            )
                                                        }
                                                        className="rounded bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                                                    >
                                                        ดูรายละเอียด
                                                    </button>
                                                )}
                                                {repair.repair_status !==
                                                    'completed' &&
                                                    repair.repair_status !==
                                                        'cancelled' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRepair(
                                                                    repair
                                                                )
                                                                setFormData({
                                                                    repair_problem_desc:
                                                                        repair.repair_problem_desc ||
                                                                        '',
                                                                    repair_technician_note:
                                                                        repair.repair_technician_note ||
                                                                        '',
                                                                    repair_date_received:
                                                                        repair.repair_date_received
                                                                            ?.toString()
                                                                            .split(
                                                                                'T'
                                                                            )[0] ||
                                                                        '',
                                                                    repair_date_completed:
                                                                        repair.repair_date_completed
                                                                            ?.toString()
                                                                            .split(
                                                                                'T'
                                                                            )[0] ||
                                                                        '',
                                                                    repair_labor_cost:
                                                                        repair.repair_labor_cost ||
                                                                        0,
                                                                    repair_status:
                                                                        repair.repair_status,
                                                                    customer_id:
                                                                        repair.customer_id,
                                                                    item_id:
                                                                        repair.item_id,
                                                                })
                                                                setIsModalOpen(
                                                                    true
                                                                )
                                                            }}
                                                            className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                                                        >
                                                            แก้ไข
                                                        </button>
                                                    )}
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
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            ลูกค้า *
                                        </label>
                                        <div className="flex gap-2">
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
                                                className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
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
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsCustomerModalOpen(true)
                                                }
                                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-green-700"
                                                title="เพิ่มลูกค้าใหม่"
                                            >
                                                + ลูกค้า
                                            </button>
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            สินค้า *
                                        </label>
                                        <div className="flex gap-2">
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
                                                className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
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
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsItemModalOpen(true)
                                                }
                                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-green-700"
                                                title="เพิ่มสินค้าใหม่"
                                            >
                                                + สินค้า
                                            </button>
                                        </div>
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

                                    {selectedRepair && (
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
                                    )}

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

                                    {/* Image upload — only on create (no selectedRepair) */}
                                    {!selectedRepair && (
                                        <div className="col-span-2">
                                            <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                                รูปภาพความเสียหาย (ไม่บังคับ)
                                            </label>
                                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
                                                <svg
                                                    className="h-4 w-4 shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <span>
                                                    เลือกรูปภาพ
                                                    (เลือกได้หลายรูป)
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={
                                                        handlePendingImageUpload
                                                    }
                                                />
                                            </label>
                                            {pendingImages.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {pendingImages.map(
                                                        (img, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50"
                                                            >
                                                                {img.uploading ? (
                                                                    <div className="flex h-full items-center justify-center">
                                                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                                                                    </div>
                                                                ) : (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={
                                                                            img.url
                                                                        }
                                                                        alt={`damage-${idx}`}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                )}
                                                                {!img.uploading && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPendingImages(
                                                                                (
                                                                                    prev
                                                                                ) =>
                                                                                    prev.filter(
                                                                                        (
                                                                                            _,
                                                                                            i
                                                                                        ) =>
                                                                                            i !==
                                                                                            idx
                                                                                    )
                                                                            )
                                                                        }
                                                                        className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                                                                    >
                                                                        <svg
                                                                            className="h-3 w-3"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            stroke="currentColor"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    3
                                                                                }
                                                                                d="M6 18L18 6M6 6l12 12"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedRepair && (
                                        <>
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
                                                    value={
                                                        formData.repair_labor_cost
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            repair_labor_cost:
                                                                parseFloat(
                                                                    e.target
                                                                        .value
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
                                                    value={
                                                        formData.repair_status
                                                    }
                                                    onChange={(e) => {
                                                        const newStatus =
                                                            e.target.value
                                                        setFormData({
                                                            ...formData,
                                                            repair_status:
                                                                newStatus,
                                                            ...(newStatus ===
                                                                'completed' &&
                                                            !formData.repair_date_completed
                                                                ? {
                                                                      repair_date_completed:
                                                                          new Date()
                                                                              .toISOString()
                                                                              .split(
                                                                                  'T'
                                                                              )[0],
                                                                  }
                                                                : {}),
                                                        })
                                                    }}
                                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                                >
                                                    <option value="received">
                                                        รับเรื่อง / รอซ่อม
                                                    </option>
                                                    <option value="in_progress">
                                                        กำลังซ่อม
                                                    </option>
                                                    <option value="completed">
                                                        ซ่อมเสร็จ / รอรับเครื่อง
                                                    </option>
                                                    <option value="cancelled">
                                                        ยกเลิก
                                                    </option>
                                                </select>
                                                <div className="mt-2 rounded border border-slate-100 bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-500">
                                                    {formData.repair_status ===
                                                        'received' &&
                                                        '📍 รับเรื่อง, ตรวจเช็คอาการ, เสนอราคา, หรือรออะไหล่'}
                                                    {formData.repair_status ===
                                                        'in_progress' &&
                                                        '🔧 ลูกค้าอนุมัติแล้ว อะไหล่พร้อม ช่างกำลังลงมือซ่อมแซม'}
                                                    {formData.repair_status ===
                                                        'completed' &&
                                                        '✅ ซ่อมเสร็จ ทดสอบผ่าน และรอให้ลูกค้ารับเครื่องคืน'}
                                                    {formData.repair_status ===
                                                        'cancelled' &&
                                                        '❌ ยกเลิกการซ่อม, ซ่อมไม่ได้ หรือลูกค้าปฏิเสธราคา'}
                                                </div>
                                            </div>
                                        </>
                                    )}
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

            {/* Work Modal: received → in_progress (tech note + labor cost + parts) */}
            {isWorkModalOpen && workRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    บันทึกการซ่อม #{workRepair.repair_id}
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {workRepair.customer_fname}{' '}
                                    {workRepair.customer_lname}
                                    {workRepair.customer_phone &&
                                        ` · ${workRepair.customer_phone}`}
                                    {' · '}
                                    {workRepair.model_name ||
                                        'ไม่ระบุรุ่น'}{' '}
                                    <span className="font-mono">
                                        {workRepair.item_serial_number ||
                                            workRepair.item_imei ||
                                            ''}
                                    </span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsWorkModalOpen(false)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Problem (read-only context) */}
                            <div className="border-b border-slate-100 bg-orange-50/60 px-6 py-3">
                                <p className="text-xs font-bold tracking-wider text-orange-600 uppercase">
                                    ปัญหาที่แจ้ง
                                </p>
                                <p className="mt-1 text-sm text-slate-700">
                                    {workRepair.repair_problem_desc}
                                </p>
                            </div>

                            <form
                                id="work-form"
                                onSubmit={handleSaveWork}
                                className="space-y-5 px-6 py-5"
                            >
                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        หมายเหตุช่างซ่อม
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={
                                            workFormData.repair_technician_note
                                        }
                                        onChange={(e) =>
                                            setWorkFormData({
                                                ...workFormData,
                                                repair_technician_note:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="ผลการตรวจสอบ, สิ่งที่ต้องซ่อม, หมายเหตุ..."
                                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        ค่าแรง (฿)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={workFormData.repair_labor_cost}
                                        onChange={(e) =>
                                            setWorkFormData({
                                                ...workFormData,
                                                repair_labor_cost:
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0,
                                            })
                                        }
                                        className="w-48 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>
                            </form>

                            {/* Spare parts section */}
                            <div className="border-t border-slate-100 px-6 pb-6">
                                <p className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    อะไหล่ที่ใช้
                                </p>

                                {/* Add part inline form */}
                                <form
                                    onSubmit={handleAddPart}
                                    className="mb-4 grid grid-cols-3 gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3"
                                >
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            อะไหล่ *
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
                                            className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                        >
                                            <option value={0}>เลือก</option>
                                            {spareParts.map((p) => (
                                                <option
                                                    key={p.part_id}
                                                    value={p.part_id}
                                                    disabled={
                                                        (p.part_quantity ??
                                                            1) === 0
                                                    }
                                                >
                                                    {p.part_name}
                                                    {p.part_quantity != null
                                                        ? p.part_quantity === 0
                                                            ? ' (หมด)'
                                                            : ` (${p.part_quantity})`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase">
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
                                                    repair_part_quantity:
                                                        parseInt(
                                                            e.target.value
                                                        ),
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            ราคา/หน่วย (฿)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={
                                                partFormData.repair_part_unit_price
                                            }
                                            onChange={(e) =>
                                                setPartFormData({
                                                    ...partFormData,
                                                    repair_part_unit_price:
                                                        parseFloat(
                                                            e.target.value
                                                        ),
                                                })
                                            }
                                            className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <button
                                            type="submit"
                                            className="w-full rounded-md bg-blue-600 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                                        >
                                            + เพิ่มอะไหล่
                                        </button>
                                    </div>
                                </form>

                                {/* Parts list */}
                                {repairParts.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50">
                                                    <th className="px-3 py-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                        อะไหล่
                                                    </th>
                                                    <th className="px-3 py-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                        จำนวน
                                                    </th>
                                                    <th className="px-3 py-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                        ราคา/หน่วย
                                                    </th>
                                                    <th className="px-3 py-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                        รวม
                                                    </th>
                                                    <th className="px-3 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {repairParts.map((part) => (
                                                    <tr
                                                        key={`${part.repair_id}-${part.part_id}`}
                                                        className="hover:bg-slate-50/50"
                                                    >
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {spareParts.find(
                                                                (p) =>
                                                                    p.part_id ===
                                                                    part.part_id
                                                            )?.part_name ||
                                                                'ไม่ระบุ'}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600">
                                                            {
                                                                part.repair_part_quantity
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600">
                                                            ฿
                                                            {part.repair_part_unit_price.toLocaleString(
                                                                'th-TH'
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 font-semibold text-slate-900">
                                                            ฿
                                                            {(
                                                                part.repair_part_quantity *
                                                                part.repair_part_unit_price
                                                            ).toLocaleString(
                                                                'th-TH'
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button
                                                                onClick={() =>
                                                                    handleDeletePart(
                                                                        part.part_id
                                                                    )
                                                                }
                                                                className="text-slate-300 hover:text-red-500"
                                                            >
                                                                <DeleteIcon />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                                                    <td
                                                        colSpan={3}
                                                        className="px-3 py-2 text-right text-slate-600"
                                                    >
                                                        รวมอะไหล่:
                                                    </td>
                                                    <td
                                                        colSpan={2}
                                                        className="px-3 py-2 text-slate-900"
                                                    >
                                                        ฿
                                                        {repairParts
                                                            .reduce(
                                                                (s, p) =>
                                                                    s +
                                                                    p.repair_part_quantity *
                                                                        p.repair_part_unit_price,
                                                                0
                                                            )
                                                            .toLocaleString(
                                                                'th-TH'
                                                            )}
                                                    </td>
                                                </tr>
                                                <tr className="bg-blue-50 font-bold text-blue-700">
                                                    <td
                                                        colSpan={3}
                                                        className="px-3 py-2 text-right"
                                                    >
                                                        ค่าใช้จ่ายรวม:
                                                    </td>
                                                    <td
                                                        colSpan={2}
                                                        className="px-3 py-2"
                                                    >
                                                        ฿
                                                        {(
                                                            repairParts.reduce(
                                                                (s, p) =>
                                                                    s +
                                                                    p.repair_part_quantity *
                                                                        p.repair_part_unit_price,
                                                                0
                                                            ) +
                                                            workFormData.repair_labor_cost
                                                        ).toLocaleString(
                                                            'th-TH'
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
                                        <p className="text-sm text-slate-400">
                                            ยังไม่มีอะไหล่
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setIsWorkModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                form="work-form"
                                className="rounded-md bg-orange-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                            >
                                บันทึก → เริ่มซ่อม
                            </button>
                        </div>
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

            {/* Customer Creation Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 text-black backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            เพิ่มลูกค้าใหม่
                        </h2>
                        <form
                            onSubmit={handleCreateCustomer}
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ชื่อ
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomerData.customer_fname}
                                    onChange={(e) =>
                                        setNewCustomerData({
                                            ...newCustomerData,
                                            customer_fname: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    นามสกุล
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomerData.customer_lname}
                                    onChange={(e) =>
                                        setNewCustomerData({
                                            ...newCustomerData,
                                            customer_lname: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    เบอร์โทรศัพท์
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomerData.customer_phone}
                                    onChange={(e) =>
                                        setNewCustomerData({
                                            ...newCustomerData,
                                            customer_phone: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    เลขประจำตัวผู้เสียภาษี
                                </label>
                                <input
                                    type="text"
                                    value={
                                        newCustomerData.customer_tax_number ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        setNewCustomerData({
                                            ...newCustomerData,
                                            customer_tax_number: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ที่อยู่
                                </label>
                                <textarea
                                    rows={3}
                                    value={
                                        newCustomerData.customer_address || ''
                                    }
                                    onChange={(e) =>
                                        setNewCustomerData({
                                            ...newCustomerData,
                                            customer_address: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomerModalOpen(false)
                                        setNewCustomerData({
                                            customer_fname: '',
                                            customer_lname: '',
                                            customer_phone: '',
                                            customer_tax_number: '',
                                            customer_address: '',
                                        })
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                                >
                                    เพิ่มลูกค้า
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Item Creation Modal */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 text-black backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            เพิ่มสินค้าใหม่
                        </h2>
                        <form onSubmit={handleCreateItem} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Serial Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newItemData.item_serial_number}
                                    onChange={(e) =>
                                        setNewItemData({
                                            ...newItemData,
                                            item_serial_number: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    IMEI (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    value={newItemData.item_imei}
                                    onChange={(e) =>
                                        setNewItemData({
                                            ...newItemData,
                                            item_imei: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    รุ่นสินค้า
                                </label>
                                <select
                                    required
                                    value={newItemData.model_id}
                                    onChange={(e) =>
                                        setNewItemData({
                                            ...newItemData,
                                            model_id: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                >
                                    <option value={0}>เลือกรุ่นสินค้า</option>
                                    {models?.map((m) => (
                                        <option
                                            key={m.model_id}
                                            value={m.model_id}
                                        >
                                            {m.model_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsItemModalOpen(false)
                                        setNewItemData({
                                            item_serial_number: '',
                                            item_imei: '',
                                            model_id: 0,
                                        })
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        !newItemData.item_serial_number ||
                                        !newItemData.model_id
                                    }
                                    className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                                >
                                    เพิ่มสินค้า
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
