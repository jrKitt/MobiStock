'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ClaimOrder, Customer, ProductItem, Supplier } from '@/types/api'
import { PrintIcon, EditIcon, DeleteIcon, CloseIcon } from '@/lib/icons'

export default function ClaimOrdersPage() {
    const { showToast } = useToast()
    const [claims, setClaims] = useState<ClaimOrder[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [items, setItems] = useState<ProductItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPrintOpen, setIsPrintOpen] = useState(false)
    const [selectedClaim, setSelectedClaim] = useState<ClaimOrder | null>(null)
    const printRef = useRef<HTMLDivElement>(null)
    const [formData, setFormData] = useState({
        claim_code: '',
        claim_date_received: new Date().toISOString().split('T')[0],
        claim_date_returned: '',
        claim_status: 'pending',
        claim_resolution: 'unknown',
        supplier_id: 0,
        customer_id: 0,
        item_id: 0,
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            const [claimsRes, customersRes, suppliersRes, itemsRes] = await Promise.all([
                fetch('/api/claim-orders?page=1&limit=100'),
                fetch('/api/customers?page=1&limit=100'),
                fetch('/api/suppliers?page=1&limit=100'),
                fetch('/api/product-items?page=1&limit=100'),
            ])

            if (!claimsRes.ok || !customersRes.ok || !suppliersRes.ok || !itemsRes.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้')
            }

            const [claimsData, customersData, suppliersData, itemsData] = await Promise.all([
                claimsRes.json(),
                customersRes.json(),
                suppliersRes.json(),
                itemsRes.json(),
            ])

            setClaims(claimsData.data)
            setCustomers(customersData.data)
            setSuppliers(suppliersData.data)
            setItems(itemsData.data)
        } catch (err) {
            showToast('ไม่สามารถโหลดข้อมูลการแจ้งเรียกร้องได้', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (claim: ClaimOrder) => {
        setSelectedClaim(claim)
        setFormData({
            claim_code: claim.claim_code,
            claim_date_received: new Date(claim.claim_date_received).toISOString().split('T')[0],
            claim_date_returned: claim.claim_date_returned ? new Date(claim.claim_date_returned).toISOString().split('T')[0] : '',
            claim_status: claim.claim_status || 'pending',
            claim_resolution: claim.claim_resolution || 'unknown',
            supplier_id: claim.supplier_id || 0,
            customer_id: claim.customer_id || 0,
            item_id: claim.item_id || 0,
        })
        setIsModalOpen(true)
    }

    const handlePrint = (claim: ClaimOrder) => {
        setSelectedClaim(claim)
        setIsPrintOpen(true)
        setTimeout(() => {
            window.print()
        }, 100)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบการแจ้งเรียกร้องนี้หรือไม่?')) return
        try {
            const response = await fetch(`/api/claim-orders/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Failed to delete claim')
            showToast('การแจ้งเรียกร้องลบสำเร็จ', 'success')
            fetchData()
        } catch (err) {
            showToast('ไม่สามารถลบการแจ้งเรียกร้องได้', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedClaim ? `/api/claim-orders/${selectedClaim.claim_id}` : '/api/claim-orders'
            const method = selectedClaim ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save claim')
            showToast(`การแจ้งเรียกร้อง${selectedClaim ? 'อัปเดต' : 'สร้าง'}สำเร็จ`, 'success')
            setIsModalOpen(false)
            setSelectedClaim(null)
            fetchData()
        } catch (err) {
            showToast('ไม่สามารถบันทึกการแจ้งเรียกร้องได้', 'error')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved':
                return 'text-green-600'
            case 'rejected':
                return 'text-red-600'
            case 'in_review':
                return 'text-blue-600'
            case 'pending':
            default:
                return 'text-orange-500'
        }
    }

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            pending: 'รอพิจารณา',
            in_review: 'กำลังตรวจสอบ',
            resolved: 'แก้ไขแล้ว',
            rejected: 'ปฏิเสธ',
        }
        return statusMap[status] || status
    }

    const getResolutionLabel = (resolution: string) => {
        const resolutionMap: { [key: string]: string } = {
            replacement: 'แลกของใหม่',
            refund: 'คืนเงิน',
            repair: 'ซ่อม',
            unknown: 'ยังไม่ทราบ',
        }
        return resolutionMap[resolution] || resolution
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">การแจ้งเรียกร้อง</h1>
                    <p className="text-sm text-slate-500 mt-1">จัดการการแจ้งเรียกร้องจากซัพพลายเออร์เกี่ยวกับสินค้าที่มีข้อบกพร่อง</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedClaim(null)
                        setFormData({
                            claim_code: `CL-${Date.now().toString().slice(-6)}`,
                            claim_date_received: new Date().toISOString().split('T')[0],
                            claim_date_returned: '',
                            claim_status: 'pending',
                            claim_resolution: 'unknown',
                            supplier_id: suppliers[0]?.supplier_id || 0,
                            customer_id: customers[0]?.customer_id || 0,
                            item_id: items[0]?.item_id || 0,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    + สร้างการแจ้งเรียกร้อง
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-24">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">รหัสแจ้ง</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">ลูกค้า</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">ซัพพลายเออร์</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">สถานะ</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">การแก้ไข</th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {claims.map((claim) => (
                                <tr key={claim.claim_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{claim.claim_code}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {(() => {
                                            const customer = customers.find(c => c.customer_id === claim.customer_id)
                                            return customer ? `${customer.customer_fname} ${customer.customer_lname}` : 'ไม่ระบุ'
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {(() => {
                                            const supplier = suppliers.find(s => s.supplier_id === claim.supplier_id)
                                            return supplier?.supplier_name || 'ไม่ระบุ'
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-xs font-bold uppercase ${getStatusColor(claim.claim_status)}`}>
                                            {getStatusLabel(claim.claim_status)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                                            {getResolutionLabel(claim.claim_resolution)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handlePrint(claim)}
                                                className="p-1 text-slate-400 transition-colors hover:text-green-600"
                                                title="พิมพ์"
                                            >
                                                <PrintIcon />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(claim)}
                                                className="p-1 text-slate-400 transition-colors hover:text-blue-600"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => claim.claim_id && handleDelete(claim.claim_id)}
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
                    <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                            {selectedClaim ? 'แก้ไขการแจ้งเรียกร้อง' : 'สร้างการแจ้งเรียกร้องใหม่'}
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    รหัสแจ้ง *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.claim_code}
                                    onChange={(e) => setFormData({ ...formData, claim_code: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    ลูกค้า *
                                </label>
                                <select
                                    required
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value={0}>เลือกลูกค้า</option>
                                    {customers.map(c => (
                                        <option key={c.customer_id} value={c.customer_id}>
                                            {c.customer_fname} {c.customer_lname}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    ซัพพลายเออร์ *
                                </label>
                                <select
                                    required
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value={0}>เลือกซัพพลายเออร์</option>
                                    {suppliers.map(s => (
                                        <option key={s.supplier_id} value={s.supplier_id}>
                                            {s.supplier_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    สินค้า *
                                </label>
                                <select
                                    required
                                    value={formData.item_id}
                                    onChange={(e) => setFormData({ ...formData, item_id: parseInt(e.target.value) })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value={0}>เลือกสินค้า</option>
                                    {items.map(item => (
                                        <option key={item.item_id} value={item.item_id}>
                                            {item.item_serial_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    วันที่ได้รับการแจ้ง *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.claim_date_received}
                                    onChange={(e) => setFormData({ ...formData, claim_date_received: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    วันที่ส่งคืน
                                </label>
                                <input
                                    type="date"
                                    value={formData.claim_date_returned}
                                    onChange={(e) => setFormData({ ...formData, claim_date_returned: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    สถานะ
                                </label>
                                <select
                                    value={formData.claim_status}
                                    onChange={(e) => setFormData({ ...formData, claim_status: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value="pending">รอพิจารณา</option>
                                    <option value="in_review">กำลังตรวจสอบ</option>
                                    <option value="resolved">แก้ไขแล้ว</option>
                                    <option value="rejected">ปฏิเสธ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    การแก้ไข
                                </label>
                                <select
                                    value={formData.claim_resolution}
                                    onChange={(e) => setFormData({ ...formData, claim_resolution: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value="unknown">ยังไม่ทราบ</option>
                                    <option value="replacement">แลกของใหม่</option>
                                    <option value="refund">คืนเงิน</option>
                                    <option value="repair">ซ่อม</option>
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
                                    {selectedClaim ? 'อัปเดต' : 'สร้าง'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            {isPrintOpen && selectedClaim && (
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
                    <div id="printArea" ref={printRef} className="fixed inset-0 z-50 overflow-auto bg-white p-8 print:p-0">
                        <div className="max-w-4xl mx-auto print:max-w-none">
                            <div className="flex justify-between items-center mb-8 print:hidden">
                                <h1 className="text-3xl font-bold text-slate-900">แบบแจ้งเรียกร้อง</h1>
                                <button
                                    onClick={() => setIsPrintOpen(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="mb-8 pb-8 border-b-2 border-slate-200">
                                <h2 className="text-2xl font-bold text-slate-900">MobiStock</h2>
                                <p className="text-sm text-slate-600">ระบบจัดเก็บสินค้า - แบบแจ้งเรียกร้อง</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ลูกค้า</p>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900">
                                            {(() => {
                                                const c = customers.find(cust => cust.customer_id === selectedClaim.customer_id)
                                                return c ? `${c.customer_fname} ${c.customer_lname}` : 'ไม่ระบุ'
                                            })()}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {(() => {
                                                const c = customers.find(cust => cust.customer_id === selectedClaim.customer_id)
                                                return c?.customer_phone || '-'
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">รหัสแจ้ง</p>
                                        <p className="text-2xl font-bold text-slate-900">{selectedClaim.claim_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">วันที่ได้รับการแจ้ง</p>
                                        <p className="text-sm text-slate-900">{new Date(selectedClaim.claim_date_received).toLocaleDateString('th-TH')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ซัพพลายเออร์</p>
                                    <p className="text-sm text-slate-900">
                                        {(() => {
                                            const s = suppliers.find(sup => sup.supplier_id === selectedClaim.supplier_id)
                                            return s?.supplier_name || 'ไม่ระบุ'
                                        })()}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {(() => {
                                            const s = suppliers.find(sup => sup.supplier_id === selectedClaim.supplier_id)
                                            return s?.supplier_phone || '-'
                                        })()}
                                    </p>
                                </div>
                                <div className="text-right space-y-2">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">สถานะ</p>
                                        <p className={`text-sm font-bold ${getStatusColor(selectedClaim.claim_status)}`}>
                                            {getStatusLabel(selectedClaim.claim_status)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">การแก้ไข</p>
                                        <p className="text-sm text-slate-900">{getResolutionLabel(selectedClaim.claim_resolution)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 p-4 border border-slate-200 rounded-lg">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">เลขที่สินค้า</p>
                                <p className="text-sm text-slate-900">
                                    {(() => {
                                        const item = items.find(i => i.item_id === selectedClaim.item_id)
                                        return item?.item_serial_number || 'ไม่ระบุ'
                                    })()}
                                </p>
                            </div>

                            <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
                                <p>เอกสารนี้สร้างขึ้นอย่างเป็นอิเล็กทรอนิกส์จากระบบจัดเก็บสินค้า MobiStock</p>
                                <p>{new Date().toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
