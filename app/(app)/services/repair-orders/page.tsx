'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import {
    RepairOrder,
    Customer,
    ProductItem,
    SparePart,
    RepairOrderPart,
} from '@/types/api'
import { PrintIcon, EditIcon, DeleteIcon, CloseIcon } from '@/lib/icons'

export default function RepairOrdersPage() {
    const { showToast } = useToast()
    const [storeName, setStoreName] = useState('MobiStock')
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

    const fetchData = async () => {
        try {
            setLoading(true)
            const [repairsRes, customersRes, itemsRes, partsRes] =
                await Promise.all([
                    fetch('/api/repair-orders?page=1&limit=100'),
                    fetch('/api/customers?page=1&limit=100'),
                    fetch('/api/product-items?page=1&limit=100'),
                    fetch('/api/spare-parts?page=1&limit=100'),
                ])

            if (
                !repairsRes.ok ||
                !customersRes.ok ||
                !itemsRes.ok ||
                !partsRes.ok
            ) {
                throw new Error('ไม่สามารถดึงข้อมูลได้')
            }

            const [repairsData, customersData, itemsData, partsData] =
                await Promise.all([
                    repairsRes.json(),
                    customersRes.json(),
                    itemsRes.json(),
                    partsRes.json(),
                ])

            setRepairs(repairsData.data)
            setCustomers(customersData.data)
            setItems(itemsData.data)
            setSpareParts(partsData.data)
        } catch (err) {
            showToast('ไม่สามารถโหลดข้อมูลซ่อมได้', 'error')
        } finally {
            setLoading(false)
        }
    }

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
        fetchData()
    }, [])

    useEffect(() => {
        // โหลดชื่อร้านจาก localStorage
        try {
            const savedName = localStorage.getItem('mobistock_store_name')
            if (savedName && savedName.trim()) {
                setStoreName(savedName)
            }
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
        } catch (err) {
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
        } catch (err) {
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
        } catch (err) {
            showToast('ไม่สามารถลบคำขอซ่อมได้', 'error')
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
        } catch (err) {
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
                                    วันที่รับ
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    ลูกค้า
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    ปัญหา
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    สถานะ
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    จัดการ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {repairs.map((repair) => (
                                <tr
                                    key={repair.repair_id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                        {new Date(
                                            repair.repair_date_received
                                        ).toLocaleDateString('th-TH')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {(() => {
                                            const customer = customers.find(
                                                (c) =>
                                                    c.customer_id ===
                                                    repair.customer_id
                                            )
                                            return customer
                                                ? `${customer.customer_fname} ${customer.customer_lname}`
                                                : 'ไม่ระบุ'
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {repair.repair_problem_desc.substring(
                                            0,
                                            30
                                        )}
                                        ...
                                    </td>
                                    <td className="px-6 py-4">
                                        <div
                                            className={`text-xs font-bold uppercase ${getStatusColor(repair.repair_status)}`}
                                        >
                                            {getStatusLabel(
                                                repair.repair_status
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    handleOpenParts(repair)
                                                }
                                                className="rounded bg-purple-50 px-2 py-1 text-xs text-purple-600 transition-colors hover:bg-purple-100"
                                                title="จัดการอะไหล่"
                                            >
                                                อะไหล่
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handlePrint(repair)
                                                }
                                                className="p-1 text-slate-400 transition-colors hover:text-green-600"
                                                title="พิมพ์"
                                            >
                                                <PrintIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleEdit(repair)
                                                }
                                                className="p-1 text-slate-400 transition-colors hover:text-blue-600"
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
                                                className="p-1 text-slate-400 transition-colors hover:text-red-500"
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
            )}

            {/* Create/Edit Repair Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-bg max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            {selectedRepair
                                ? 'แก้ไขคำขอซ่อม'
                                : 'สร้างคำขอซ่อมใหม่'}
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ลูกค้า *
                                </label>
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
                                    <option value={0}>เลือกลูกค้า</option>
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
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    สินค้า *
                                </label>
                                <select
                                    required
                                    value={formData.item_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            item_id: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                >
                                    <option value={0}>เลือกสินค้า</option>
                                    {items.map((item) => (
                                        <option
                                            key={item.item_id}
                                            value={item.item_id}
                                        >
                                            {item.item_serial_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    วันที่รับ *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.repair_date_received}
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
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    วันที่เสร็จ
                                </label>
                                <input
                                    type="date"
                                    value={formData.repair_date_completed}
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
                                            repair_problem_desc: e.target.value,
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
                                    value={formData.repair_technician_note}
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
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ค่าแรง (฿)
                                </label>
                                <input
                                    type="number"
                                    value={formData.repair_labor_cost}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            repair_labor_cost: parseFloat(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    สถานะ
                                </label>
                                <select
                                    value={formData.repair_status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            repair_status: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                >
                                    <option value="received">รับแล้ว</option>
                                    <option value="in_progress">
                                        กำลังซ่อม
                                    </option>
                                    <option value="completed">เสร็จสิ้น</option>
                                    <option value="cancelled">ยกเลิก</option>
                                </select>
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    {selectedRepair ? 'อัปเดต' : 'สร้าง'}
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

                            <div className="mb-8 border-b-2 border-slate-200 pb-8">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {storeName}
                                </h2>
                                <p className="text-sm text-slate-600">
                                    ระบบจัดเก็บสินค้า - ใบซ่อม
                                </p>
                            </div>

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
                                            className={`text-sm font-bold ${getStatusColor(selectedRepair.repair_status)}`}
                                        >
                                            {getStatusLabel(
                                                selectedRepair.repair_status
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50mb-8 rounded-lg p-4">
                                <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ปัญหา
                                </p>
                                <p className="text-sm text-slate-900">
                                    {selectedRepair.repair_problem_desc}
                                </p>
                            </div>

                            <div className="bg-slate-50mb-8 rounded-lg p-4">
                                <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    หมายเหตุช่างซ่อม
                                </p>
                                <p className="text-sm text-slate-900">
                                    {selectedRepair.repair_technician_note ||
                                        '-'}
                                </p>
                            </div>

                            <div className="mb-8 grid grid-cols-3 gap-4 border-t-2 border-b-2 border-slate-200 py-4">
                                <div>
                                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        ค่าแรง
                                    </p>
                                    <p className="text-lg font-bold text-slate-900">
                                        ฿
                                        {selectedRepair.repair_labor_cost?.toLocaleString(
                                            'th-TH'
                                        ) || '0'}
                                    </p>
                                </div>
                                <div></div>
                                <div className="text-right">
                                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        รวมทั้งสิ้น
                                    </p>
                                    <p className="text-lg font-bold text-slate-900">
                                        ฿
                                        {(
                                            selectedRepair.repair_labor_cost ||
                                            0
                                        ).toLocaleString('th-TH')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-16 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
                                <p>
                                    เอกสารนี้สร้างขึ้นอย่างเป็นอิเล็กทรอนิกส์จากระบบจัดเก็บสินค้า
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
