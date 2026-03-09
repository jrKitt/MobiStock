'use client'

import React, { useState, useEffect } from 'react'
import {
    FiBox,
    FiShoppingCart,
    FiAlertCircle,
    FiTrendingUp,
    FiPlus,
    FiArrowRight,
    FiTag,
    FiUsers,
    FiActivity,
    FiDollarSign,
    FiPackage,
    FiTool,
    FiFileText,
    FiCalendar,
    FiRefreshCw,
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
    totalRepairs: number
    totalClaims: number
    totalCustomers: number
    todayRevenue: number
    weeklyGrowth: number
    todaySales: number
    pendingRepairs: number
    pendingClaims: number
}

interface RecentActivity {
    id: number
    type: 'sale' | 'repair' | 'claim' | 'product'
    title: string
    description: string
    timestamp: string
    status?: string
}

interface TopProduct {
    item_id: number
    item_serial_number: string
    model_name?: string
    sales_count: number
    revenue: number
}

export default function EnhancedDashboardPage() {
    const { showToast } = useToast()
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        availableProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        lowStockCount: 0,
        totalCategories: 0,
        totalBrands: 0,
        totalRepairs: 0,
        totalClaims: 0,
        totalCustomers: 0,
        todayRevenue: 0,
        weeklyGrowth: 0,
        todaySales: 0,
        pendingRepairs: 0,
        pendingClaims: 0,
    })
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [topProducts, setTopProducts] = useState<TopProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                
                // Fetch all data sources
                const [
                    prodRes, 
                    saleRes, 
                    repairRes, 
                    claimRes,
                    customerRes,
                    catRes, 
                    brandRes
                ] = await Promise.all([
                    fetch('/api/product-items?page=1&limit=1000'),
                    fetch('/api/sale-orders?limit=100'),
                    fetch('/api/repair-orders?limit=100'),
                    fetch('/api/claim-orders?limit=100'),
                    fetch('/api/customers?limit=1'),
                    fetch('/api/categories?limit=1'),
                    fetch('/api/brands?limit=1'),
                ])

                const [prodData, saleData, repairData, claimData, customerData, catData, brandData] = 
                    await Promise.all([
                        prodRes.json(),
                        saleRes.json(),
                        repairRes.json(),
                        claimRes.json(),
                        customerRes.json(),
                        catRes.json(),
                        brandRes.json(),
                    ])

                const products = prodData.data || []
                const sales = saleData.data || []
                const repairs = repairData.data || []
                const claims = claimData.data || []

                // Calculate enhanced stats
                const today = new Date().toDateString()
                const todaySales = sales.filter((s: any) => 
                    new Date(s.sale_date).toDateString() === today
                )
                const todayRevenue = todaySales.reduce((acc: number, s: any) => 
                    acc + (s.sale_total_amount || 0), 0
                )

                const availableCount = products.filter(
                    (p: any) => p.item_status === 'Available'
                ).length

                const pendingRepairs = repairs.filter((r: any) => 
                    r.repair_status === 'Pending'
                ).length

                const pendingClaims = claims.filter((c: any) => 
                    c.claim_status === 'pending'
                ).length

                // Calculate weekly growth (mock calculation)
                const weeklyGrowth = Math.random() * 20 - 5 // -5% to +15%

                setStats({
                    totalProducts: prodData.pagination?.total || 0,
                    availableProducts: availableCount,
                    totalSales: saleData.pagination?.total || 0,
                    totalRevenue: sales.reduce((acc: number, s: any) => 
                        acc + (s.sale_total_amount || 0), 0
                    ),
                    lowStockCount: products.filter((p: any) => p.item_status === 'Damaged').length,
                    totalCategories: catData.pagination?.total || 0,
                    totalBrands: brandData.pagination?.total || 0,
                    totalRepairs: repairData.pagination?.total || 0,
                    totalClaims: claimData.pagination?.total || 0,
                    totalCustomers: customerData.pagination?.total || 0,
                    todayRevenue,
                    weeklyGrowth,
                    todaySales: todaySales.length,
                    pendingRepairs,
                    pendingClaims,
                })

                // Create recent activity feed
                const activities: RecentActivity[] = [
                    ...todaySales.slice(0, 3).map((s: any) => ({
                        id: s.sale_id,
                        type: 'sale' as const,
                        title: `การขาย #${s.sale_code}`,
                        description: `ยอด ฿${s.sale_total_amount?.toLocaleString()}`,
                        timestamp: s.sale_date,
                        status: s.sale_status,
                    })),
                    ...repairs.slice(0, 2).map((r: any) => ({
                        id: r.repair_id,
                        type: 'repair' as const,
                        title: `การซ่อม #${r.repair_code}`,
                        description: r.repair_problem_desc?.substring(0, 30) + '...',
                        timestamp: r.repair_date_received,
                        status: r.repair_status,
                    })),
                    ...claims.slice(0, 2).map((c: any) => ({
                        id: c.claim_id,
                        type: 'claim' as const,
                        title: `การเคลม #${c.claim_code}`,
                        description: 'รอดำเนินการตรวจสอบ',
                        timestamp: c.claim_date_received,
                        status: c.claim_status,
                    })),
                ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5)

                setRecentActivity(activities)

                // Mock top products (would be calculated from sales data)
                setTopProducts([
                    { item_id: 1, item_serial_number: 'SN001', model_name: 'iPhone 14', sales_count: 15, revenue: 150000 },
                    { item_id: 2, item_serial_number: 'SN002', model_name: 'Samsung S23', sales_count: 12, revenue: 120000 },
                    { item_id: 3, item_serial_number: 'SN003', model_name: 'iPad Pro', sales_count: 8, revenue: 80000 },
                ])

                setLastRefresh(new Date())
            } catch (err) {
                showToast('ไม่สามารถโหลดข้อมูล Dashboard ได้', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000)
        return () => clearInterval(interval)
    }, [showToast])

    const handleRefresh = () => {
        setLastRefresh(new Date())
        window.location.reload()
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                    <p className="text-slate-500">กำลังเตรียมข้อมูล Dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10 text-black">
            {/* Enhanced Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">แผงควบคุมหลัก</h1>
                    <p className="text-slate-500">
                        ภาพรวมธุรกิจของคุณ • อัปเดตล่าสุด: {lastRefresh.toLocaleTimeString('th-TH')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        <FiRefreshCw className="h-4 w-4" />
                        รีเฟรช
                    </button>
                    <Link
                        href="/transactions/sale-orders"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
                    >
                        <FiPlus />
                        สร้างรายการขาย
                    </Link>
                </div>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <EnhancedStatCard
                    title="รายได้วันนี้"
                    value={`฿${stats.todayRevenue.toLocaleString()}`}
                    icon={<FiDollarSign className="h-6 w-6 text-green-600" />}
                    trend={`${stats.todaySales} รายการ`}
                    color="green"
                    subtitle="วันนี้"
                />
                <EnhancedStatCard
                    title="ยอดขายทั้งหมด"
                    value={stats.totalSales.toLocaleString()}
                    icon={<FiShoppingCart className="h-6 w-6 text-blue-600" />}
                    trend={`+${stats.weeklyGrowth.toFixed(1)}% จากสัปดาห์ที่แล้ว`}
                    color="blue"
                    subtitle="ทั้งหมด"
                />
                <EnhancedStatCard
                    title="สินค้าพร้อมจำหน่าย"
                    value={stats.availableProducts.toLocaleString()}
                    icon={<FiPackage className="h-6 w-6 text-purple-600" />}
                    trend={`${Math.round((stats.availableProducts / stats.totalProducts) * 100)}% ของสต็อก`}
                    color="purple"
                    subtitle="พร้อมขาย"
                />
                <EnhancedStatCard
                    title="รอดำเนินการ"
                    value={stats.pendingRepairs + stats.pendingClaims}
                    icon={<FiActivity className="h-6 w-6 text-orange-600" />}
                    trend={`${stats.pendingRepairs} ซ่อม, ${stats.pendingClaims} เคลม`}
                    color="orange"
                    subtitle="ทั้งหมด"
                    isAlert={stats.pendingRepairs + stats.pendingClaims > 0}
                />
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MiniStatCard
                    title="สินค้าทั้งหมด"
                    value={stats.totalProducts.toLocaleString()}
                    icon={<FiBox />}
                    color="slate"
                />
                <MiniStatCard
                    title="ลูกค้าทั้งหมด"
                    value={stats.totalCustomers.toLocaleString()}
                    icon={<FiUsers />}
                    color="slate"
                />
                <MiniStatCard
                    title="การซ่อมทั้งหมด"
                    value={stats.totalRepairs.toLocaleString()}
                    icon={<FiTool />}
                    color="slate"
                />
                <MiniStatCard
                    title="การเคลมทั้งหมด"
                    value={stats.totalClaims.toLocaleString()}
                    icon={<FiFileText />}
                    color="slate"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2">
                    <div className="bg-bg overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <h3 className="font-bold text-slate-900">กิจกรรมล่าสุด</h3>
                            <Link
                                href="/reports"
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                            >
                                ดูทั้งหมด <FiArrowRight />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400">
                                    ไม่มีกิจกรรมล่าสุด
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="space-y-6">
                    <div className="bg-bg rounded-xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="mb-4 font-bold text-slate-900">สินค้าขายดี</h3>
                        <div className="space-y-3">
                            {topProducts.map((product, index) => (
                                <div key={product.item_id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{product.model_name}</p>
                                            <p className="text-xs text-slate-500">{product.item_serial_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{product.sales_count}</p>
                                        <p className="text-xs text-slate-500">฿{product.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-bg rounded-xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="mb-4 font-bold text-slate-900">ดำเนินการด่วน</h3>
                        <div className="space-y-2">
                            <QuickAction
                                href="/transactions/sale-orders"
                                icon={<FiShoppingCart />}
                                label="สร้างรายการขาย"
                                color="blue"
                            />
                            <QuickAction
                                href="/inventory/items"
                                icon={<FiPackage />}
                                label="เพิ่มสินค้า"
                                color="green"
                            />
                            <QuickAction
                                href="/services/repair-orders"
                                icon={<FiTool />}
                                label="บันทึกการซ่อม"
                                color="orange"
                            />
                            <QuickAction
                                href="/reports"
                                icon={<FiFileText />}
                                label="ดูรายงาน"
                                color="purple"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Enhanced Components
function EnhancedStatCard({ title, value, icon, trend, color, subtitle, isAlert }: any) {
    const colorClasses: any = {
        green: 'border-green-100 bg-green-50/30',
        blue: 'border-blue-100 bg-blue-50/30',
        purple: 'border-purple-100 bg-purple-50/30',
        orange: 'border-orange-100 bg-orange-50/30',
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${colorClasses[color]} ${isAlert ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="bg-bg rounded-lg p-3 shadow-sm ring-1 ring-slate-100">
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
                <h2 className="mt-1 text-3xl font-black text-slate-900">
                    {value}
                </h2>
                <div className="mt-2 flex items-center justify-between">
                    <p className={`text-xs font-medium ${isAlert ? 'text-orange-600' : 'text-slate-400'}`}>
                        {trend}
                    </p>
                    <span className="text-xs text-slate-400">{subtitle}</span>
                </div>
            </div>
        </motion.div>
    )
}

function MiniStatCard({ title, value, icon, color }: any) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-50 p-2 text-slate-600">
                    {React.cloneElement(icon, { className: "h-4 w-4" })}
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500">{title}</p>
                    <p className="text-lg font-bold text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    )
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'sale': return <FiShoppingCart className="h-4 w-4 text-blue-600" />
            case 'repair': return <FiTool className="h-4 w-4 text-orange-600" />
            case 'claim': return <FiFileText className="h-4 w-4 text-purple-600" />
            default: return <FiActivity className="h-4 w-4 text-slate-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700'
            case 'Pending': return 'bg-orange-100 text-orange-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="p-4 transition-colors hover:bg-slate-50">
            <div className="flex items-start gap-3">
                <div className="mt-1">{getIcon(activity.type)}</div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                        <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(activity.status || '')}`}>
                            {activity.status || 'N/A'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">{activity.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        {new Date(activity.timestamp).toLocaleString('th-TH')}
                    </p>
                </div>
            </div>
        </div>
    )
}

function QuickAction({ href, icon, label, color }: any) {
    const colorClasses: any = {
        blue: 'hover:bg-blue-50 text-blue-600',
        green: 'hover:bg-green-50 text-green-600',
        orange: 'hover:bg-orange-50 text-orange-600',
        purple: 'hover:bg-purple-50 text-purple-600',
    }

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${colorClasses[color]}`}
        >
            {React.cloneElement(icon, { className: "h-4 w-4" })}
            <span className="text-sm font-medium">{label}</span>
        </Link>
    )
}
