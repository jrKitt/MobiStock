'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { SaleOrder, Customer, ProductItem } from '@/types/api'
import { PrintIcon, EditIcon, DeleteIcon, CloseIcon } from '@/lib/icons'

interface SaleOrderItemForm {
    item_id: number
    sale_price: number
    item_serial_number?: string
    item_imei?: string
    item_lot_number?: string
}

export default function SaleOrdersPage() {
    const { showToast } = useToast()
    const [storeName, setStoreName] = useState('MobiStock')
    const [orders, setOrders] = useState<SaleOrder[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPrintOpen, setIsPrintOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null)
    const printRef = useRef<HTMLDivElement>(null)
    const [searchItemQuery, setSearchItemQuery] = useState('')
    const [availableItems, setAvailableItems] = useState<ProductItem[]>([])

    const [formData, setFormData] = useState({
        sale_code: '',
        sale_date: new Date().toISOString().split('T')[0],
        sale_total_amount: 0,
        sale_status: 'Pending',
        customer_id: 0,
        items: [] as SaleOrderItemForm[],
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            const [ordersRes, customersRes] = await Promise.all([
                fetch('/api/sale-orders?page=1&limit=100'),
                fetch('/api/customers?page=1&limit=100'),
            ])

            if (!ordersRes.ok || !customersRes.ok)
                throw new Error('ไม่สามารถดึงข้อมูลได้')

            const [ordersData, customersData] = await Promise.all([
                ordersRes.json(),
                customersRes.json(),
            ])

            setOrders(ordersData.data)
            setCustomers(customersData.data)
        } catch {
            showToast('ไม่สามารถโหลดข้อมูลการขายได้', 'error')
        } finally {
            setLoading(false)
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

    const searchAvailableItems = async (query: string) => {
        if (!query) return setAvailableItems([])
        try {
            const res = await fetch(
                `/api/product-items?search=${encodeURIComponent(query)}&status=Available`
            )
            if (res.ok) {
                const data = await res.json()
                const filtered = data.data.filter(
                    (di: ProductItem) =>
                        !formData.items.find((fi) => fi.item_id === di.item_id)
                )
                setAvailableItems(filtered)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleEdit = async (order: SaleOrder) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/sale-orders/${order.sale_id}`)
            if (res.ok) {
                const data = await res.json()
                const fullOrder = data.data
                setSelectedOrder(fullOrder)
                setFormData({
                    sale_code: fullOrder.sale_code,
                    sale_date: new Date(fullOrder.sale_date)
                        .toISOString()
                        .split('T')[0],
                    sale_total_amount: fullOrder.sale_total_amount || 0,
                    sale_status: fullOrder.sale_status || 'Pending',
                    customer_id: fullOrder.customer_id || 0,
                    items: fullOrder.items || [],
                })
                setSearchItemQuery('')
                setAvailableItems([])
                setIsModalOpen(true)
            }
        } catch (err) {
            showToast('Loading error', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = async (order: SaleOrder) => {
        try {
            setLoading(true)
            const res = await fetch(`/api/sale-orders/${order.sale_id}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedOrder(data.data) // data.data includes items
                setIsPrintOpen(true)
                setTimeout(() => {
                    window.print()
                }, 500)
            }
        } catch {
            showToast('ไม่สามารถโหลดข้อมูลสำหรับพิมพ์ได้', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบใบสั่งขายนี้?')) return
        try {
            const response = await fetch(`/api/sale-orders/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete order')
            showToast('Sale order deleted successfully', 'success')
            fetchData()
        } catch {
            showToast('Failed to delete order', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedOrder
                ? `/api/sale-orders/${selectedOrder.sale_id}`
                : '/api/sale-orders'
            const method = selectedOrder ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save order')
            showToast(
                `Order ${selectedOrder ? 'updated' : 'created'} successfully`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedOrder(null)
            fetchData()
        } catch {
            showToast('Failed to save order', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        ใบสั่งขาย
                    </h1>
                </div>
                <button
                    onClick={() => {
                        setSelectedOrder(null)
                        setSearchItemQuery('')
                        setAvailableItems([])
                        setFormData({
                            sale_code: `SO-${Date.now().toString().slice(-6)}`,
                            sale_date: new Date().toISOString().split('T')[0],
                            sale_total_amount: 0,
                            sale_status: 'Pending',
                            customer_id: customers[0]?.customer_id || 0,
                            items: [],
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    สร้างใบสั่งขาย
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
                                    รหัสใบสั่ง
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    ลูกค้า
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    จำนวน / สถานะ
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    จัดการ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => (
                                <tr
                                    key={order.sale_id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                        {order.sale_code}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {(() => {
                                            const c = customers.find(
                                                (c) =>
                                                    c.customer_id ===
                                                    order.customer_id
                                            )
                                            return c
                                                ? `${c.customer_fname} ${c.customer_lname}`
                                                : 'Unknown'
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">
                                            ฿
                                            {order.sale_total_amount?.toLocaleString() ||
                                                '0'}
                                        </div>
                                        <div
                                            className={`text-[10px] font-bold uppercase ${
                                                order.sale_status ===
                                                'Completed'
                                                    ? 'text-green-600'
                                                    : order.sale_status ===
                                                        'Cancelled'
                                                      ? 'text-red-600'
                                                      : 'text-orange-500'
                                            }`}
                                        >
                                            {order.sale_status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    handlePrint(order)
                                                }
                                                className="p-1 text-slate-400 transition-colors hover:text-green-600"
                                                title="Print as PDF"
                                            >
                                                <PrintIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleEdit(order)
                                                }
                                                className="p-1 text-slate-400 transition-colors hover:text-blue-600"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    order.sale_id &&
                                                    handleDelete(order.sale_id)
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

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-bg w-full max-w-lg rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            {selectedOrder ? 'แก้ไขใบสั่งขาย' : 'ใบสั่งขายใหม่'}
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    รหัสใบสั่ง
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.sale_code}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sale_code: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    วันที่
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.sale_date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sale_date: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ลูกค้า
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
                                    จำนวนรวม (฿)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.sale_total_amount}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sale_total_amount: parseFloat(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    สถานะ
                                </label>
                                <select
                                    required
                                    value={formData.sale_status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sale_status: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                >
                                    <option value="Pending">รอดำเนินการ</option>
                                    <option value="Completed">เสร็จสิ้น</option>
                                    <option value="Cancelled">ยกเลิก</option>
                                    <option value="Processing">
                                        กำลังประมวลผล
                                    </option>
                                </select>
                            </div>
                            <div className="col-span-2 border-t border-slate-200 pt-4">
                                <h3 className="mb-4 text-sm font-bold text-slate-900">
                                    รายการสินค้า
                                </h3>

                                <div className="mb-4 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="ค้นหา Serial Number, IMEI..."
                                        value={searchItemQuery}
                                        onChange={(e) =>
                                            setSearchItemQuery(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                searchAvailableItems(
                                                    searchItemQuery
                                                )
                                            }
                                        }}
                                        className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            searchAvailableItems(
                                                searchItemQuery
                                            )
                                        }
                                        className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                    >
                                        ค้นหา
                                    </button>
                                </div>

                                {availableItems.length > 0 && (
                                    <div className="mb-4 max-h-40 overflow-auto rounded-md border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-3 py-2 font-bold text-slate-600 uppercase">
                                                        Serial
                                                    </th>
                                                    <th className="px-3 py-2 font-bold text-slate-600 uppercase">
                                                        IMEI
                                                    </th>
                                                    <th className="px-3 py-2 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {availableItems.map((item) => (
                                                    <tr
                                                        key={item.item_id}
                                                        className="hover:bg-slate-50"
                                                    >
                                                        <td className="px-3 py-2 font-mono">
                                                            {
                                                                item.item_serial_number
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2 font-mono">
                                                            {item.item_imei}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newItems =
                                                                        [
                                                                            ...formData.items,
                                                                            {
                                                                                item_id:
                                                                                    item.item_id!,
                                                                                sale_price: 0,
                                                                                item_serial_number:
                                                                                    item.item_serial_number,
                                                                                item_imei:
                                                                                    item.item_imei,
                                                                            },
                                                                        ]
                                                                    setFormData(
                                                                        {
                                                                            ...formData,
                                                                            items: newItems,
                                                                            sale_total_amount:
                                                                                newItems.reduce(
                                                                                    (
                                                                                        acc,
                                                                                        curr
                                                                                    ) =>
                                                                                        acc +
                                                                                        Number(
                                                                                            curr.sale_price ||
                                                                                                0
                                                                                        ),
                                                                                    0
                                                                                ),
                                                                        }
                                                                    )
                                                                    setAvailableItems(
                                                                        availableItems.filter(
                                                                            (
                                                                                i
                                                                            ) =>
                                                                                i.item_id !==
                                                                                item.item_id
                                                                        )
                                                                    )
                                                                }}
                                                                className="rounded bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                                                            >
                                                                + เพิ่ม
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-y border-slate-200 bg-slate-50">
                                            <tr>
                                                <th className="px-3 py-2 font-bold text-slate-600 uppercase">
                                                    สินค้าที่เลือก
                                                </th>
                                                <th className="w-32 px-3 py-2 font-bold text-slate-600 uppercase">
                                                    ราคาขาย (฿)
                                                </th>
                                                <th className="w-16 px-3 py-2 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {formData.items.map((item, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="font-mono text-xs">
                                                            SN:{' '}
                                                            {item.item_serial_number ||
                                                                '-'}
                                                        </div>
                                                        <div className="font-mono text-xs text-slate-400">
                                                            IMEI:{' '}
                                                            {item.item_imei ||
                                                                '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={
                                                                item.sale_price
                                                            }
                                                            onChange={(e) => {
                                                                const updatedItems =
                                                                    [
                                                                        ...formData.items,
                                                                    ]
                                                                updatedItems[
                                                                    idx
                                                                ].sale_price =
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                setFormData({
                                                                    ...formData,
                                                                    items: updatedItems,
                                                                    sale_total_amount:
                                                                        updatedItems.reduce(
                                                                            (
                                                                                acc,
                                                                                curr
                                                                            ) =>
                                                                                acc +
                                                                                Number(
                                                                                    curr.sale_price ||
                                                                                        0
                                                                                ),
                                                                            0
                                                                        ),
                                                                })
                                                            }}
                                                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-right focus:border-blue-600 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updatedItems =
                                                                    formData.items.filter(
                                                                        (
                                                                            _,
                                                                            i
                                                                        ) =>
                                                                            i !==
                                                                            idx
                                                                    )
                                                                setFormData({
                                                                    ...formData,
                                                                    items: updatedItems,
                                                                    sale_total_amount:
                                                                        updatedItems.reduce(
                                                                            (
                                                                                acc,
                                                                                curr
                                                                            ) =>
                                                                                acc +
                                                                                Number(
                                                                                    curr.sale_price ||
                                                                                        0
                                                                                ),
                                                                            0
                                                                        ),
                                                                })
                                                            }}
                                                            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <CloseIcon />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData.items.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="px-3 py-8 text-center font-medium text-slate-400"
                                                    >
                                                        ยังไม่มีสินค้าในใบสั่งขาย
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {formData.items.length > 0 && (
                                            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                                                <tr>
                                                    <td className="px-3 py-3 text-right text-slate-600">
                                                        ยอดรวมทั้งสิ้น
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-lg text-slate-900">
                                                        ฿
                                                        {formData.sale_total_amount.toLocaleString(
                                                            'th-TH'
                                                        )}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={formData.items.length === 0}
                                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {selectedOrder
                                        ? 'อัปเดตใบสั่งขาย'
                                        : 'สร้างใบสั่งขาย'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPrintOpen && selectedOrder && (
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
                            {/* Close button - only visible on screen */}
                            <div className="mb-8 flex items-center justify-between print:hidden">
                                <h1 className="text-3xl font-bold text-slate-900">
                                    ใบสั่งขาย
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
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">
                                            {storeName}
                                        </h2>
                                        <p className="text-sm text-slate-600">
                                            ระบบจัดเก็บสินค้า
                                        </p>
                                    </div>
                                    <div></div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-600">
                                            ใบสั่งขาย
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {selectedOrder.sale_code}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="mb-8 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        ออกบิลให้
                                    </p>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900">
                                            {(() => {
                                                const c = customers.find(
                                                    (c) =>
                                                        c.customer_id ===
                                                        selectedOrder.customer_id
                                                )
                                                return c
                                                    ? `${c.customer_fname} ${c.customer_lname}`
                                                    : 'Unknown Customer'
                                            })()}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {(() => {
                                                const c = customers.find(
                                                    (c) =>
                                                        c.customer_id ===
                                                        selectedOrder.customer_id
                                                )
                                                return c?.customer_phone || '-'
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-right">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            วันที่สั่ง
                                        </p>
                                        <p className="text-sm text-slate-900">
                                            {new Date(
                                                selectedOrder.sale_date
                                            ).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            สถานะ
                                        </p>
                                        <p
                                            className={`text-sm font-bold ${
                                                selectedOrder.sale_status ===
                                                'Completed'
                                                    ? 'text-green-600'
                                                    : selectedOrder.sale_status ===
                                                        'Cancelled'
                                                      ? 'text-red-600'
                                                      : 'text-orange-500'
                                            }`}
                                        >
                                            {selectedOrder.sale_status ===
                                            'Completed'
                                                ? 'เสร็จสิ้น'
                                                : selectedOrder.sale_status ===
                                                    'Cancelled'
                                                  ? 'ยกเลิก'
                                                  : selectedOrder.sale_status ===
                                                      'Processing'
                                                    ? 'กำลังประมวลผล'
                                                    : 'รอดำเนินการ'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="mb-8 border-b-2 border-slate-200 pb-4">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-200">
                                        <tr>
                                            <th className="py-2 font-bold text-slate-600 uppercase">
                                                รายละเอียดสินค้า
                                            </th>
                                            <th className="py-2 text-right font-bold text-slate-600 uppercase">
                                                ราคา
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(
                                            (selectedOrder as any).items || []
                                        ).map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td className="py-3">
                                                    <div className="font-bold text-slate-900">
                                                        โทรศัพท์มือถือ / อุปกรณ์
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        SN:{' '}
                                                        {item.item_serial_number ||
                                                            '-'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        IMEI:{' '}
                                                        {item.item_imei || '-'}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right font-bold text-slate-900">
                                                    ฿
                                                    {Number(
                                                        item.sale_price
                                                    ).toLocaleString('th-TH')}
                                                </td>
                                            </tr>
                                        ))}
                                        {((selectedOrder as any).items
                                            ?.length || 0) === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={2}
                                                    className="py-4 text-center text-slate-400"
                                                >
                                                    ไม่มีรายการสินค้า
                                                </td>
                                            </tr>
                                        )}
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
                                            {selectedOrder.sale_total_amount?.toLocaleString(
                                                'th-TH'
                                            ) || '0'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-16 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
                                <p>
                                    เอกสารนี้สร้างขึ้นอย่างเป็นอิเล็กทรอนิกส์จากระบบจัดเก็บสินค้า
                                    {' '}
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
