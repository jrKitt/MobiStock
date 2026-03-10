'use client'

import Image from 'next/image'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { SaleOrder, Customer, ProductItem, Category, Brand } from '@/types/api'
import {
    PrintIcon,
    EditIcon,
    DeleteIcon,
    CloseIcon,
    QrCodeIcon,
} from '@/lib/icons'
import generatePayload from 'promptpay-qr'
import { QRCodeCanvas } from 'qrcode.react'

interface SaleOrderItemForm {
    item_id: number
    sale_price: number | string
    item_serial_number?: string
    item_imei?: string
    model_name?: string
    brand_name?: string
    item_lot_number?: string
}

export default function SaleOrdersPage() {
    const { showToast } = useToast()
    const [storeName, setStoreName] = useState('MobiStock')
    const [storeLogo, setStoreLogo] = useState<string | null>(null)
    const [orders, setOrders] = useState<SaleOrder[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [brands, setBrands] = useState<Brand[]>([])

    // Filter states
    const [filterQuery, setFilterQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterBrand, setFilterBrand] = useState('')
    const [filterStartDate, setFilterStartDate] = useState('')
    const [filterEndDate, setFilterEndDate] = useState('')

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const itemsPerPage = 10

    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPrintOpen, setIsPrintOpen] = useState(false)
    const [isQROpen, setIsQROpen] = useState(false)
    const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [confirmImages, setConfirmImages] = useState<
        { url: string; uploading: boolean }[]
    >([])
    const [podImages, setPodImages] = useState<
        { url: string; uploading: boolean }[]
    >([])
    const [paymentBillImages, setPaymentBillImages] = useState<
        { url: string; uploading: boolean }[]
    >([])
    const [isImagesModalOpen, setIsImagesModalOpen] = useState(false)
    const [selectedOrderImages, setSelectedOrderImages] = useState<string[]>([])
    const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null)
    const printRef = useRef<HTMLDivElement>(null)
    const [searchItemQuery, setSearchItemQuery] = useState('')
    const [availableItems, setAvailableItems] = useState<ProductItem[]>([])
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
    const [newCustomer, setNewCustomer] = useState({
        customer_fname: '',
        customer_lname: '',
        customer_phone: '',
        customer_tax_number: '',
        customer_address: '',
    })
    const [filterStatus, setFilterStatus] = useState('')

    const [formData, setFormData] = useState({
        sale_code: '',
        sale_date: new Date().toISOString().split('T')[0],
        sale_total_amount: 0,
        sale_additional_cost: 0,
        sale_status: 'Pending',
        customer_id: 0,
        items: [] as SaleOrderItemForm[],
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)

            // Build query string
            const params = new URLSearchParams()
            params.append('page', currentPage.toString())
            params.append('limit', itemsPerPage.toString())
            if (filterQuery) params.append('search', filterQuery)
            if (filterCategory) params.append('category_id', filterCategory)
            if (filterBrand) params.append('brand_id', filterBrand)
            if (filterStartDate) params.append('start_date', filterStartDate)
            if (filterEndDate) params.append('end_date', filterEndDate)
            if (filterStatus) params.append('status', filterStatus)

            const [ordersRes, customersRes, categoriesRes, brandsRes] =
                await Promise.all([
                    fetch(`/api/sale-orders?${params.toString()}`),
                    fetch('/api/customers?page=1&limit=100'),
                    fetch('/api/categories?page=1&limit=100'),
                    fetch('/api/brands?page=1&limit=100'),
                ])

            if (
                !ordersRes.ok ||
                !customersRes.ok ||
                !categoriesRes.ok ||
                !brandsRes.ok
            )
                throw new Error('ไม่สามารถดึงข้อมูลได้')

            const [ordersData, customersData, categoriesData, brandsData] =
                await Promise.all([
                    ordersRes.json(),
                    customersRes.json(),
                    categoriesRes.json(),
                    brandsRes.json(),
                ])

            setOrders(ordersData.data)
            if (ordersData.pagination) {
                setTotalPages(ordersData.pagination.totalPages)
                setTotalItems(ordersData.pagination.total)
            }
            setCustomers(customersData.data)
            setCategories(categoriesData.data || [])
            setBrands(brandsData.data || [])
        } catch {
            showToast('ไม่สามารถโหลดข้อมูลการขายได้', 'error')
        } finally {
            setLoading(false)
        }
    }, [
        currentPage,
        filterQuery,
        filterCategory,
        filterBrand,
        filterStartDate,
        filterEndDate,
        filterStatus,
        showToast,
    ])

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

    const handleQRPayment = (order: SaleOrder) => {
        const promptpayId = localStorage.getItem('mobistock_promptpay_id')
        if (!promptpayId) {
            showToast('กรุณาตั้งค่ารหัสพร้อมเพย์ที่หน้าระบบก่อน', 'warning')
            return
        }
        setSelectedOrder(order)
        setIsQROpen(true)
    }

    const handleConfirmImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'pod' | 'paymentBill'
    ) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        if (type === 'pod') {
            const placeholders = files.map(() => ({ url: '', uploading: true }))
            setPodImages((prev) => [...prev, ...placeholders])
            const startIndex = podImages.length
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
                        setPodImages((prev) => {
                            const updated = [...prev]
                            updated[startIndex + i] = {
                                url: data.url,
                                uploading: false,
                            }
                            return updated
                        })
                    } else {
                        setPodImages((prev) =>
                            prev.filter((_, idx) => idx !== startIndex + i)
                        )
                        showToast('อัปโหลดรูปภาพ POD ไม่สำเร็จ', 'error')
                    }
                })
            )
        } else {
            const placeholders = files.map(() => ({ url: '', uploading: true }))
            setPaymentBillImages((prev) => [...prev, ...placeholders])
            const startIndex = paymentBillImages.length
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
                        setPaymentBillImages((prev) => {
                            const updated = [...prev]
                            updated[startIndex + i] = {
                                url: data.url,
                                uploading: false,
                            }
                            return updated
                        })
                    } else {
                        setPaymentBillImages((prev) =>
                            prev.filter((_, idx) => idx !== startIndex + i)
                        )
                        showToast('อัปโหลดรูปภาพใบเสร็จไม่สำเร็จ', 'error')
                    }
                })
            )
        }
        e.target.value = ''
    }

    const confirmPayment = async () => {
        if (!selectedOrder?.sale_id) return
        const readyPodImages = podImages.filter((img) => !img.uploading)
        const readyPaymentBillImages = paymentBillImages.filter((img) => !img.uploading)
        
        if (readyPodImages.length < 1) {
            showToast('กรุณาอัปโหลดรูปภาพหลักฐานการโอนเงิน (POD) อย่างน้อย 1 รูป', 'warning')
            return
        }
        
        if (readyPaymentBillImages.length < 1) {
            showToast('กรุณาอัปโหลดรูปภาพใบเสร็จรับเงิน อย่างน้อย 1 รูป', 'warning')
            return
        }
        
        try {
            setIsSubmitting(true)
            // Save confirmation images first
            const allImages = [...readyPodImages, ...readyPaymentBillImages]
            await Promise.all(
                allImages.map((img: any) =>
                    fetch('/api/sale-order-images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sale_id: selectedOrder.sale_id,
                            image_url: img.url,
                            image_caption: readyPodImages.includes(img) ? 'หลักฐานการโอนเงิน (POD)' : 'ใบเสร็จรับเงิน',
                        }),
                    })
                )
            )
            
            // Then mark order as completed
            const res = await fetch(
                `/api/sale-orders/${selectedOrder.sale_id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sale_status: 'Completed' }),
                }
            )
            if (res.ok) {
                showToast('ชำระเงินสำเร็จ', 'success')
                fetchData()
                setIsConfirmPaymentOpen(false)
                setIsQROpen(false)
                setPodImages([])
                setPaymentBillImages([])
            } else {
                showToast('ชำระเงินไม่สำเร็จ กรุณาลองใหม่', 'error')
            }
        } catch {
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Realtime search with debounce
    useEffect(() => {
        const delayTimer = setTimeout(() => {
            fetchData()
        }, 500)

        return () => clearTimeout(delayTimer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filterQuery,
        filterCategory,
        filterBrand,
        filterStartDate,
        filterEndDate,
        fetchData,
    ])

    const searchAvailableItems = useCallback(
        async (query: string) => {
            if (!query) return setAvailableItems([])
            try {
                const res = await fetch(
                    `/api/product-items?search=${encodeURIComponent(query)}&status=Available`
                )
                if (res.ok) {
                    const data = await res.json()
                    const filtered = data.data.filter(
                        (di: ProductItem) =>
                            !formData.items.find(
                                (fi) => fi.item_id === di.item_id
                            )
                    )
                    setAvailableItems(filtered)
                }
            } catch {
                console.error('Failed to search items')
            }
        },
        [formData.items]
    )
    useEffect(() => {
        const delayTimer = setTimeout(() => {
            searchAvailableItems(searchItemQuery)
        }, 500) // ดีเลย์ 500ms หลังจากหยุดพิมพ์

        return () => clearTimeout(delayTimer)
    }, [searchItemQuery, searchAvailableItems])

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
                    sale_additional_cost: fullOrder.sale_additional_cost ?? 0,
                    sale_status: fullOrder.sale_status || 'Pending',
                    customer_id: fullOrder.customer_id || 0,
                    items: fullOrder.items || [],
                })
                setSearchItemQuery('')
                setAvailableItems([])
                setIsModalOpen(true)
            }
        } catch {
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
                const orderData = await res.json()
                setSelectedOrder(orderData)
                setIsPrintOpen(true)
            }
        } catch (error) {
            console.error('Error fetching order:', error)
            showToast('เกิดข้อผิดพลาดในการดึงข้อมูล', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleViewImages = async (order: SaleOrder) => {
        try {
            // Fetch images for this sale order
            const response = await fetch(`/api/sale-order-images?sale_id=${order.sale_id}`)
            if (response.ok) {
                const images = await response.json()
                setSelectedOrderImages(images.map((img: any) => img.image_url))
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
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบใบสั่งขายนี้?')) return
        try {
            setIsSubmitting(true)
            const response = await fetch(`/api/sale-orders/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete order')
            showToast('ลบคำสั่งขายสำเร็จ', 'success')
            fetchData()
        } catch {
            showToast('ไม่สามารถลบคำสั่งขายได้', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
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
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer),
            })

            if (!response.ok) throw new Error('Failed to create customer')
            const result = await response.json()
            showToast('สร้างลูกค้าใหม่สำเร็จ', 'success')

            // โหลดข้อมูลลูกค้าใหม่
            const customersRes = await fetch('/api/customers?page=1&limit=100')
            if (customersRes.ok) {
                const customersData = await customersRes.json()
                setCustomers(customersData.data)
                // เลือกลูกค้าที่เพิ่งสร้างขึ้น
                if (result.data?.id) {
                    setFormData({
                        ...formData,
                        customer_id: result.data.id,
                    })
                }
            }

            // รีเซ็ตฟอร์ม
            setNewCustomer({
                customer_fname: '',
                customer_lname: '',
                customer_phone: '',
                customer_tax_number: '',
                customer_address: '',
            })
            setIsCustomerModalOpen(false)
        } catch {
            showToast('ไม่สามารถสร้างลูกค้าได้', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {isSubmitting && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center justify-center rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                        <span className="ml-4 font-semibold text-slate-700">
                            กำลังดำเนินการ...
                        </span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    {/* <h1 className="text-2xl font-bold tracking-tight text-black">
                        ใบสั่งขาย
                    </h1> */}
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
                            sale_additional_cost: 0,
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

            {/* Status Tabs */}
            <div className="flex space-x-1 rounded-lg bg-slate-100/50 p-1">
                {[
                    { id: '', label: 'ทั้งหมด' },
                    { id: 'Pending', label: 'รอชำระเงิน' },
                    { id: 'Completed', label: 'ชำระเงินเสร็จสิ้น' },
                    { id: 'Cancelled', label: 'ยกเลิก' },
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

            {/* Filter Section */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div>
                        <input
                            type="text"
                            placeholder="ค้นหารหัสใบสั่ง, ลูกค้า, Serial, IMEI"
                            value={filterQuery}
                            onChange={(e) => {
                                setFilterQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                        />
                    </div>
                    <div>
                        <select
                            value={filterCategory}
                            onChange={(e) => {
                                setFilterCategory(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                        >
                            <option value="">ทุกหมวดหมู่</option>
                            {categories.map((c) => (
                                <option
                                    key={c.category_id}
                                    value={c.category_id}
                                >
                                    {c.category_name_th}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={filterBrand}
                            onChange={(e) => {
                                setFilterBrand(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                        >
                            <option value="">ทุกแบรนด์</option>
                            {brands.map((b) => (
                                <option key={b.brand_id} value={b.brand_id}>
                                    {b.brand_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => {
                                setFilterStartDate(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                            placeholder="วันที่เริ่มต้น"
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => {
                                setFilterEndDate(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                            placeholder="วันที่สิ้นสุด"
                        />
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={() => {
                                setFilterQuery('')
                                setFilterCategory('')
                                setFilterBrand('')
                                setFilterStartDate('')
                                setFilterEndDate('')
                                setFilterStatus('')
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:border-blue-600 focus:outline-none"
                        >
                            ล้างตัวกรอง
                        </button>
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
                    <div className="hidden grid-cols-4 rounded-lg border border-slate-200 bg-white px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-500 uppercase shadow-sm md:grid">
                        <div>รหัสใบสั่ง</div>
                        <div>ลูกค้า</div>
                        <div>จำนวน / สถานะ</div>
                        <div className="text-right">จัดการ</div>
                    </div>

                    {/* End Header Desktop */}
                    {orders.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                            <span className="text-sm text-slate-500">
                                ไม่พบข้อมูลใบสั่งขาย
                            </span>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div
                                key={order.sale_id}
                                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="grid grid-cols-1 items-center gap-4 px-6 py-5 md:grid-cols-4">
                                    <div className="text-sm font-bold text-slate-900">
                                        <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                            รหัสใบสั่ง
                                        </div>
                                        {order.sale_code}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                            ลูกค้า
                                        </div>
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
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                            จำนวน / สถานะ
                                        </div>
                                        <div className="text-sm font-bold text-slate-900">
                                            ฿
                                            {order.sale_total_amount?.toLocaleString() ||
                                                '0'}
                                        </div>
                                        <span
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
                                        </span>
                                    </div>
                                    <div className="flex justify-start gap-2 pt-2 md:justify-end md:pt-0">
                                        {order.sale_status === 'Pending' && (
                                            <button
                                                onClick={() =>
                                                    handleQRPayment(order)
                                                }
                                                className="flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                                            >
                                                <QrCodeIcon className="h-4 w-4" />
                                                QR ชำระเงิน
                                            </button>
                                        )}
                                        {order.sale_status === 'Completed' && (
                                            <button
                                                onClick={() => handleViewImages(order)}
                                                className="flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-100"
                                                title="ดูรูปภาพ"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                ดูรูปภาพ
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handlePrint(order)}
                                            className="flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-100"
                                        >
                                            <PrintIcon className="h-4 w-4" />
                                            ออกบิลลูกค้า
                                        </button>
                                        <button
                                            onClick={() => handleEdit(order)}
                                            className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                                        >
                                            <EditIcon className="h-4 w-4" />
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(order.sale_id!)
                                            }
                                            className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                        >
                                            <DeleteIcon className="h-4 w-4" />
                                            ลบ
                                        </button>
                                    </div>
                                </div>

                                {order.items && order.items.length > 0 && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                        <div className="mb-2 space-y-2 border-l-2 border-slate-200 pl-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase">
                                                รายการสินค้า:
                                            </p>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {order.items.map((item: any) => (
                                                <div
                                                    key={item.sale_item_id}
                                                    className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3"
                                                >
                                                    <div>
                                                        {item.brand_name}{' '}
                                                        {item.model_name}
                                                    </div>
                                                    <div>
                                                        {item.item_serial_number
                                                            ? `SN: ${item.item_serial_number}`
                                                            : item.item_imei
                                                              ? `IMEI: ${item.item_imei}`
                                                              : ''}
                                                    </div>
                                                    <div className="font-semibold sm:text-right md:text-left">
                                                        ฿
                                                        {Number(
                                                            item.sale_price
                                                        ).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="mt-2 w-full max-w-[200px] border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                                                รวมยอด: ฿
                                                {Number(
                                                    order.sale_total_amount
                                                ).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                แสดง{' '}
                                <span className="font-medium">
                                    {(currentPage - 1) * itemsPerPage + 1}
                                </span>{' '}
                                ถึง{' '}
                                <span className="font-medium">
                                    {Math.min(
                                        currentPage * itemsPerPage,
                                        totalItems
                                    )}
                                </span>{' '}
                                จาก{' '}
                                <span className="font-medium">
                                    {totalItems}
                                </span>{' '}
                                รายการ
                            </p>
                        </div>
                        <div>
                            <nav
                                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                aria-label="Pagination"
                            >
                                <button
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.max(1, currentPage - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                                            currentPage === i + 1
                                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                : 'text-slate-900 ring-1 ring-slate-300 ring-inset hover:bg-slate-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.min(
                                                totalPages,
                                                currentPage + 1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage === totalPages ||
                                        totalPages === 0
                                    }
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
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
            )}

            {isQROpen && selectedOrder && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <h3 className="font-bold text-slate-900">
                                QR Code ชำระเงิน
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
                                    ยอดชำระสุทธิ
                                </p>
                                <div className="text-3xl font-black tracking-tight text-blue-600">
                                    ฿
                                    {selectedOrder.sale_total_amount?.toLocaleString(
                                        'th-TH'
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-slate-400">
                                    ออเดอร์ {selectedOrder.sale_code}
                                </p>
                            </div>

                            <div className="mx-auto inline-block rounded-xl border-4 border-white bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <QRCodeCanvas
                                    value={generatePayload(
                                        localStorage.getItem(
                                            'mobistock_promptpay_id'
                                        ) || '',
                                        {
                                            amount:
                                                selectedOrder.sale_total_amount ||
                                                0,
                                        }
                                    )}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="mt-8 flex flex-col gap-3">
                                <button
                                    onClick={() =>
                                        setIsConfirmPaymentOpen(true)
                                    }
                                    className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    ชำระสำเร็จ
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

            {isConfirmPaymentOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                ยืนยันการชำระเงิน
                            </h3>
                            <button
                                onClick={() => {
                                    setIsConfirmPaymentOpen(false)
                                    setPodImages([])
                                    setPaymentBillImages([])
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="mb-6 text-sm text-slate-600">
                                กรุณาอัปโหลดหลักฐานการชำระเงิน
                                <span className="font-semibold text-red-600">
                                    {' '}
                                    2 ประเภท
                                </span>{' '}
                                ก่อนยืนยัน
                            </p>

                            {/* POD Section */}
                            <div className="mb-6">
                                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                                    หลักฐานการโอนเงิน (POD)
                                    <span className="ml-2 text-xs font-normal text-slate-500">
                                        {podImages.filter((i) => !i.uploading).length >= 1 ? '✓ อัปโหลดแล้ว' : 'จำเป็นต้องอัปโหลด 1 รูป'}
                                    </span>
                                </h4>
                                <label
                                    htmlFor="pod-images"
                                    className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors ${
                                        podImages.filter((i) => !i.uploading).length >= 1
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
                                    <span className="text-xs">คลิกเพื่ออัปโหลดรูปภาพ POD</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        id="pod-images"
                                        onChange={(e) => handleConfirmImageUpload(e, 'pod')}
                                    />
                                </label>

                                {/* POD Images Grid */}
                                {podImages.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {podImages.map((img, idx) => (
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
                                                        <Image
                                                            src={img.url}
                                                            alt={`POD ${idx + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPodImages(
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

                            {/* Payment Bill Section */}
                            <div className="mb-6">
                                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                                    ใบเสร็จรับเงิน
                                    <span className="ml-2 text-xs font-normal text-slate-500">
                                        {paymentBillImages.filter((i) => !i.uploading).length >= 1 ? '✓ อัปโหลดแล้ว' : 'จำเป็นต้องอัปโหลด 1 รูป'}
                                    </span>
                                </h4>
                                <label
                                    htmlFor="payment-bill-images"
                                    className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors ${
                                        paymentBillImages.filter((i) => !i.uploading).length >= 1
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
                                    <span className="text-xs">คลิกเพื่ออัปโหลดรูปภาพใบเสร็จ</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        id="payment-bill-images"
                                        onChange={(e) => handleConfirmImageUpload(e, 'paymentBill')}
                                    />
                                </label>

                                {/* Payment Bill Images Grid */}
                                {paymentBillImages.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {paymentBillImages.map((img, idx) => (
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
                                                        <Image
                                                            src={img.url}
                                                            alt={`ใบเสร็จ ${idx + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPaymentBillImages(
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
                                            podImages.filter((i) => !i.uploading).length >= 1 &&
                                            paymentBillImages.filter((i) => !i.uploading).length >= 1
                                                ? 'text-green-600'
                                                : 'text-orange-500'
                                        }`}
                                    >
                                        {podImages.filter((i) => !i.uploading).length >= 1 &&
                                        paymentBillImages.filter((i) => !i.uploading).length >= 1
                                            ? '✓ พร้อมยืนยัน'
                                            : '⏳ รอการอัปโหลด'}
                                    </span>
                                </div>
                                <div className="mt-2 space-y-1 text-xs text-slate-500">
                                    <div className="flex justify-between">
                                        <span>• หลักฐานการโอนเงิน (POD):</span>
                                        <span
                                            className={
                                                podImages.filter((i) => !i.uploading).length >= 1
                                                    ? 'text-green-600'
                                                    : 'text-slate-400'
                                            }
                                        >
                                            {podImages.filter((i) => !i.uploading).length} / 1
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>• ใบเสร็จรับเงิน:</span>
                                        <span
                                            className={
                                                paymentBillImages.filter((i) => !i.uploading).length >= 1
                                                    ? 'text-green-600'
                                                    : 'text-slate-400'
                                            }
                                        >
                                            {paymentBillImages.filter((i) => !i.uploading).length} / 1
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsConfirmPaymentOpen(false)
                                        setPodImages([])
                                        setPaymentBillImages([])
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    disabled={
                                        isSubmitting ||
                                        podImages.filter((i) => !i.uploading).length < 1 ||
                                        paymentBillImages.filter((i) => !i.uploading).length < 1
                                    }
                                    className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {isSubmitting
                                        ? 'กำลังยืนยัน...'
                                        : 'ยืนยันชำระเงิน'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {selectedOrder
                                    ? 'แก้ไขใบสั่งขาย'
                                    : 'ใบสั่งขายใหม่'}
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
                                <div className="grid grid-cols-2 gap-4">
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
                                    
                                    {selectedOrder && (
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
                                                        sale_status:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                            >
                                                <option value="Pending">
                                                    รอชำระเงิน
                                                </option>
                                                <option value="Completed">
                                                    ชำระเงินเสร็จสิ้น
                                                </option>
                                                <option value="Cancelled">
                                                    ยกเลิก
                                                </option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="col-span-2 border-t border-slate-200 pt-4">
                                        <h3 className="mb-4 text-sm font-bold text-slate-900">
                                            รายการสินค้า
                                        </h3>

                                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                            {/* คอลัมน์ซ้าย: ค้นหา และ รายการที่มี */}
                                            <div>
                                                <div className="mb-4">
                                                    <input
                                                        type="text"
                                                        placeholder="ค้นหา Serial Number, IMEI... (พิมพ์เพื่อค้นหา)"
                                                        value={searchItemQuery}
                                                        onChange={(e) =>
                                                            setSearchItemQuery(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                                    />
                                                </div>

                                                {availableItems.length > 0 && (
                                                    <div className="mb-4 max-h-[400px] overflow-auto rounded-md border border-slate-200">
                                                        <table className="relative w-full text-left text-sm">
                                                            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-sm">
                                                                <tr>
                                                                    <th className="px-3 py-2 font-bold text-slate-600 uppercase">
                                                                        ชื่อเครื่อง
                                                                    </th>
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
                                                                {availableItems.map(
                                                                    (item) => (
                                                                        <tr
                                                                            key={
                                                                                item.item_id
                                                                            }
                                                                            className="hover:bg-slate-50"
                                                                        >
                                                                            <td className="px-3 py-2">
                                                                                <div className="font-semibold text-slate-900">
                                                                                    {(
                                                                                        item as any
                                                                                    )
                                                                                        .model_name ||
                                                                                        '-'}
                                                                                </div>
                                                                                <div className="text-xs text-slate-500">
                                                                                    {(
                                                                                        item as any
                                                                                    )
                                                                                        .brand_name ||
                                                                                        '-'}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-2 font-mono text-xs">
                                                                                {
                                                                                    item.item_serial_number
                                                                                }
                                                                            </td>
                                                                            <td className="px-3 py-2 font-mono text-xs">
                                                                                {
                                                                                    item.item_imei
                                                                                }
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
                                                                                                    sale_price: 100,
                                                                                                    item_serial_number:
                                                                                                        item.item_serial_number,
                                                                                                    item_imei:
                                                                                                        item.item_imei,
                                                                                                    model_name:
                                                                                                        (
                                                                                                            item as any
                                                                                                        )
                                                                                                            .model_name,
                                                                                                    brand_name:
                                                                                                        (
                                                                                                            item as any
                                                                                                        )
                                                                                                            .brand_name,
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
                                                                                                    ) +
                                                                                                    Number(
                                                                                                        formData.sale_additional_cost ||
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
                                                                                    +
                                                                                    เพิ่ม
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>

                                            {/* คอลัมน์ขวา: สินค้าที่เลือก และ ยอดรวม */}
                                            <div className="flex flex-col">
                                                <div className="mb-4 h-[480px] flex-1 overflow-auto rounded-md border border-slate-200">
                                                    <table className="relative w-full text-left text-sm">
                                                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-sm">
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
                                                            {formData.items.map(
                                                                (item, idx) => (
                                                                    <tr
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="hover:bg-slate-50"
                                                                    >
                                                                        <td className="px-3 py-2">
                                                                            <div className="font-semibold text-slate-900">
                                                                                {item.model_name ||
                                                                                    '-'}
                                                                            </div>
                                                                            <div className="font-mono text-xs text-slate-500">
                                                                                SN:{' '}
                                                                                {item.item_serial_number ||
                                                                                    'N/A'}
                                                                            </div>
                                                                            <div className="font-mono text-xs text-slate-500">
                                                                                IMEI:{' '}
                                                                                {item.item_imei ||
                                                                                    'N/A'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <input
                                                                                type="number"
                                                                                step="100"
                                                                                value={
                                                                                    item.sale_price
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) => {
                                                                                    const updatedItems =
                                                                                        [
                                                                                            ...formData.items,
                                                                                        ]
                                                                                    updatedItems[
                                                                                        idx
                                                                                    ].sale_price =
                                                                                        Number(
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    setFormData(
                                                                                        {
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
                                                                                                ) +
                                                                                                Number(
                                                                                                    formData.sale_additional_cost ||
                                                                                                        0
                                                                                                ),
                                                                                        }
                                                                                    )
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
                                                                                    setFormData(
                                                                                        {
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
                                                                                                ) +
                                                                                                Number(
                                                                                                    formData.sale_additional_cost ||
                                                                                                        0
                                                                                                ),
                                                                                        }
                                                                                    )
                                                                                }}
                                                                                className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                                                                            >
                                                                                <CloseIcon />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                            {formData.items
                                                                .length ===
                                                                0 && (
                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className="px-3 py-8 text-center font-medium text-slate-400"
                                                                    >
                                                                        ยังไม่มีสินค้าในใบสั่งขาย
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                        {formData.items.length >
                                                            0 && (
                                                            <tfoot className="sticky bottom-0 z-10 border-t-2 border-slate-100 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            1
                                                                        }
                                                                        className="px-3 py-4 text-right font-bold text-slate-600"
                                                                    >
                                                                        ค่าใช้จ่ายเพิ่มเติม
                                                                        (฿)
                                                                    </td>
                                                                    <td
                                                                        colSpan={
                                                                            2
                                                                        }
                                                                        className="px-3 py-3 text-right"
                                                                    >
                                                                        <input
                                                                            type="number"
                                                                            value={
                                                                                formData.sale_additional_cost ||
                                                                                0
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) => {
                                                                                const newCost =
                                                                                    Number(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    ) ||
                                                                                    0
                                                                                setFormData(
                                                                                    {
                                                                                        ...formData,
                                                                                        sale_additional_cost:
                                                                                            newCost,
                                                                                        sale_total_amount:
                                                                                            formData.items.reduce(
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
                                                                                            ) +
                                                                                            newCost,
                                                                                    }
                                                                                )
                                                                            }}
                                                                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-right focus:border-blue-600 focus:outline-none"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            1
                                                                        }
                                                                        className="px-3 py-3 text-right font-bold text-slate-800"
                                                                    >
                                                                        ยอดรวมทั้งสิ้น
                                                                        (฿)
                                                                    </td>
                                                                    <td
                                                                        colSpan={
                                                                            2
                                                                        }
                                                                        className="px-3 py-3 text-right text-lg text-slate-900"
                                                                    >
                                                                        ฿
                                                                        {formData.sale_total_amount.toLocaleString(
                                                                            'th-TH'
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        )}
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
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
                                    เอกสารนี้สร้างขึ้นอย่างเป็นอิเล็กทรอนิกส์จากระบบจัดเก็บสินค้า{' '}
                                    {storeName}
                                </p>
                                <p>{new Date().toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                </>
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
                                    value={newCustomer.customer_fname}
                                    onChange={(e) =>
                                        setNewCustomer({
                                            ...newCustomer,
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
                                    value={newCustomer.customer_lname}
                                    onChange={(e) =>
                                        setNewCustomer({
                                            ...newCustomer,
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
                                    value={newCustomer.customer_phone}
                                    onChange={(e) =>
                                        setNewCustomer({
                                            ...newCustomer,
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
                                    required
                                    value={newCustomer.customer_tax_number}
                                    onChange={(e) =>
                                        setNewCustomer({
                                            ...newCustomer,
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
                                    required
                                    rows={3}
                                    value={newCustomer.customer_address}
                                    onChange={(e) =>
                                        setNewCustomer({
                                            ...newCustomer,
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
                                        setNewCustomer({
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
        </div>
    )
}
