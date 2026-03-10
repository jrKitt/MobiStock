'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ProductItem, ProductModel, Brand, Category } from '@/types/api'

export default function ProductItemsPage() {
    const { showToast } = useToast()
    const [items, setItems] = useState<ProductItem[]>([])
    const [models, setModels] = useState<ProductModel[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Filters state
    const [search, setSearch] = useState('')
    const [filterBrandId, setFilterBrandId] = useState(0)
    const [filterCategoryId, setFilterCategoryId] = useState(0)
    const [filterModelId, setFilterModelId] = useState(0)
    const [filterStatus, setFilterStatus] = useState('All')

    const [formData, setFormData] = useState({
        item_serial_number: '',
        item_imei: '',
        item_lot_number: '',
        item_status: 'Available',
        model_id: 0,
    })

    // Multi-item state for batch creation
    const [multiItemMode, setMultiItemMode] = useState(false)
    const [multiItems, setMultiItems] = useState([
        {
            item_serial_number: '',
            item_imei: '',
            item_lot_number: '',
            item_status: 'Available' as const,
            model_id: 0,
        }
    ])

    const fetchData = async (
        page: number = 1,
        limit: number = 10,
        tempSearch: string = search,
        tempBrandId: number = filterBrandId,
        tempCategoryId: number = filterCategoryId,
        tempModelId: number = filterModelId,
        tempStatus: string = filterStatus
    ) => {
        try {
            setLoading(true)
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            })

            if (tempSearch) queryParams.append('search', tempSearch)
            if (tempBrandId > 0)
                queryParams.append('brand_id', tempBrandId.toString())
            if (tempCategoryId > 0)
                queryParams.append('category_id', tempCategoryId.toString())
            if (tempModelId > 0)
                queryParams.append('model_id', tempModelId.toString())
            if (tempStatus !== 'All') queryParams.append('status', tempStatus)

            const modelsQueryStr =
                tempBrandId > 0
                    ? `?brand_id=${tempBrandId}&page=1&limit=100`
                    : '?page=1&limit=100'

            const [itemsRes, modelsRes, brandsRes, categoriesRes] =
                await Promise.all([
                    fetch(`/api/product-items?${queryParams.toString()}`),
                    fetch(`/api/product-models${modelsQueryStr}`),
                    fetch('/api/brands?page=1&limit=100'),
                    fetch('/api/categories?page=1&limit=100'),
                ])

            if (
                !itemsRes.ok ||
                !modelsRes.ok ||
                !brandsRes.ok ||
                !categoriesRes.ok
            )
                throw new Error('Failed to fetch data')

            const [itemsData, modelsData, brandsData, categoriesData] =
                await Promise.all([
                    itemsRes.json(),
                    modelsRes.json(),
                    brandsRes.json(),
                    categoriesRes.json(),
                ])

            setItems(itemsData.data)
            setModels(modelsData.data)
            setBrands(brandsData.data)
            setCategories(categoriesData.data)
            setTotalPages(itemsData.pagination?.totalPages || 1)
            setTotalItems(itemsData.pagination?.total || 0)
        } catch (err) {
            console.error(err)
            showToast('ไม่สามารถโหลดข้อมูลสินค้าได้', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData(
            currentPage,
            pageSize,
            search,
            filterBrandId,
            filterCategoryId,
            filterModelId,
            filterStatus
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentPage,
        pageSize,
        filterBrandId,
        filterCategoryId,
        filterModelId,
        filterStatus,
    ])

    // Searching is triggered onSubmit or wait for typing
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchData(
            1,
            pageSize,
            search,
            filterBrandId,
            filterCategoryId,
            filterModelId,
            filterStatus
        )
    }

    const handleClearSearch = () => {
        setSearch('')
        setCurrentPage(1)
        fetchData(
            1,
            pageSize,
            '',
            filterBrandId,
            filterCategoryId,
            filterModelId,
            filterStatus
        )
    }

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
        setMultiItemMode(false)
        setFormData({
            item_serial_number: '',
            item_imei: '',
            item_lot_number: '',
            item_status: 'Available',
            model_id: models[0]?.model_id || 0,
        })
        setMultiItems([{
            item_serial_number: '',
            item_imei: '',
            item_lot_number: '',
            item_status: 'Available',
            model_id: 0,
        }])
    }

    const handleAddItem = () => {
        setMultiItems([...multiItems, {
            item_serial_number: '',
            item_imei: '',
            item_lot_number: '',
            item_status: 'Available',
            model_id: 0,
        }])
    }

    const handleRemoveItem = (index: number) => {
        if (multiItems.length > 1) {
            setMultiItems(multiItems.filter((_, i) => i !== index))
        }
    }

    const handleMultiItemChange = (index: number, field: string, value: string | number) => {
        const updatedItems = [...multiItems]
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: field === 'model_id' ? (typeof value === 'string' ? parseInt(value) || 0 : value) : value
        }
        setMultiItems(updatedItems)
    }

    const handleToggleMultiMode = () => {
        setMultiItemMode(!multiItemMode)
        if (!multiItemMode) {
            // Switching to multi mode, reset multiItems
            setMultiItems([{
                item_serial_number: '',
                item_imei: '',
                item_lot_number: '',
                item_status: 'Available',
                model_id: formData.model_id || 0,
            }])
        }
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
        } catch {
            showToast('ไม่สามารถอัปเดตรายการได้', 'error')
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (multiItemMode) {
            // Handle multi-item creation
            const validItems = multiItems.filter(item => 
                item.model_id > 0 && (item.item_serial_number || item.item_imei)
            )

            if (validItems.length === 0) {
                showToast('กรุณากรอกข้อมูลอย่างน้อย 1 รายการ', 'warning')
                return
            }

            try {
                const response = await fetch('/api/product-items/batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ items: validItems }),
                })

                if (!response.ok) throw new Error('Failed to create items')
                
                const result = await response.json()
                showToast(`สร้างรายการ ${result.created || validItems.length} รายการเรียบร้อยแล้ว`, 'success')
                handleCloseModal()

                // Refresh data
                setCurrentPage(1)
                fetchData(1, pageSize)
            } catch {
                showToast('ไม่สามารถสร้างรายการได้', 'error')
            }
        } else {
            // Handle single item creation
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
            } catch {
                showToast('ไม่สามารถสร้างรายการได้', 'error')
            }
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
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return
        try {
            const response = await fetch(`/api/product-items/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete item')
            showToast('ลบรายการเรียบร้อยแล้ว', 'success')

            setItems(items.filter((i) => i.item_id !== id))
            setTotalItems((prev) => prev - 1)
        } catch {
            showToast('ไม่สามารถลบรายการได้', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    {/* <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        รายการสินค้า
                    </h1> */}
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
                <div className="bg-bg flex items-center justify-center rounded-lg border border-slate-200 p-24">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                        <p className="text-sm text-slate-500">
                            กำลังโหลดรายการ...
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-bg overflow-hidden rounded-lg border border-slate-200 shadow-xs">
                    <div className="bg-bg border-b border-slate-100 p-6">
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

                                {/* Filters */}
                                <form
                                    onSubmit={handleSearchSubmit}
                                    className="flex flex-1 items-center gap-3"
                                >
                                    <div className="relative max-w-sm flex-1">
                                        <svg
                                            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="ค้นหา (SN, IMEI)..."
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 py-1.5 pr-8 pl-9 text-sm outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={handleClearSearch}
                                                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                            >
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        value={filterCategoryId}
                                        onChange={(e) => {
                                            setFilterCategoryId(
                                                parseInt(e.target.value)
                                            )
                                            setCurrentPage(1)
                                        }}
                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                                    >
                                        <option value={0}>ทุกหมวดหมู่</option>
                                        {categories.map((cat) => (
                                            <option
                                                key={cat.category_id}
                                                value={cat.category_id}
                                            >
                                                {cat.category_name_th}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterBrandId}
                                        onChange={(e) => {
                                            setFilterBrandId(
                                                parseInt(e.target.value)
                                            )
                                            setFilterModelId(0)
                                            setCurrentPage(1)
                                        }}
                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                                    >
                                        <option value={0}>ทุกยี่ห้อ</option>
                                        {brands.map((brand) => (
                                            <option
                                                key={brand.brand_id}
                                                value={brand.brand_id}
                                            >
                                                {brand.brand_name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={filterModelId}
                                        onChange={(e) => {
                                            setFilterModelId(
                                                parseInt(e.target.value)
                                            )
                                            setCurrentPage(1)
                                        }}
                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                                    >
                                        <option value={0}>ทุกรุ่น</option>
                                        {models.map((model) => (
                                            <option
                                                key={model.model_id}
                                                value={model.model_id}
                                            >
                                                {model.model_name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => {
                                            setFilterStatus(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                                    >
                                        <option value="All">ทุกสถานะ</option>
                                        <option value="Available">
                                            พร้อมใช้
                                        </option>
                                        <option value="Sold">ขายแล้ว</option>
                                        <option value="Damaged">เสียหาย</option>
                                        <option value="Reserved">
                                            จองแล้ว
                                        </option>
                                    </select>
                                    {(search !== '' ||
                                        filterBrandId !== 0 ||
                                        filterCategoryId !== 0 ||
                                        filterModelId !== 0 ||
                                        filterStatus !== 'All') && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('')
                                                setFilterBrandId(0)
                                                setFilterCategoryId(0)
                                                setFilterModelId(0)
                                                setFilterStatus('All')
                                                setCurrentPage(1)
                                            }}
                                            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 outline-hidden transition-colors hover:bg-rose-100 hover:text-rose-700"
                                        >
                                            ล้างตัวกรอง
                                        </button>
                                    )}
                                </form>

                                <div className="h-10 w-px bg-slate-100 max-sm:hidden"></div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                        แสดง
                                    </label>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="bg-bg rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
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
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        รุ่น / SN
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        IMEI / แบตช์
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
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <tr
                                            key={item.item_id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {models.find(
                                                        (m) =>
                                                            m.model_id ===
                                                            item.model_id
                                                    )?.image_url ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={
                                                                models.find(
                                                                    (m) =>
                                                                        m.model_id ===
                                                                        item.model_id
                                                                )
                                                                    ?.image_url as string
                                                            }
                                                            alt="Model"
                                                            className="h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-400">
                                                            N/A
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            {models.find(
                                                                (m) =>
                                                                    m.model_id ===
                                                                    item.model_id
                                                            )?.model_name ||
                                                                'Unknown Model'}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-slate-400 uppercase">
                                                            SN:{' '}
                                                            {item.item_serial_number ||
                                                                'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900">
                                                    IMEI:{' '}
                                                    {item.item_imei || '-'}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Lot:{' '}
                                                    {item.item_lot_number ||
                                                        '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        item.item_status ===
                                                        'Available'
                                                            ? 'text-green-600'
                                                            : item.item_status ===
                                                                'Sold'
                                                              ? 'text-gray-600'
                                                              : item.item_status ===
                                                                  'Reserved'
                                                                ? 'text-orange-600'
                                                                : 'text-slate-400'
                                                    }`}
                                                >
                                                    {item.item_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                        className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
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
                                                    <button
                                                        onClick={() =>
                                                            item.item_id &&
                                                            handleDelete(
                                                                item.item_id
                                                            )
                                                        }
                                                        className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
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
                                                        ลบ
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
                    <div className="bg-bg w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                {selectedItem
                                    ? 'แก้ไขรายการ'
                                    : multiItemMode
                                        ? 'สร้างรายการใหม่ (หลายรายการ)'
                                        : 'สร้างรายการใหม่'}
                            </h2>
                            <button
                                type="button"
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

                        {!selectedItem && (
                            <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={multiItemMode}
                                            onChange={handleToggleMultiMode}
                                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-blue-900">
                                            สร้างหลายรายการพร้อมกัน
                                        </span>
                                    </label>
                                </div>
                                {multiItemMode && (
                                    <div className="text-sm text-blue-600">
                                        {multiItems.length} รายการ
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            {!selectedItem && multiItemMode ? (
                                // Multi-item mode - full width table layout
                                <div className="space-y-4">
                                    {/* Header row */}
                                    <div className="grid grid-cols-7 gap-2 p-3 bg-slate-50 rounded-t-lg text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        <div className="col-span-1">รายการ</div>
                                        <div className="col-span-2">รุ่นสินค้า</div>
                                        <div className="col-span-1">หมายเลขซีเรียล</div>
                                        <div className="col-span-1">IMEI</div>
                                        <div className="col-span-1">หมายเลขล็อต</div>
                                        <div className="col-span-1">สถานะ</div>
                                    </div>
                                    
                                    {multiItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-7 gap-2 p-3 border border-slate-200 bg-white">
                                            {/* Item number and delete button */}
                                            <div className="col-span-1 flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-700">
                                                    #{index + 1}
                                                </span>
                                                {multiItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="ลบรายการนี้"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* Model selection */}
                                            <div className="col-span-2">
                                                <select
                                                    required
                                                    value={item.model_id}
                                                    onChange={(e) => handleMultiItemChange(index, 'model_id', e.target.value)}
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                                >
                                                    <option value={0}>เลือกรุ่น</option>
                                                    {models.map((model) => (
                                                        <option
                                                            key={model.model_id}
                                                            value={model.model_id}
                                                        >
                                                            {model.model_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            {/* Serial number */}
                                            <div className="col-span-1">
                                                <input
                                                    type="text"
                                                    placeholder="S/N"
                                                    value={item.item_serial_number}
                                                    onChange={(e) => handleMultiItemChange(index, 'item_serial_number', e.target.value)}
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                                />
                                            </div>
                                            
                                            {/* IMEI */}
                                            <div className="col-span-1">
                                                <input
                                                    type="text"
                                                    placeholder="IMEI"
                                                    value={item.item_imei}
                                                    onChange={(e) => handleMultiItemChange(index, 'item_imei', e.target.value)}
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                                />
                                            </div>
                                            
                                            {/* Lot number */}
                                            <div className="col-span-1">
                                                <input
                                                    type="text"
                                                    placeholder="Lot"
                                                    value={item.item_lot_number}
                                                    onChange={(e) => handleMultiItemChange(index, 'item_lot_number', e.target.value)}
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                                />
                                            </div>
                                            
                                            {/* Status */}
                                            <div className="col-span-1">
                                                <select
                                                    value={item.item_status}
                                                    onChange={(e) => handleMultiItemChange(index, 'item_status', e.target.value)}
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                                >
                                                    <option value="Available">พร้อมใช้</option>
                                                    <option value="Sold">ขายแล้ว</option>
                                                    <option value="Damaged">เสียหาย</option>
                                                    <option value="Reserved">จองแล้ว</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Add new row button */}
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
                                    >
                                        + เพิ่มแถวใหม่
                                    </button>
                                </div>
                            ) : (
                                // Single item mode (edit or single create)
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
                                            {models.map((model) => (
                                                <option
                                                    key={model.model_id}
                                                    value={model.model_id}
                                                >
                                                    {model.model_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            หมายเลขซีเรียล
                                        </label>
                                        <input
                                            type="text"
                                            name="item_serial_number"
                                            value={formData.item_serial_number}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            IMEI
                                        </label>
                                        <input
                                            type="text"
                                            name="item_imei"
                                            value={formData.item_imei}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            หมายเลขล็อต
                                        </label>
                                        <input
                                            type="text"
                                            name="item_lot_number"
                                            value={formData.item_lot_number}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                            สถานะ
                                        </label>
                                        <select
                                            name="item_status"
                                            value={formData.item_status}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-medium transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                        >
                                            <option value="Available">Available</option>
                                            <option value="Sold">Sold</option>
                                            <option value="Damaged">Damaged</option>
                                            <option value="Reserved">Reserved</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                                >
                                    {selectedItem
                                        ? 'อัปเดต'
                                        : multiItemMode
                                            ? `สร้าง ${multiItems.length} รายการ`
                                            : 'สร้างรายการ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
