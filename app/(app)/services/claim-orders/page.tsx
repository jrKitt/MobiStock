'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ClaimOrder, Customer, ProductItem, Supplier } from '@/types/api'
import { PrintIcon, EditIcon, DeleteIcon, CloseIcon, QrCodeIcon } from '@/lib/icons'
import generatePayload from 'promptpay-qr'
import { QRCodeCanvas } from 'qrcode.react'

export default function ClaimOrdersPage() {
    const { showToast } = useToast()
    const [claims, setClaims] = useState<ClaimOrder[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [items, setItems] = useState<ProductItem[]>([])
    const [filterQuery, setFilterQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterStartDate, setFilterStartDate] = useState('')
    const [filterEndDate, setFilterEndDate] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const itemsPerPage = 10
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPrintOpen, setIsPrintOpen] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isQROpen, setIsQROpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{
        type: string
        claimId: number
        message: string
        onConfirm: () => void
    } | null>(null)
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState(0)
    const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false)
    const [resolutionData, setResolutionData] = useState({
        claim_resolution: 'unknown',
        claim_date_returned: new Date().toISOString().split('T')[0],
    })
    const [selectedClaim, setSelectedClaim] = useState<ClaimOrder | null>(null)
    const [confirmImages, setConfirmImages] = useState<
        { url: string; uploading: boolean }[]
    >([])
    const [isImagesModalOpen, setIsImagesModalOpen] = useState(false)
    const [selectedClaimImages, setSelectedClaimImages] = useState<string[]>([])
    const [storeName, setStoreName] = useState('MobiStock')
    const [storeLogo, setStoreLogo] = useState<string | null>(null)
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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            params.append('page', '1')
            params.append('limit', '100')
            if (filterStatus) params.append('status', filterStatus)

            const [claimsRes, customersRes, suppliersRes, itemsRes] =
                await Promise.all([
                    fetch(`/api/claim-orders?${params.toString()}`),
                    fetch('/api/customers?page=1&limit=100'),
                    fetch('/api/suppliers?page=1&limit=100'),
                    fetch('/api/product-items?page=1&limit=100'),
                ])

            if (
                !claimsRes.ok ||
                !customersRes.ok ||
                !suppliersRes.ok ||
                !itemsRes.ok
            ) {
                throw new Error('ไม่สามารถดึงข้อมูลได้')
            }

            const [claimsData, customersData, suppliersData, itemsData] =
                await Promise.all([
                    claimsRes.json(),
                    customersRes.json(),
                    suppliersRes.json(),
                    itemsRes.json(),
                ])

            setClaims(claimsData.data)
            setCustomers(customersData.data)
            setSuppliers(suppliersData.data)
            setItems(itemsData.data)
        } catch {
            showToast('ไม่สามารถโหลดข้อมูลการแจ้งเรียกร้องได้', 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast, filterStatus])

    useEffect(() => {
        fetchData()
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

    const handleEdit = (claim: ClaimOrder) => {
        setSelectedClaim(claim)
        setFormData({
            claim_code: claim.claim_code,
            claim_date_received: new Date(claim.claim_date_received)
                .toISOString()
                .split('T')[0],
            claim_date_returned: claim.claim_date_returned
                ? new Date(claim.claim_date_returned)
                      .toISOString()
                      .split('T')[0]
                : '',
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
            if (printRef.current) {
                printRef.current.innerHTML = generateReceiptHTML(claim)
                window.print()
            }
        }, 100)
    }

    const handleViewImages = async (claim: ClaimOrder) => {
        try {
            // Fetch images for this claim
            const response = await fetch(`/api/claim-order-images?claim_id=${claim.claim_id}`)
            if (response.ok) {
                const images = await response.json()
                setSelectedClaimImages(images.map((img: any) => img.image_url))
                setIsImagesModalOpen(true)
            } else {
                showToast('ไม่พบรูปภาพ', 'warning')
            }
        } catch (error) {
            console.error('Error fetching images:', error)
            showToast('เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ', 'error')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบการแจ้งเรียกร้องนี้หรือไม่?')) return
        try {
            const response = await fetch(`/api/claim-orders/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete claim')
            showToast('การแจ้งเรียกร้องลบสำเร็จ', 'success')
            fetchData()
        } catch {
            showToast('ไม่สามารถลบการแจ้งเรียกร้องได้', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // For new claims, ensure default values
            const submitData = selectedClaim 
                ? formData 
                : {
                    ...formData,
                    claim_status: 'pending',
                    claim_resolution: 'unknown',
                    claim_date_returned: '',
                }
            
            const url = selectedClaim
                ? `/api/claim-orders/${selectedClaim.claim_id}`
                : '/api/claim-orders'
            const method = selectedClaim ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            })

            if (!response.ok) throw new Error('Failed to save claim')
            showToast(
                `การแจ้งเรียกร้อง${selectedClaim ? 'อัปเดต' : 'สร้าง'}สำเร็จ`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedClaim(null)
            fetchData()
        } catch {
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
            pending: 'รอส่งเคลม',
            in_review: 'กำลังดำเนินการ',
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

    const handleConfirmImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        const placeholders = files.map(() => ({ url: '', uploading: true }))
        setConfirmImages((prev) => [...prev, ...placeholders])
        const startIndex = confirmImages.length

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
                    setConfirmImages((prev) => {
                        const updated = [...prev]
                        updated[startIndex + i] = {
                            url: data.url,
                            uploading: false,
                        }
                        return updated
                    })
                } else {
                    setConfirmImages((prev) =>
                        prev.filter((_, idx) => idx !== startIndex + i)
                    )
                    showToast('อัปโหลดรูปภาพไม่สำเร็จ', 'error')
                }
            })
        )
        e.target.value = ''
    }

    const handleOpenQRModal = (claim: ClaimOrder) => {
        const promptpayId = localStorage.getItem('mobistock_promptpay_id')
        if (!promptpayId) {
            showToast('กรุณาตั้งค่ารหัสพร้อมเพย์ที่หน้าระบบก่อน', 'warning')
            return
        }
        setSelectedClaim(claim)
        setIsQROpen(true)
    }

    const confirmClaimResolution = async () => {
        if (!selectedClaim?.claim_id) return
        const readyImages = confirmImages.filter((img) => !img.uploading)
        
        if (readyImages.length < 1) {
            showToast('กรุณาอัปโหลดรูปภาพหลักฐานการแก้ไข อย่างน้อย 1 รูป', 'warning')
            return
        }
        
        try {
            setIsSubmitting(true)
            // Save confirmation images first
            await Promise.all(
                readyImages.map((img: any) =>
                    fetch('/api/claim-order-images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            claim_id: selectedClaim.claim_id,
                            image_url: img.url,
                            image_caption: 'หลักฐานการแก้ไข',
                        }),
                    })
                )
            )
            
            // Then mark claim as resolved with resolution data
            const res = await fetch(
                `/api/claim-orders/${selectedClaim.claim_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...selectedClaim,
                        claim_status: 'resolved',
                        claim_resolution: resolutionData.claim_resolution,
                        claim_date_returned: resolutionData.claim_date_returned,
                        update_by: 'staff',
                    }),
                }
            )
            if (res.ok) {
                showToast('แก้ไขเคลมสำเร็จ', 'success')
                fetchData()
                setIsConfirmModalOpen(false)
                setIsQROpen(false)
                setConfirmImages([])
                setSelectedClaim(null)
                setResolutionData({
                    claim_resolution: 'unknown',
                    claim_date_returned: new Date().toISOString().split('T')[0],
                })
            } else {
                showToast('แก้ไขเคลมไม่สำเร็จ กรุณาลองใหม่', 'error')
            }
        } catch {
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        การเคลมสินค้า
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        จัดการการแจ้งเคลมสินค้าจากลูกค้าตามเงื่อนไขการรับประกัน
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedClaim(null)
                        setFormData({
                            claim_code: `CL-${Date.now().toString().slice(-6)}`,
                            claim_date_received: new Date()
                                .toISOString()
                                .split('T')[0],
                            claim_date_returned: '',
                            claim_status: 'pending',
                            claim_resolution: 'unknown',
                            supplier_id: 0,
                            customer_id: customers[0]?.customer_id || 0,
                            item_id: items[0]?.item_id || 0,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    + สร้างการแจ้งเคลมสินค้า
                </button>
            </div>
             <div className="flex space-x-1 rounded-lg bg-slate-100/50 p-1">
                {[
                    { id: '', label: 'ทั้งหมด' },
                    { id: 'pending', label: 'รอส่งเคลม' },
                    { id: 'in_review', label: 'กำลังดำเนินการ' },
                    { id: 'resolved', label: 'แก้ไขแล้ว' },
                    { id: 'rejected', label: 'ปฏิเสธ' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterStatus(tab.id)}
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

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหารหัสเคลม, ชื่อลูกค้า, รุ่นสินค้า, Serial, IMEI..."
                                value={filterQuery}
                                onChange={(e) => {
                                    setFilterQuery(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-3 text-sm placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="date"
                                placeholder="วันที่"
                                value={filterStartDate}
                                onChange={(e) => {
                                    setFilterStartDate(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-3 text-sm placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
           

            {loading ? (
                <div className="bg-bg flex items-center justify-center rounded-lg border border-slate-200 p-24">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                </div>
            ) : (
            
                <div className="space-y-4">
                    {/* Header Desktop */}
                    <div className="hidden grid-cols-5 rounded-lg border border-slate-200 bg-white px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-500 uppercase shadow-sm md:grid">
                        <div>รหัสแจ้ง</div>
                        <div>ลูกค้า</div>
                        <div>ซัพพลายเออร์</div>
                        <div>สถานะ / การแก้ไข</div>
                        <div className="text-right">จัดการ</div>
                    </div>

                    {/* End Header Desktop */}
                    {claims.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                            <span className="text-sm text-slate-500">
                                ไม่พบข้อมูลการเคลม
                            </span>
                        </div>
                    ) : (
                        claims.map((claim) => {
                            const customer = customers.find(c => c.customer_id === claim.customer_id)
                            const supplier = suppliers.find(s => s.supplier_id === claim.supplier_id)
                            
                            return (
                                <div
                                    key={claim.claim_id}
                                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="grid grid-cols-1 items-center gap-4 px-6 py-5 md:grid-cols-5">
                                        <div className="text-sm font-bold text-slate-900">
                                            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                                รหัสแจ้ง
                                            </div>
                                            {claim.claim_code}
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                                ลูกค้า
                                            </div>
                                            {customer ? `${customer.customer_fname} ${customer.customer_lname}` : 'ไม่ระบุ'}
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                                ซัพพลายเออร์
                                            </div>
                                            {supplier?.supplier_name || 'จัดการเอง'}
                                        </div>
                                        <div>
                                            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                                สถานะ / การแก้ไข
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span
                                                    className={`text-[10px] font-bold uppercase ${
                                                        claim.claim_status === 'resolved'
                                                            ? 'text-green-600'
                                                            : claim.claim_status === 'rejected'
                                                              ? 'text-red-600'
                                                              : claim.claim_status === 'in_review'
                                                                ? 'text-blue-600'
                                                                : 'text-orange-500'
                                                    }`}
                                                >
                                                    {getStatusLabel(claim.claim_status)}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                                    {getResolutionLabel(claim.claim_resolution)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-start gap-2 pt-2 md:justify-end md:pt-0">
                                            {/* Pending Status - Start Review */}
                                            {claim.claim_status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            if (claim.claim_id) {
                                                                setSelectedClaim(claim)
                                                                setSelectedSupplier(0)
                                                                setIsSupplierModalOpen(true)
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                                                    >
                                                        <EditIcon className="h-4 w-4" />
                                                        เริ่มตรวจสอบ
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (claim.claim_id) {
                                                                setConfirmAction({
                                                                    type: 'cancel_claim',
                                                                    claimId: claim.claim_id,
                                                                    message: 'ยกเลิกเคลมนี้หรือไม่?',
                                                                    onConfirm: () => {
                                                                        setSelectedClaim(claim)
                                                                        setFormData({
                                                                            ...formData,
                                                                            claim_status: 'rejected',
                                                                            claim_date_returned: new Date().toISOString().split('T')[0],
                                                                        })
                                                                        fetch(`/api/claim-orders/${claim.claim_id}`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({
                                                                                ...claim,
                                                                                claim_status: 'rejected',
                                                                                claim_date_returned: new Date().toISOString().split('T')[0],
                                                                                update_by: 'staff',
                                                                            }),
                                                                        }).then(res => {
                                                                            if (res.ok) {
                                                                                showToast('ยกเลิกเคลมแล้ว', 'success')
                                                                                fetchData()
                                                                            } else {
                                                                                showToast('อัปเดตสถานะไม่สำเร็จ', 'error')
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                                    >
                                                        <CloseIcon className="h-4 w-4" />
                                                        ยกเลิกเคลม
                                                    </button>
                                                </>
                                            )}
                                            
                                            {/* In Review Status - Confirm Resolution or Cancel */}
                                            {claim.claim_status === 'in_review' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            if (claim.claim_id) {
                                                                setSelectedClaim(claim)
                                                                setResolutionData({
                                                                    claim_resolution: 'unknown',
                                                                    claim_date_returned: new Date().toISOString().split('T')[0],
                                                                })
                                                                setIsResolutionModalOpen(true)
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-100"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        ยืนยันการเคลม
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (claim.claim_id) {
                                                                setConfirmAction({
                                                                    type: 'cancel_claim',
                                                                    claimId: claim.claim_id,
                                                                    message: 'ยกเลิกเคลมนี้หรือไม่?',
                                                                    onConfirm: () => {
                                                                        setSelectedClaim(claim)
                                                                        setFormData({
                                                                            ...formData,
                                                                            claim_status: 'rejected',
                                                                            claim_date_returned: new Date().toISOString().split('T')[0],
                                                                        })
                                                                        fetch(`/api/claim-orders/${claim.claim_id}`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({
                                                                                ...claim,
                                                                                claim_status: 'rejected',
                                                                                claim_date_returned: new Date().toISOString().split('T')[0],
                                                                                update_by: 'staff',
                                                                            }),
                                                                        }).then(res => {
                                                                            if (res.ok) {
                                                                                showToast('ยกเลิกเคลมแล้ว', 'success')
                                                                                fetchData()
                                                                            } else {
                                                                                showToast('อัปเดตสถานะไม่สำเร็จ', 'error')
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                        }}
                                                        className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                                    >
                                                        <CloseIcon className="h-4 w-4" />
                                                        ยกเลิกเคลม
                                                    </button>
                                                </>
                                            )}
                                            
                                            {/* Resolved/Rejected Status - View Details */}
                                            {(claim.claim_status === 'resolved' || claim.claim_status === 'rejected') && (
                                                <>
                                                    <button
                                                        onClick={() => handleViewImages(claim)}
                                                        className="flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-100"
                                                        title="ดูรูปภาพ"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        ดูรูปภาพ
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrint(claim)}
                                                        className="flex items-center gap-1 rounded bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        ดูรายละเอียด
                                                    </button>
                                                </>
                                            )}
                                            
                                            {/* Always available actions - only show if not already showing above */}
                                            {claim.claim_status !== 'resolved' && claim.claim_status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleEdit(claim)}
                                                    className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                                                >
                                                    <EditIcon />
                                                </button>
                                            )}
                                            {claim.claim_status === 'pending' && (
                                                <button
                                                    onClick={() => {
                                                        if (claim.claim_id) {
                                                            setConfirmAction({
                                                                type: 'delete_claim',
                                                                claimId: claim.claim_id,
                                                                message: 'ลบเคลมนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
                                                                onConfirm: () => {
                                                                    handleDelete(claim.claim_id!)
                                                                }
                                                            })
                                                        }
                                                    }}
                                                    className="p-1 text-slate-400 transition-colors hover:text-red-500"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-bg max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            {selectedClaim
                                ? 'แก้ไขการเคลมสินค้า'
                                : 'สร้างการเคลมสินค้าใหม่'}
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    รหัสแจ้ง *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.claim_code}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            claim_code: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
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
                                    วันที่ได้รับการแจ้ง *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.claim_date_received}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            claim_date_received: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
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
                    <div
                        id="printArea"
                        ref={printRef}
                        className="bg-bg fixed inset-0 z-50 overflow-auto p-8 print:p-0"
                    >
                        <div className="mx-auto max-w-4xl print:max-w-none">
                            <div className="mb-8 flex items-center justify-between print:hidden">
                                <h1 className="text-3xl font-bold text-slate-900">
                                    แบบแจ้งเรียกร้อง
                                </h1>
                                <button
                                    onClick={() => setIsPrintOpen(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="mb-8 border-b-2 border-slate-200 pb-8">
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
                                            ระบบจัดการสต็อก - ใบรับเคลมสินค้า
                                        </p>
                                    </div>
                                </div>
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
                                                        selectedClaim.customer_id
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
                                                        selectedClaim.customer_id
                                                )
                                                return c?.customer_phone || '-'
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-right">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            รหัสแจ้ง
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {selectedClaim.claim_code}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            วันที่ได้รับการแจ้ง
                                        </p>
                                        <p className="text-sm text-slate-900">
                                            {new Date(
                                                selectedClaim.claim_date_received
                                            ).toLocaleDateString('th-TH')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        ซัพพลายเออร์
                                    </p>
                                    <p className="text-sm text-slate-900">
                                        {(() => {
                                            const s = suppliers.find(
                                                (sup) =>
                                                    sup.supplier_id ===
                                                    selectedClaim.supplier_id
                                            )
                                            return s?.supplier_name || 'ไม่ระบุ'
                                        })()}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {(() => {
                                            const s = suppliers.find(
                                                (sup) =>
                                                    sup.supplier_id ===
                                                    selectedClaim.supplier_id
                                            )
                                            return s?.supplier_phone || '-'
                                        })()}
                                    </p>
                                </div>
                                <div className="space-y-2 text-right">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            สถานะ
                                        </p>
                                        <p
                                            className={`text-sm font-bold ${getStatusColor(selectedClaim.claim_status)}`}
                                        >
                                            {getStatusLabel(
                                                selectedClaim.claim_status
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            การแก้ไข
                                        </p>
                                        <p className="text-sm text-slate-900">
                                            {getResolutionLabel(
                                                selectedClaim.claim_resolution
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 rounded-lg border border-slate-200 p-4">
                                <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    เลขที่สินค้า
                                </p>
                                <p className="text-sm text-slate-900">
                                    {(() => {
                                        const item = items.find(
                                            (i) =>
                                                i.item_id ===
                                                selectedClaim.item_id
                                        )
                                        return (
                                            item?.item_serial_number ||
                                            'ไม่ระบุ'
                                        )
                                    })()}
                                </p>
                            </div>

                            <div className="mt-16 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
                                <p>
                                    เอกสารนี้เป็นหลักฐานการรับแจ้งเคลมสินค้า
                                    เพื่อเก็บไว้ตรวจสอบในภายหลัง
                                </p>
                                <p>{new Date().toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* QR Modal */}
            {isQROpen && selectedClaim && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <h3 className="font-bold text-slate-900">
                                QR Code ยืนยันการแก้ไข
                            </h3>
                            <button
                                onClick={() => setIsQROpen(false)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-8 text-center">
                            <div className="mb-6">
                                <p className="mb-1 text-sm font-medium text-slate-500">
                                    รหัสเคลม
                                </p>
                                <p className="text-lg font-bold text-slate-900">
                                    {selectedClaim.claim_code}
                                </p>
                            </div>

                            <div className="mb-6">
                                <QRCodeCanvas
                                    value={generatePayload(
                                        localStorage.getItem(
                                            'mobistock_promptpay_id'
                                        ) || '',
                                        {
                                            amount: 0, // Claims typically don't have payment amounts
                                        }
                                    )}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="mt-8 flex flex-col gap-3">
                                <button
                                    onClick={() => setIsConfirmModalOpen(true)}
                                    className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    ยืนยันการแก้ไข
                                </button>
                                <button
                                    onClick={() => setIsQROpen(false)}
                                    className="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                ยืนยันการแก้ไขเคลม
                            </h3>
                            <button
                                onClick={() => {
                                    setIsConfirmModalOpen(false)
                                    setConfirmImages([])
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="mb-6 text-sm text-slate-600">
                                กรุณาอัปโหลดหลักฐานการแก้ไข
                                <span className="font-semibold text-red-600">
                                    {' '}
                                    หลักฐานการแก้ไข
                                </span>{' '}
                                ก่อนยืนยัน
                            </p>

                            {/* Upload Section */}
                            <div className="mb-6">
                                <label
                                    htmlFor="confirm-images"
                                    className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                                        confirmImages.filter((i) => !i.uploading).length >= 1
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                                    }`}
                                >
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
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                        />
                                    </svg>
                                    <span className="text-xs">คลิกเพื่ออัปโหลดรูปภาพหลักฐานการแก้ไข</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        id="confirm-images"
                                        onChange={handleConfirmImageUpload}
                                    />
                                </label>

                                {/* Images Grid */}
                                {confirmImages.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {confirmImages.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                                            >
                                                {img.uploading ? (
                                                    <div className="flex h-full items-center justify-center">
                                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <img
                                                            src={img.url}
                                                            alt={`หลักฐาน ${idx + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setConfirmImages(
                                                                    (prev) =>
                                                                        prev.filter(
                                                                            (_,
                                                                                i
                                                                            ) =>
                                                                                i !==
                                                                                idx
                                                                        )
                                                                )
                                                            }
                                                            className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                                        >
                                                            <CloseIcon className="h-3 w-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Status Summary */}
                            <div className="mb-4 rounded-lg bg-slate-50 p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-600">สถานะการอัปโหลด:</span>
                                    <span
                                        className={`font-semibold ${
                                            confirmImages.filter((i) => !i.uploading).length >= 1
                                                ? 'text-green-600'
                                                : 'text-orange-500'
                                        }`}
                                    >
                                        {confirmImages.filter((i) => !i.uploading).length >= 1
                                            ? '✓ พร้อมยืนยัน'
                                            : '⏳ รอการอัปโหลด'}
                                    </span>
                                </div>
                                <div className="mt-2 space-y-1 text-xs text-slate-500">
                                    <div className="flex justify-between">
                                        <span>• หลักฐานการแก้ไข:</span>
                                        <span
                                            className={
                                                confirmImages.filter((i) => !i.uploading).length >= 1
                                                    ? 'text-green-600'
                                                    : 'text-slate-400'
                                            }
                                        >
                                            {confirmImages.filter((i) => !i.uploading).length} / 1
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsConfirmModalOpen(false)
                                        setConfirmImages([])
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={confirmClaimResolution}
                                    disabled={
                                        isSubmitting ||
                                        confirmImages.filter((i) => !i.uploading).length < 1
                                    }
                                    className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isSubmitting
                                        ? 'กำลังยืนยัน...'
                                        : 'ยืนยันการแก้ไข'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolution Selection Modal */}
            {isResolutionModalOpen && selectedClaim && (
                <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                ยืนยันการแก้ไขเคลม
                            </h3>
                            <button
                                onClick={() => setIsResolutionModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm font-medium text-slate-900">
                                    เคลม: {selectedClaim.claim_code}
                                </p>
                                <p className="text-xs text-slate-500">
                                    ลูกค้า: {(() => {
                                        const customer = customers.find(c => c.customer_id === selectedClaim.customer_id)
                                        return customer ? `${customer.customer_fname} ${customer.customer_lname}` : 'ไม่ระบุ'
                                    })()}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    ผลการแก้ไข *
                                </label>
                                <select
                                    value={resolutionData.claim_resolution}
                                    onChange={(e) => setResolutionData({
                                        ...resolutionData,
                                        claim_resolution: e.target.value
                                    })}
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="replacement">แลกของใหม่</option>
                                    <option value="refund">คืนเงิน</option>
                                    <option value="repair">ซ่อม</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    วันที่ส่งคืน *
                                </label>
                                <input
                                    type="date"
                                    value={resolutionData.claim_date_returned}
                                    onChange={(e) => setResolutionData({
                                        ...resolutionData,
                                        claim_date_returned: e.target.value
                                    })}
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsResolutionModalOpen(false)}
                                    className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedClaim.claim_id && resolutionData.claim_resolution !== 'unknown') {
                                            // Open image upload modal after selecting resolution
                                            setIsResolutionModalOpen(false)
                                            setIsConfirmModalOpen(true)
                                        } else {
                                            showToast('กรุณาเลือกผลการแก้ไข', 'warning')
                                        }
                                    }}
                                    className="flex-1 rounded-xl bg-teal-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
                                >
                                    ถัดไป (อัปโหลดหลักฐาน)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Selection Modal */}
            {isSupplierModalOpen && selectedClaim && (
                <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                เลือกซัพพลายเออร์
                            </h3>
                            <button
                                onClick={() => setIsSupplierModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="mb-4 text-sm text-slate-600">
                                เลือกซัพพลายเออร์ที่จะส่งเคลมต่อ หรือจัดการเอง
                            </p>
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    ซัพพลายเออร์
                                </label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(parseInt(e.target.value))}
                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value={0}>จัดการเอง (ไม่ส่งต่อซัพพลายเออร์)</option>
                                    {suppliers.map((s) => (
                                        <option key={s.supplier_id} value={s.supplier_id}>
                                            {s.supplier_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsSupplierModalOpen(false)}
                                    className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedClaim.claim_id) {
                                            fetch(`/api/claim-orders/${selectedClaim.claim_id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    ...selectedClaim,
                                                    claim_status: 'in_review',
                                                    supplier_id: selectedSupplier || null,
                                                    update_by: 'staff',
                                                }),
                                            }).then(res => {
                                                if (res.ok) {
                                                    showToast('เริ่มตรวจสอบเคลมแล้ว', 'success')
                                                    fetchData()
                                                    setIsSupplierModalOpen(false)
                                                    setSelectedClaim(null)
                                                    setSelectedSupplier(0)
                                                } else {
                                                    showToast('อัปเดตสถานะไม่สำเร็จ', 'error')
                                                }
                                            })
                                        }
                                    }}
                                    className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
                                >
                                    เริ่มตรวจสอบ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {confirmAction && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="p-6 text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-slate-900">
                                ยืนยันการดำเนินการ
                            </h3>
                            <p className="mb-6 text-sm text-slate-600">
                                {confirmAction.message}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => {
                                        confirmAction.onConfirm()
                                        setConfirmAction(null)
                                    }}
                                    className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                                >
                                    ยืนยัน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewing Modal */}
            {isImagesModalOpen && (
                <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                รูปภาพการแก้ไขเคลม
                            </h3>
                            <button
                                onClick={() => {
                                    setIsImagesModalOpen(false)
                                    setSelectedClaimImages([])
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedClaimImages.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {selectedClaimImages.map((imageUrl, index) => (
                                        <div key={index} className="group relative overflow-hidden rounded-lg border border-slate-200">
                                            <img
                                                src={imageUrl}
                                                alt={`Claim Image ${index + 1}`}
                                                className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity group-hover:bg-opacity-10" />
                                            <button
                                                onClick={() => window.open(imageUrl, '_blank')}
                                                className="absolute bottom-2 right-2 rounded-lg bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100"
                                                title="ดูรูปภาพขนาดใหญ่"
                                            >
                                                <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <svg className="mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm font-medium text-slate-900">ไม่พบรูปภาพ</p>
                                    <p className="mt-1 text-sm text-slate-500">ไม่มีรูปภาพสำหรับเคลมนี้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
