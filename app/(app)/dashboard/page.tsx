'use client'

import { useState, useEffect } from 'react'
import {
    FiBox,
    FiShoppingCart,
    FiAlertCircle,
    FiTrendingUp,
    FiPlus,
    FiArrowRight,
    FiTag,
} from 'react-icons/fi'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardStats {
    totalProducts: number
    availableProducts: number
    totalSales: number
    totalRevenue: number
    lowStockCount: number
    totalCategories: number
    totalBrands: number
}

interface RecentSale {
    sale_id: number
    sale_code: string
    sale_date: string
    sale_total_amount: number
    sale_status: string
}

interface Product {
    item_id: number
    item_serial_number: string
    item_lot_number: string
    item_status: string
}

export default function DashboardPage() {
    const { showToast } = useToast()
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        availableProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        lowStockCount: 0,
        totalCategories: 0,
        totalBrands: 0,
    })
    const [recentSales, setRecentSales] = useState<RecentSale[]>([])
    const [recentProducts, setRecentProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                // Fetch Products for stats
                const prodRes = await fetch('/api/product-items?page=1&limit=1000')
                const prodData = await prodRes.json()
                const products = prodData.data || []

                // Fetch Sales
                const saleRes = await fetch('/api/sale-orders?limit=5')
                const saleData = await saleRes.json()
                const sales = saleData.data || []

                // Fetch Categories/Brands
                const [catRes, brandRes] = await Promise.all([
                    fetch('/api/categories?limit=1'),
                    fetch('/api/brands?limit=1'),
                ])
                const catData = await catRes.json()
                const brandData = await brandRes.json()

                const availableCount = products.filter(
                    (p: Product) => p.item_status === 'Available'
                ).length
                const totalRevenue = sales.reduce(
                    (acc: number, s: any) => acc + (s.sale_total_amount || 0),
                    0
                )

                setStats({
                    totalProducts: prodData.pagination?.total || 0,
                    availableProducts: availableCount,
                    totalSales: saleData.pagination?.total || 0,
                    totalRevenue: totalRevenue,
                    lowStockCount: products.filter(
                        (p: Product) => p.item_status === 'Damaged'
                    ).length,
                    totalCategories: catData.pagination?.total || 0,
                    totalBrands: brandData.pagination?.total || 0,
                })

                setRecentSales(sales)
                setRecentProducts(products.slice(0, 5))
            } catch (err) {
                showToast('ไม่สามารถโหลดข้อมูล Dashboard ได้', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                    <p className="text-slate-500">
                        กำลังเตรียมข้อมูล Dashboard...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10 text-black">
            {/* Header section with Greeting */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        แผงควบคุมหลัก
                    </h1>
                    <p className="text-slate-500">
                        ยินดีต้อนรับสู่ระบบจัดการคลังสินค้า Mobi Stock
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/inventory/items"
                        className="bg-bg flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        ดูสต็อกทั้งหมด
                    </Link>
                    <Link
                        href="/transactions/sale-orders"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
                    >
                        <FiPlus />
                        สร้างรายการขาย
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="จำนวนสินค้าทั้งหมด"
                    value={stats.totalProducts.toLocaleString()}
                    icon={<FiBox className="h-6 w-6 text-blue-600" />}
                    trend="+2.5% จากเดือนที่แล้ว"
                    color="blue"
                />
                <StatCard
                    title="สินค้าพร้อมจำหน่าย"
                    value={stats.availableProducts.toLocaleString()}
                    icon={<FiTrendingUp className="h-6 w-6 text-green-600" />}
                    trend={`${Math.round((stats.availableProducts / stats.totalProducts) * 100)}% ของสต็อก`}
                    color="green"
                />
                <StatCard
                    title="คำสั่งซื้อทั้งหมด"
                    value={stats.totalSales.toLocaleString()}
                    icon={
                        <FiShoppingCart className="h-6 w-6 text-purple-600" />
                    }
                    trend="5 รายการวันนี้"
                    color="purple"
                />
                <StatCard
                    title="สินค้าใกล้หมด"
                    value={stats.lowStockCount.toLocaleString()}
                    icon={<FiAlertCircle className="h-6 w-6 text-orange-600" />}
                    trend="ต้องการการตรวจสอบ"
                    color="orange"
                    isAlert={stats.lowStockCount > 0}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Sales Table */}
                <div className="lg:col-span-2">
                    <div className="bg-bg overflow-hidden rounded-xl border border-slate-200 shadow-sm min-h-full">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <h3 className="font-bold text-slate-900">
                                รายการขายล่าสุด
                            </h3>
                            <Link
                                href="/transactions/sale-orders"
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                            >
                                ดูทั้งหมด <FiArrowRight />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-5 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            รหัสคำสั่งซื้อ
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            วันที่
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            จำนวนเงิน
                                        </th>
                                        <th className="px-5 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            สถานะ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentSales.length > 0 ? (
                                        recentSales.map((sale) => (
                                            <tr
                                                key={sale.sale_id}
                                                className="transition-colors hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                                                    #{sale.sale_code}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {new Date(
                                                        sale.sale_date
                                                    ).toLocaleDateString(
                                                        'th-TH'
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-sm font-bold text-slate-900">
                                                    ฿
                                                    {sale.sale_total_amount?.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                            sale.sale_status ===
                                                            'Paid'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                        }`}
                                                    >
                                                        {sale.sale_status ===
                                                        'Paid'
                                                            ? 'ชำระแล้ว'
                                                            : 'รอชำระ'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-5 py-10 text-center text-slate-400"
                                            >
                                                ยังไม่มีรายการขาย
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Categories & Brands Overview */}
                <div className="space-y-6">
                    <div className="bg-bg rounded-xl border border-slate-200 p-5 shadow-sm ">
                        <h3 className="mb-4 font-bold text-slate-900">
                            ภาพรวมสต็อก
                        </h3>
                        <div className="space-y-4">
                            <OverviewItem
                                label="หมวดหมู่สินค้า"
                                count={stats.totalCategories}
                                icon={<FiTag className="text-blue-500" />}
                                color="blue"
                            />
                            <OverviewItem
                                label="แบรนด์สินค้า"
                                count={stats.totalBrands}
                                icon={<FiBox className="text-purple-500" />}
                                color="purple"
                            />
                            <div className="mt-6 border-t border-slate-100 pt-6">
                                <h4 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    การแจ้งเตือน
                                </h4>
                                {stats.lowStockCount > 0 ? (
                                    <div className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50 p-3 text-orange-800">
                                        <FiAlertCircle className="shrink-0" />
                                        <p className="text-xs font-medium">
                                            มีสินค้า {stats.lowStockCount}{' '}
                                            รายการที่ใกล้หมดสต็อก
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50 p-3 text-green-800">
                                        <FiTrendingUp className="shrink-0" />
                                        <p className="text-xs font-medium">
                                            ระดับสต็อกสินค้าปกติ
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Products Grid */}
            <div className="bg-bg overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <h3 className="font-bold text-slate-900">สินค้าเข้าใหม่</h3>
                    <Link
                        href="/inventory/items"
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                    >
                        จัดการสต็อก <FiArrowRight />
                    </Link>
                </div>
                <div className="grid grid-cols-1 divide-x divide-slate-100 md:grid-cols-3 lg:grid-cols-5">
                    {recentProducts.map((product) => (
                        <div
                            key={product.item_id}
                            className="p-5 transition-colors hover:bg-slate-50"
                        >
                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <FiBox />
                            </div>
                            <h4 className="truncate text-sm font-bold text-slate-900">
                                {product.item_serial_number}
                            </h4>
                            <p className="mb-2 text-xs text-slate-500">
                                ID: {product.item_id}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">
                                    Lot: {product.item_lot_number || '-'}
                                </span>
                                <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                        product.item_status === 'Available'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {product.item_status === 'Available'
                                        ? 'พร้อม'
                                        : product.item_status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, trend, color, isAlert }: any) {
    const colorClasses: any = {
        blue: 'border-blue-100 bg-blue-50/30',
        green: 'border-green-100 bg-green-50/30',
        purple: 'border-purple-100 bg-purple-50/30',
        orange: 'border-orange-100 bg-orange-50/30',
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${colorClasses[color]} ${isAlert ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="bg-bg rounded-lg p-2.5 shadow-sm ring-1 ring-slate-100">
                    {icon}
                </div>
                {isAlert && (
                    <span className="flex h-2 w-2 animate-ping rounded-full bg-orange-600"></span>
                )}
            </div>
            <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    {title}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {value}
                </h2>
                <p
                    className={`mt-2 text-xs font-medium ${isAlert ? 'text-orange-600' : 'text-slate-400'}`}
                >
                    {trend}
                </p>
            </div>
        </motion.div>
    )
}

function OverviewItem({ label, count, icon, color }: any) {
    return (
        <div className="group flex cursor-pointer items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="group-hover:bg-bg bg-slate-50 flex h-8 w-8 items-center justify-center rounded text-slate-600 transition-all group-hover:shadow-sm">
                    {icon}
                </div>
                <span className="text-sm font-medium text-slate-600">
                    {label}
                </span>
            </div>
            <span className="text-sm font-bold text-slate-900">{count}</span>
        </div>
    )
}
