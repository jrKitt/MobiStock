'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import {
    RepairOrder,
    Customer,
    ProductItem,
    SparePart,
    RepairOrderPart,
    ProductModel,
} from '@/types/api'
import {
    CloseIcon,
    DeleteIcon,
    EditIcon,
    PrintIcon,
    QrCodeIcon,
} from '@/lib/icons'
import generatePayload from 'promptpay-qr'
import { QRCodeCanvas } from 'qrcode.react'
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

    // Complete modal (in_progress → waiting_payment): Image Upload
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
    const [isQROpen, setIsQROpen] = useState(false)
    const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [completeRepair, setCompleteRepair] = useState<
        (RepairOrder & { parts?: RepairOrderPart[] }) | null
    >(null)
    const [completeImages, setCompleteImages] = useState<
        { url: string; caption: string; uploading: boolean }[]
    >([])
    const [confirmImages, setConfirmImages] = useState<
        { url: string; uploading: boolean }[]
    >([])

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

    const [isPartsSearchOpen, setIsPartsSearchOpen] = useState(false)
    const [partSearchQuery, setPartSearchQuery] = useState('')
    const findSparePartById = (partId: number) =>
        spareParts.find((part) => part.part_id === partId)

    // Auto-focus on search input when modal opens
    // (Optional, can be added later if needed)
    // Search and Filter States
    const [filterQuery, setFilterQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterStartDate, setFilterStartDate] = useState('')
    const [filterEndDate, setFilterEndDate] = useState('')
    const [partsTechnicianNote, setPartsTechnicianNote] = useState('')

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
        setPartsTechnicianNote(repair.repair_technician_note || '')
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

        const selectedPart = spareParts.find(
            (p) => p.part_id === partFormData.part_id
        )
        if (selectedPart && selectedPart.part_quantity != null) {
            if (
                partFormData.repair_part_quantity > selectedPart.part_quantity
            ) {
                showToast(
                    `มีอะไหล่คงเหลือเพียง ${selectedPart.part_quantity} ชิ้น`,
                    'error'
                )
                return
            }
        }

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

    const handleUpdateTechnicianNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPartsRepair?.repair_id) return
        try {
            const response = await fetch(
                `/api/repair-orders/${selectedPartsRepair.repair_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...selectedPartsRepair,
                        repair_technician_note: partsTechnicianNote,
                    }),
                }
            )
            if (!response.ok) throw new Error('Failed to update note')
            showToast('บันทึกหมายเหตุช่างซ่อมสำเร็จ', 'success')
            fetchData()
        } catch {
            showToast('ไม่สามารถบันทึกหมายเหตุได้', 'error')
        }
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

    const handleOpenQRModal = (
        repair: RepairOrder & { parts?: RepairOrderPart[] }
    ) => {
        const promptpayId = localStorage.getItem('mobistock_promptpay_id')
        if (!promptpayId) {
            showToast('กรุณาตั้งค่ารหัสพร้อมเพย์ที่หน้าระบบก่อน', 'warning')
            return
        }
        setCompleteRepair(repair)
        setIsQROpen(true)
    }

    const handleOpenCompleteModal = (
        repair: RepairOrder & { parts?: RepairOrderPart[] }
    ) => {
        setCompleteRepair(repair)
        setCompleteImages([])
        setIsCompleteModalOpen(true)
    }

    const handleCompleteImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        const placeholders = files.map(() => ({
            url: '',
            caption: '',
            uploading: true,
        }))
        setCompleteImages((prev) => [...prev, ...placeholders])
        const startIndex = completeImages.length

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
                    setCompleteImages((prev) => {
                        const updated = [...prev]
                        if (updated[startIndex + i]) {
                            updated[startIndex + i] = {
                                url: data.url,
                                caption: '',
                                uploading: false,
                            }
                        }
                        return updated
                    })
                } else {
                    setCompleteImages((prev) =>
                        prev.filter((_, idx) => idx !== startIndex + i)
                    )
                    showToast('อัปโหลดรูปภาพไม่สำเร็จ', 'error')
                }
            })
        )
        e.target.value = ''
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

    const handleConfirmComplete = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!completeRepair?.repair_id) return
        if (completeImages.filter((i) => !i.uploading).length < 2) {
            showToast('ต้องอัปโหลดรูปภาพอย่างน้อย 2 รูป', 'error')
            return
        }

        try {
            const response = await fetch(
                `/api/repair-orders/${completeRepair.repair_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...completeRepair,
                        repair_status: 'waiting_payment',
                        repair_date_completed: new Date()
                            .toISOString()
                            .split('T')[0],
                    }),
                }
            )
            if (!response.ok) throw new Error('Failed to update status')

            // Upload completion images
            await Promise.all(
                completeImages
                    .filter((img) => !img.uploading)
                    .map((img) =>
                        fetch('/api/repair-order-images', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                repair_id: completeRepair.repair_id,
                                image_url: img.url,
                                image_caption: img.caption || null,
                                image_type: 'completed',
                            }),
                        })
                    )
            )

            showToast('ซ่อมเสร็จสิ้น รอชำระเงิน', 'success')
            setIsCompleteModalOpen(false)
            setCompleteRepair(null)
            fetchData()
        } catch {
            showToast('อัปเดตสถานะไม่สำเร็จ', 'error')
        }
    }

    const confirmPayment = async () => {
        if (!completeRepair?.repair_id) return
        const readyImages = confirmImages.filter((img) => !img.uploading)

        if (readyImages.length < 1) {
            showToast('กรุณาอัปโหลดรูปภาพหลักฐานการโอนและส่งมอบ อย่างน้อย 1 รูป', 'warning')
            return
        }

        try {
            setIsSubmitting(true)
            // Save confirmation images first
            await Promise.all(
                readyImages.map((img: any) =>
                    fetch('/api/repair-order-images', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            repair_id: completeRepair.repair_id,
                            image_url: img.url,
                            image_caption: 'หลักฐานการโอนและส่งมอบ',
                            image_type: 'completed',
                        }),
                    })
                )
            )

            // Then mark repair as completed
            const res = await fetch(
                `/api/repair-orders/${completeRepair.repair_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...completeRepair,
                        repair_status: 'completed',
                        update_by: 'staff', // You might want to get this from session
                    }),
                }
            )
            if (res.ok) {
                showToast('ชำระเงินสำเร็จ', 'success')
                fetchData()
                setIsConfirmPaymentOpen(false)
                setIsQROpen(false)
                setConfirmImages([])
                setCompleteRepair(null)
            } else {
                showToast('ชำระเงินไม่สำเร็จ กรุณาลองใหม่', 'error')
            }
        } catch {
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleMarkCompleted = async (repair: RepairOrder) => {
        if (!confirm('ยืนยันรับเงินและปิดงานซ่อม?')) return
        try {
            const response = await fetch(
                `/api/repair-orders/${repair.repair_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...repair,
                        repair_status: 'completed',
                    }),
                }
            )
            if (!response.ok) throw new Error('Failed to update')
            showToast('ยืนยันรับเงินสำเร็จ', 'success')
            setIsQROpen(false)
            fetchData()
        } catch {
            showToast('ไม่สามารถอัปเดตสถานะได้', 'error')
        }
    }

    const handleStartRepair = async (repair: RepairOrder) => {
        if (!confirm('ยืนยันการเริ่มซ่อม?')) return
        try {
            const response = await fetch(
                `/api/repair-orders/${repair.repair_id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...repair,
                        repair_status: 'in_progress',
                    }),
                }
            )
            if (!response.ok) throw new Error('Failed')
            showToast('เริ่มซ่อมแล้ว', 'success')
            fetchData()
        } catch {
            showToast('อัปเดตสถานะไม่สำเร็จ', 'error')
        }
    }

    const getStatusLabel = (status: string) => {
        const statusMap: { [key: string]: string } = {
            received: 'รับเรื่อง / รอซ่อม',
            in_progress: 'กำลังซ่อม',
            waiting_payment: 'รอชำระเงิน',
            completed: 'ซ่อมเสร็จ / รับเครื่องแล้ว',
            cancelled: 'ยกเลิก',
        }
        return statusMap[status] || status
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    {/* <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        คำขอซ่อม
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        จัดการคำขอซ่อมสินค้า และเพิ่มอะไหล่
                    </p> */}
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
                    { id: 'waiting_payment', label: 'รอชำระเงิน' },
                    { id: 'completed', label: 'ซ่อมเสร็จ / รับเครื่องแล้ว' },
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
                <div className="space-y-4">
                    {/* Header Desktop */}
                    <div className="hidden grid-cols-6 rounded-lg border border-slate-200 bg-white px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-500 uppercase shadow-sm md:grid">
                        <div className="col-span-1">รหัสซ่อม / วันที่รับ</div>
                        <div className="col-span-1">ลูกค้า</div>
                        <div className="col-span-1">สินค้า (S/N)</div>
                        <div className="col-span-1">ปัญหา</div>
                        <div className="col-span-1">สถานะ</div>
                        <div className="col-span-1 text-right">จัดการ</div>
                    </div>

                    {repairs.map((repair: RepairOrder) => (
                        <div
                            key={repair.repair_id}
                            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="grid grid-cols-1 items-center gap-4 px-6 py-5 md:grid-cols-6">
                                <div className="col-span-1">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                        รหัสซ่อม / วันที่รับ
                                    </div>
                                    <div className="font-mono text-sm font-semibold text-slate-900">
                                        {repair.repair_code ||
                                            `#${repair.repair_id}`}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(
                                            repair.repair_date_received
                                        ).toLocaleDateString('th-TH')}
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                        ลูกค้า
                                    </div>
                                    <div className="text-sm font-medium text-slate-900">
                                        {repair.customer_fname || ''}{' '}
                                        {repair.customer_lname || ''}
                                    </div>
                                    {repair.customer_phone && (
                                        <div className="text-xs text-slate-500">
                                            {repair.customer_phone}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-1">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                        สินค้า (S/N)
                                    </div>
                                    <div className="text-sm font-medium text-slate-900">
                                        {repair.model_name || 'ไม่ระบุรุ่น'}
                                    </div>
                                    <div className="font-mono text-xs text-slate-500">
                                        {repair.item_serial_number ||
                                            repair.item_imei ||
                                            'ไม่ระบุ S/N'}
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                        ปัญหา
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        {repair.repair_problem_desc.length > 30
                                            ? `${repair.repair_problem_desc.substring(0, 30)}...`
                                            : repair.repair_problem_desc}
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase md:hidden">
                                        สถานะ
                                    </div>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                                            repair.repair_status === 'completed'
                                                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                                                : repair.repair_status ===
                                                    'cancelled'
                                                  ? 'bg-red-50 text-red-700 ring-1 ring-red-600/10 ring-inset'
                                                  : repair.repair_status ===
                                                      'in_progress'
                                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10 ring-inset'
                                                    : repair.repair_status ===
                                                        'waiting_payment'
                                                      ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20 ring-inset'
                                                      : 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 ring-inset'
                                        }`}
                                    >
                                        {getStatusLabel(repair.repair_status)}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-start gap-2 pt-2 md:justify-end md:pt-0">
                                    {repair.repair_status === 'received' && (
                                        <button
                                            onClick={() =>
                                                handleStartRepair(repair)
                                            }
                                            className="flex items-center gap-1 rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 hover:text-orange-800"
                                        >
                                            <EditIcon className="h-4 w-4" />
                                            เริ่มซ่อม
                                        </button>
                                    )}
                                    {repair.repair_status === 'in_progress' && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleOpenCompleteModal(
                                                        repair
                                                    )
                                                }
                                                className="flex items-center gap-1 rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-100 hover:text-yellow-800"
                                            >
                                                <QrCodeIcon className="h-4 w-4" />
                                                ซ่อมเสร็จสิ้น
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleOpenParts(repair)
                                                }
                                                title="จัดการอะไหล่"
                                                className="flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 hover:text-purple-800"
                                            >
                                                <EditIcon className="h-4 w-4" />
                                                อะไหล่
                                            </button>
                                        </>
                                    )}
                                    {repair.repair_status ===
                                        'waiting_payment' && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleOpenQRModal(repair)
                                                }
                                                className="flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 hover:text-green-800"
                                            >
                                                <QrCodeIcon className="h-4 w-4" />
                                                ยืนยันรับเงิน
                                            </button>
                                        </>
                                    )}
                                    {repair.repair_status === 'completed' && (
                                        <button
                                            onClick={() =>
                                                handleOpenParts(repair)
                                            }
                                            className="flex items-center gap-1 rounded bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                                        >
                                            <PrintIcon className="h-4 w-4" />
                                            ดูรายละเอียด
                                        </button>
                                    )}
                                    {(repair.repair_status === 'received' ||
                                        repair.repair_status ===
                                            'in_progress') && (
                                        <button
                                            onClick={() => {
                                                setSelectedRepair(repair)
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
                                                            .split('T')[0] ||
                                                        '',
                                                    repair_date_completed:
                                                        repair.repair_date_completed
                                                            ?.toString()
                                                            .split('T')[0] ||
                                                        '',
                                                    repair_labor_cost:
                                                        repair.repair_labor_cost ||
                                                        0,
                                                    repair_status:
                                                        repair.repair_status,
                                                    customer_id:
                                                        repair.customer_id,
                                                    item_id: repair.item_id,
                                                })
                                                setIsModalOpen(true)
                                            }}
                                            className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                                        >
                                            <EditIcon className="h-4 w-4" />
                                            แก้ไข
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

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
                                    ? `แก้ไขคำขอซ่อม ${selectedRepair.repair_code || '#' + selectedRepair.repair_id}`
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
                                                disabled={!!selectedRepair}
                                                value={formData.customer_id}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer_id: parseInt(
                                                            e.target.value
                                                        ),
                                                    })
                                                }
                                                className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
                                            {!selectedRepair && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsCustomerModalOpen(
                                                            true
                                                        )
                                                    }
                                                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-green-700"
                                                    title="เพิ่มลูกค้าใหม่"
                                                >
                                                    + ลูกค้า
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
                                        <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            สินค้า *
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                required
                                                disabled={!!selectedRepair}
                                                value={formData.item_id}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        item_id: parseInt(
                                                            e.target.value
                                                        ),
                                                    })
                                                }
                                                className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
                                            {!selectedRepair && (
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
                                            )}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    บันทึกการซ่อม{' '}
                                    {workRepair.repair_code ||
                                        '#' + workRepair.repair_id}
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {workRepair.model_name || 'ไม่ระบุรุ่น'}{' '}
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

                        <div className="flex min-h-0 flex-1 flex-col">
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
                                            value={
                                                workFormData.repair_labor_cost
                                            }
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
                                        className="mb-4 grid grid-cols-3 gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4"
                                    >
                                        <div className="relative">
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                เลือกอะไหล่ *
                                            </label>
                                            <div
                                                onClick={() =>
                                                    setIsPartsSearchOpen(
                                                        !isPartsSearchOpen
                                                    )
                                                }
                                                className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white px-2 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                            >
                                                {partFormData.part_id === 0
                                                    ? 'เลือกอะไหล่'
                                                    : (() => {
                                                          const selectedPart =
                                                              findSparePartById(
                                                                  partFormData.part_id
                                                              )
                                                          return (
                                                               <div className="flex items-center gap-2 pr-6">
                                                                   {selectedPart?.image_url ? (
                                                                       /* eslint-disable-next-line @next/next/no-img-element */
                                                                       <img
                                                                          src={
                                                                              selectedPart.image_url
                                                                          }
                                                                          alt={
                                                                              selectedPart.part_name
                                                                          }
                                                                           className="h-6 w-6 rounded object-cover"
                                                                       />
                                                                   ) : (
                                                                       <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[8px] font-medium text-slate-400">
                                                                           N/A
                                                                       </div>
                                                                   )}
                                                                   <span className="truncate">
                                                                       {selectedPart?.part_name}
                                                                   </span>
                                                               </div>
                                                          )
                                                      })()}
                                                <div className="pointer-events-none absolute top-2.5 right-2 text-slate-400">
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
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                            {isPartsSearchOpen && (
                                                <div className="ring-opacity-5 absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black">
                                                    <div className="sticky top-0 bg-white px-2 py-1">
                                                        <input
                                                            type="text"
                                                            placeholder="ค้นหาอะไหล่..."
                                                            value={
                                                                partSearchQuery
                                                            }
                                                            onChange={(e) =>
                                                                setPartSearchQuery(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div
                                                        className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setPartFormData({
                                                                ...partFormData,
                                                                part_id: 0,
                                                            })
                                                            setIsPartsSearchOpen(
                                                                false
                                                            )
                                                            setPartSearchQuery(
                                                                ''
                                                            )
                                                        }}
                                                    >
                                                        เลือกอะไหล่ (ล้าง)
                                                    </div>
                                                    {spareParts
                                                        .filter((p) =>
                                                            p.part_name
                                                                .toLowerCase()
                                                                .includes(
                                                                    partSearchQuery.toLowerCase()
                                                                )
                                                        )
                                                        .map((p) => {
                                                            const isOutOfStock =
                                                                (p.part_quantity ??
                                                                    1) === 0
                                                            return (
                                                                <div
                                                                    key={
                                                                        p.part_id
                                                                    }
                                                                    className={`cursor-pointer px-4 py-2 text-sm ${
                                                                        isOutOfStock
                                                                            ? 'text-slate-400 opacity-50'
                                                                            : 'text-slate-700 hover:bg-blue-50'
                                                                    } ${
                                                                        partFormData.part_id ===
                                                                        p.part_id
                                                                            ? 'bg-blue-50 font-bold text-blue-700'
                                                                            : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (
                                                                            !isOutOfStock
                                                                        ) {
                                                                            setPartFormData(
                                                                                {
                                                                                    ...partFormData,
                                                                                    part_id:
                                                                                        p.part_id!,
                                                                                }
                                                                            )
                                                                            setIsPartsSearchOpen(
                                                                                false
                                                                            )
                                                                            setPartSearchQuery(
                                                                                ''
                                                                            )
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        {p.image_url ? (
                                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                                            <img
                                                                                src={
                                                                                    p.image_url
                                                                                }
                                                                                alt={
                                                                                    p.part_name
                                                                                }
                                                                                className="h-6 w-6 rounded object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[8px] font-medium text-slate-400">
                                                                                N/A
                                                                            </div>
                                                                        )}
                                                                        <span>
                                                                            {
                                                                                p.part_name
                                                                            }
                                                                            {p.part_quantity !=
                                                                            null
                                                                                ? p.part_quantity ===
                                                                                  0
                                                                                    ? ' (หมด)'
                                                                                    : ` (${p.part_quantity})`
                                                                                : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                จำนวน
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max={
                                                    spareParts.find(
                                                        (p) =>
                                                            p.part_id ===
                                                            partFormData.part_id
                                                    )?.part_quantity ??
                                                    undefined
                                                }
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
                                                className="w-full rounded-md bg-blue-600 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
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
                                                            ราคาต่อหน่วย
                                                        </th>
                                                        <th className="px-3 py-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                            รวม
                                                        </th>
                                                        <th className="px-3 py-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
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
                                                            <td className="px-3 py-2 text-slate-700">
                                                                {findSparePartById(
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
                                                                    className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                                                >
                                                                    <DeleteIcon className="h-4 w-4" />
                                                                    ลบ
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                                                        <td
                                                            colSpan={2}
                                                            className="px-3 py-2 text-right text-slate-600"
                                                        >
                                                            รวมอะไหล่:
                                                        </td>
                                                        <td
                                                            colSpan={3}
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
                        </div>

                        <div className="flex shrink-0 justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-8 py-4">
                            <button
                                type="button"
                                onClick={() => setIsWorkModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                form="work-form"
                                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                บันทึก → เริ่มซ่อม
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Spare Parts Management Modal */}
            {isPartsModalOpen && selectedPartsRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                จัดการอะไหล่{' '}
                                {selectedPartsRepair.repair_code ||
                                    '#' + selectedPartsRepair.repair_id}
                            </h2>
                            <button
                                onClick={() => setIsPartsModalOpen(false)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 overflow-y-auto p-8 pt-6">
                                {/* Add Part Form */}
                                <form
                                    onSubmit={handleAddPart}
                                    className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <h3 className="mb-4 text-sm font-bold text-slate-900">
                                        เพิ่มอะไหล่
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="relative">
                                            <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                                เลือกอะไหล่ *
                                            </label>
                                            <div
                                                onClick={() =>
                                                    setIsPartsSearchOpen(
                                                        !isPartsSearchOpen
                                                    )
                                                }
                                                className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                            >
                                                {partFormData.part_id === 0
                                                    ? 'เลือกอะไหล่'
                                                    : spareParts.find(
                                                          (p) =>
                                                              p.part_id ===
                                                              partFormData.part_id
                                                      )?.part_name}
                                                <div className="pointer-events-none absolute top-[32px] right-4 text-slate-400">
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
                                                            d="M19 9l-7 7-7-7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                            {isPartsSearchOpen && (
                                                <div className="ring-opacity-5 absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black">
                                                    <div className="sticky top-0 bg-white px-2 py-1">
                                                        <input
                                                            type="text"
                                                            placeholder="ค้นหาอะไหล่..."
                                                            value={
                                                                partSearchQuery
                                                            }
                                                            onChange={(e) =>
                                                                setPartSearchQuery(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div
                                                        className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                        onClick={() => {
                                                            setPartFormData({
                                                                ...partFormData,
                                                                part_id: 0,
                                                            })
                                                            setIsPartsSearchOpen(
                                                                false
                                                            )
                                                            setPartSearchQuery(
                                                                ''
                                                            )
                                                        }}
                                                    >
                                                        เลือกอะไหล่ (ล้าง)
                                                    </div>
                                                    {spareParts
                                                        .filter((p) =>
                                                            p.part_name
                                                                .toLowerCase()
                                                                .includes(
                                                                    partSearchQuery.toLowerCase()
                                                                )
                                                        )
                                                        .map((p) => {
                                                            const isOutOfStock =
                                                                (p.part_quantity ??
                                                                    1) === 0
                                                            return (
                                                                <div
                                                                    key={
                                                                        p.part_id
                                                                    }
                                                                    className={`cursor-pointer px-4 py-2 text-sm ${
                                                                        isOutOfStock
                                                                            ? 'text-slate-400 opacity-50'
                                                                            : 'text-slate-700 hover:bg-slate-100'
                                                                    } ${
                                                                        partFormData.part_id ===
                                                                        p.part_id
                                                                            ? 'bg-slate-100 font-bold text-slate-900'
                                                                            : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (
                                                                            !isOutOfStock
                                                                        ) {
                                                                            setPartFormData(
                                                                                {
                                                                                    ...partFormData,
                                                                                    part_id:
                                                                                        p.part_id!,
                                                                                }
                                                                            )
                                                                            setIsPartsSearchOpen(
                                                                                false
                                                                            )
                                                                            setPartSearchQuery(
                                                                                ''
                                                                            )
                                                                        }
                                                                    }}
                                                                >
                                                                    {
                                                                        p.part_name
                                                                    }
                                                                    {p.part_quantity !=
                                                                    null
                                                                        ? p.part_quantity ===
                                                                          0
                                                                            ? ' (หมด)'
                                                                            : ` (${p.part_quantity})`
                                                                        : ''}
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                                จำนวน
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max={
                                                    spareParts.find(
                                                        (p) =>
                                                            p.part_id ===
                                                            partFormData.part_id
                                                    )?.part_quantity ??
                                                    undefined
                                                }
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
                                    </div>
                                    <button
                                        type="submit"
                                        className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        + เพิ่มอะไหล่
                                    </button>
                                </form>

                                {/* Technician Note Section */}
                                <form
                                    onSubmit={handleUpdateTechnicianNote}
                                    className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <h3 className="mb-4 text-sm font-bold text-slate-900">
                                        บันทึกหมายเหตุช่างซ่อม
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            rows={2}
                                            value={partsTechnicianNote}
                                            onChange={(e) =>
                                                setPartsTechnicianNote(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="หมายเหตุหรือรายละเอียดเพิ่มเติมเกี่ยวกับการซ่อม..."
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                                            >
                                                บันทึกหมายเหตุ
                                            </button>
                                        </div>
                                    </div>
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
                                                    {repairParts.map((part) => {
                                                        const sparePart =
                                                            findSparePartById(
                                                                part.part_id
                                                            )
                                                        return (
                                                            <tr
                                                                key={`${part.repair_id}-${part.part_id}`}
                                                                className="hover:bg-slate-50/50"
                                                            >
                                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                                    <div className="flex items-center gap-2">
                                                                        {sparePart?.image_url ? (
                                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                                            <img
                                                                                src={
                                                                                    sparePart.image_url
                                                                                }
                                                                                alt={
                                                                                    sparePart.part_name
                                                                                }
                                                                                className="h-6 w-6 rounded-full border border-slate-200 bg-white object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[8px] font-medium text-slate-400">
                                                                                N/A
                                                                            </div>
                                                                        )}
                                                                        <span>
                                                                            {sparePart?.part_name ||
                                                                                'ไม่ระบุ'}
                                                                        </span>
                                                                    </div>
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
                                                                    className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                                                >
                                                                    <DeleteIcon className="h-4 w-4" />
                                                                    ลบ
                                                                </button>
                                                            </td>
                                                            </tr>
                                                        )
                                                    })}
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
                            </div>
                            <div className="flex shrink-0 justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-8 py-4">
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
                </div>
            )}

            {/* Customer Creation Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-md flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                เพิ่มลูกค้าใหม่
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsCustomerModalOpen(false)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <form
                            onSubmit={handleCreateCustomer}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="space-y-4 overflow-y-auto p-8 pt-6">
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
                                                customer_tax_number:
                                                    e.target.value,
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
                                            newCustomerData.customer_address ||
                                            ''
                                        }
                                        onChange={(e) =>
                                            setNewCustomerData({
                                                ...newCustomerData,
                                                customer_address:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex shrink-0 justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-8 py-4">
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
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-md flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                เพิ่มสินค้าใหม่
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsItemModalOpen(false)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <form
                            onSubmit={handleCreateItem}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="space-y-4 overflow-y-auto p-8 pt-6">
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
                                                item_serial_number:
                                                    e.target.value,
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
                                                model_id: parseInt(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                        className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
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
                                </div>
                            </div>
                            <div className="flex shrink-0 justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-8 py-4">
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
            {/* QR Payment Modal */}
            {isQROpen && completeRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 font-sans text-black backdrop-blur-sm sm:p-6">
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
                                    {(() => {
                                        const repairParts =
                                            completeRepair.parts || []
                                        const partsTotal = repairParts.reduce(
                                            (
                                                acc: number,
                                                item: RepairOrderPart
                                            ) =>
                                                acc +
                                                item.repair_part_unit_price *
                                                    item.repair_part_quantity,
                                            0
                                        )
                                        const total =
                                            Number(
                                                completeRepair.repair_labor_cost
                                            ) + partsTotal
                                        return total.toLocaleString('th-TH')
                                    })()}
                                </div>
                                <p className="mt-2 text-xs text-slate-400">
                                    ออเดอร์ {completeRepair.repair_code}
                                </p>
                            </div>

                            <div className="mx-auto inline-block rounded-xl border-4 border-white bg-white p-4 shadow-sm ring-1 ring-slate-100">
                                <QRCodeCanvas
                                    value={generatePayload(
                                        localStorage.getItem(
                                            'mobistock_promptpay_id'
                                        ) || '',
                                        {
                                            amount: (() => {
                                                const repairParts =
                                                    completeRepair.parts || []
                                                const partsTotal =
                                                    repairParts.reduce(
                                                        (
                                                            acc: number,
                                                            item: RepairOrderPart
                                                        ) =>
                                                            acc +
                                                            item.repair_part_unit_price *
                                                                item.repair_part_quantity,
                                                        0
                                                    )
                                                return (
                                                    Number(
                                                        completeRepair.repair_labor_cost
                                                    ) + partsTotal
                                                )
                                            })(),
                                        }
                                    )}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="mt-8 flex flex-col gap-3">
                                <button
                                    onClick={() => setIsConfirmPaymentOpen(true)}
                                    className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                                >
                                    ยืนยันการชำระเงิน
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

            {/* Payment Confirmation Modal */}
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
                                    setConfirmImages([])
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
                                    หลักฐานการโอนและส่งมอบ
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
                                    <span className="text-xs">คลิกเพื่ออัปโหลดรูปภาพหลักฐานการโอนและส่งมอบ</span>
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
                                        <span>• หลักฐานการโอนและส่งมอบ:</span>
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
                                        setIsConfirmPaymentOpen(false)
                                        setConfirmImages([])
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
                                        confirmImages.filter((i) => !i.uploading).length < 1
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

            {/* Complete Repair Modal */}
            {isCompleteModalOpen && completeRepair && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 text-black backdrop-blur-sm sm:p-6">
                    <div className="bg-bg flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl shadow-2xl ring-1 ring-slate-200">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-8 py-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                ยืนยันการชำระเงิน
                            </h2>
                            <button
                                onClick={() => setIsCompleteModalOpen(false)}
                                className="text-slate-400 transition-colors hover:text-slate-600"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            <form
                                id="complete-form"
                                onSubmit={handleConfirmComplete}
                            >
                                <p className="mb-4 text-sm text-slate-600">
                                    กรุณาอัปโหลดหลักฐานการยืนยันซ่อมเสร็จสิ้น
                                    <span className="font-semibold text-red-600">
                                        {' '}
                                        อย่างน้อย 2 รูปภาพ
                                    </span>{' '}
                                    ก่อนยืนยัน
                                </p>

                                {/* Upload button */}
                                <label className="mb-4 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
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
                                    <span>คลิกเพื่ออัปโหลดรูปภาพ</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleCompleteImageUpload}
                                    />
                                </label>

                                {/* Image grid */}
                                {completeImages.length > 0 && (
                                    <div className="mb-4 grid grid-cols-3 gap-2">
                                        {completeImages.map((img, idx) => (
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
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={img.url}
                                                            alt={`หลักฐาน ${idx + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCompleteImages(
                                                                    (prev) =>
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
                                                            className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                                                        >
                                                            <CloseIcon />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Counter */}
                                <p
                                    className={`mb-4 text-xs font-medium ${
                                        completeImages.filter(
                                            (i) => !i.uploading
                                        ).length >= 2
                                            ? 'text-green-600'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    {
                                        completeImages.filter(
                                            (i) => !i.uploading
                                        ).length
                                    }{' '}
                                    / 2 รูปภาพ
                                    {completeImages.filter((i) => !i.uploading)
                                        .length >= 2 && ' ✓'}
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsCompleteModalOpen(false)
                                        }
                                        className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            completeImages.filter(
                                                (i) => !i.uploading
                                            ).length < 2
                                        }
                                        className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        ยืนยันซ่อมเสร็จสิ้น
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
