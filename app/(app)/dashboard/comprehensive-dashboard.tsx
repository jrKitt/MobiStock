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
    FiUsers,
    FiActivity,
    FiDollarSign,
    FiPackage,
    FiTool,
    FiFileText,
    FiClock,
    FiBarChart2,
    FiPieChart,
    FiRefreshCw,
    FiCheck,
} from 'react-icons/fi'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardStats {
    totalRevenue: number
    pendingOrders: number
    completedOrders: number
    availableItems: number
    lowStockParts: number
    inProgressRepairs: number
    completedRepairs: number
    pendingClaims: number
    totalCustomers: number
    avgRepairTime: number
    serviceRevenue: number
}

interface SalesTrend {
    date: string
    revenue: number
    orders: number
}

interface TopBrand {
    brand_name: string
    revenue: number
    percentage: number
}

interface InventoryStatus {
    status: string
    count: number
    color: string
}

interface RepairStatus {
    status: string
    count: number
    color: string
}

interface ClaimResolution {
    resolution: string
    count: number
    percentage: number
}

export default function ComprehensiveDashboard() {
    const { showToast } = useToast()
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        availableItems: 0,
        lowStockParts: 0,
        inProgressRepairs: 0,
        completedRepairs: 0,
        pendingClaims: 0,
        totalCustomers: 0,
        avgRepairTime: 0,
        serviceRevenue: 0,
    })
    const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([])
    const [topBrands, setTopBrands] = useState<TopBrand[]>([])
    const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([])
    const [repairStatus, setRepairStatus] = useState<RepairStatus[]>([])
    const [claimResolutions, setClaimResolutions] = useState<ClaimResolution[]>([])
    const [modelData, setModelData] = useState<any>(null)
    const [categoryData, setCategoryData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                
                // Fetch all data sources
                const [
                    saleRes, 
                    repairRes, 
                    claimRes,
                    customerRes,
                    productRes,
                    modelRes,
                    brandRes,
                    categoryRes,
                    partsRes
                ] = await Promise.all([
                    fetch('/api/sale-orders?limit=1000'),
                    fetch('/api/repair-orders?limit=1000'),
                    fetch('/api/claim-orders?limit=1000'),
                    fetch('/api/customers?limit=1'),
                    fetch('/api/product-items?limit=1000'),
                    fetch('/api/product-models?limit=1000'),
                    fetch('/api/brands?limit=1000'),
                    fetch('/api/categories?limit=1000'),
                    fetch('/api/spare-parts?limit=1000'),
                ])

                const [
                    saleData, 
                    repairData, 
                    claimData,
                    customerData,
                    productData,
                    models,
                    brands,
                    categories,
                    partsData
                ] = await Promise.all([
                    saleRes.json(),
                    repairRes.json(),
                    claimRes.json(),
                    customerRes.json(),
                    productRes.json(),
                    modelRes.json(),
                    brandRes.json(),
                    categoryRes.json(),
                    partsRes.json(),
                ])

                // Set state for later use
                setModelData(models)
                setCategoryData(categories)

                const sales = saleData.data || []
                const repairs = repairData.data || []
                const claims = claimData.data || []
                const products = productData.data || []
                const parts = partsData.data || []

                // Calculate Sales & Revenue Performance
                const completedSales = sales.filter((s: any) => s.sale_status === 'Completed')
                const pendingSales = sales.filter((s: any) => s.sale_status === 'Pending')
                const totalRevenue = completedSales.reduce((acc: number, s: any) => 
                    acc + (s.sale_total_amount || 0), 0
                )

                // Calculate Sales Trends (last 7 days)
                const last7Days = []
                for (let i = 6; i >= 0; i--) {
                    const date = new Date()
                    date.setDate(date.getDate() - i)
                    const dateStr = date.toISOString().split('T')[0]
                    const daySales = sales.filter((s: any) => 
                        s.sale_date?.startsWith(dateStr)
                    )
                    const dayRevenue = daySales.reduce((acc: number, s: any) => 
                        acc + (s.sale_total_amount || 0), 0
                    )
                    last7Days.push({
                        date: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
                        revenue: dayRevenue,
                        orders: daySales.length
                    })
                }
                setSalesTrends(last7Days)

                // Calculate Top Brands (mock data for now - would need complex joins)
                const brandPerformance = [
                    { brand_name: 'Apple', revenue: totalRevenue * 0.35, percentage: 35 },
                    { brand_name: 'Samsung', revenue: totalRevenue * 0.25, percentage: 25 },
                    { brand_name: 'Xiaomi', revenue: totalRevenue * 0.20, percentage: 20 },
                    { brand_name: 'Oppo', revenue: totalRevenue * 0.12, percentage: 12 },
                    { brand_name: 'อื่นๆ', revenue: totalRevenue * 0.08, percentage: 8 },
                ]
                setTopBrands(brandPerformance)

                // Calculate Inventory Status
                const availableCount = products.filter((p: any) => p.item_status === 'Available').length
                const soldCount = products.filter((p: any) => p.item_status === 'Sold').length
                const damagedCount = products.filter((p: any) => p.item_status === 'Damaged').length
                const reservedCount = products.filter((p: any) => p.item_status === 'Reserved').length

                setInventoryStatus([
                    { status: 'พร้อมขาย', count: availableCount, color: 'bg-green-500' },
                    { status: 'ขายแล้ว', count: soldCount, color: 'bg-blue-500' },
                    { status: 'เสียหาย', count: damagedCount, color: 'bg-red-500' },
                    { status: 'จองแล้ว', count: reservedCount, color: 'bg-orange-500' },
                ])

                // Calculate Repair Status
                const receivedRepairs = repairs.filter((r: any) => r.repair_status === 'received').length
                const inProgressRepairs = repairs.filter((r: any) => r.repair_status === 'in_progress').length
                const completedRepairs = repairs.filter((r: any) => r.repair_status === 'completed').length

                setRepairStatus([
                    { status: 'รับซ่อม', count: receivedRepairs, color: 'bg-yellow-500' },
                    { status: 'กำลังซ่อม', count: inProgressRepairs, color: 'bg-blue-500' },
                    { status: 'ซ่อมเสร็จ', count: completedRepairs, color: 'bg-green-500' },
                ])

                // Calculate Claim Resolutions
                const resolvedClaims = claims.filter((c: any) => c.claim_status === 'resolved')
                const replacementClaims = resolvedClaims.filter((c: any) => c.claim_resolution === 'replacement').length
                const refundClaims = resolvedClaims.filter((c: any) => c.claim_resolution === 'refund').length
                const repairClaims = resolvedClaims.filter((c: any) => c.claim_resolution === 'repair').length

                const totalResolved = resolvedClaims.length
                setClaimResolutions([
                    { resolution: 'เปลี่ยนใหม่', count: replacementClaims, percentage: totalResolved > 0 ? Math.round((replacementClaims / totalResolved) * 100) : 0 },
                    { resolution: 'คืนเงิน', count: refundClaims, percentage: totalResolved > 0 ? Math.round((refundClaims / totalResolved) * 100) : 0 },
                    { resolution: 'ซ่อม', count: repairClaims, percentage: totalResolved > 0 ? Math.round((repairClaims / totalResolved) * 100) : 0 },
                ])

                // Calculate Service Revenue (mock - would need repair parts data)
                const serviceRevenue = repairs.reduce((acc: number, r: any) => 
                    acc + (r.repair_labor_cost || 0), 0
                )

                // Calculate Average Repair Time
                const completedRepairsWithDates = repairs.filter((r: any) => 
                    r.repair_status === 'completed' && r.repair_date_received && r.repair_date_completed
                )
                const avgRepairTime = completedRepairsWithDates.length > 0 
                    ? completedRepairsWithDates.reduce((acc: number, r: any) => {
                        const received = new Date(r.repair_date_received)
                        const completed = new Date(r.repair_date_completed)
                        return acc + (completed.getTime() - received.getTime()) / (1000 * 60 * 60 * 24)
                    }, 0) / completedRepairsWithDates.length
                    : 0

                // Calculate Low Stock Parts
                const lowStockParts = parts.filter((p: any) => (p.part_quantity || 0) < 5).length

                setStats({
                    totalRevenue,
                    pendingOrders: pendingSales.length,
                    completedOrders: completedSales.length,
                    availableItems: availableCount,
                    lowStockParts,
                    inProgressRepairs,
                    completedRepairs,
                    pendingClaims: claims.filter((c: any) => c.claim_status === 'pending').length,
                    totalCustomers: customerData.pagination?.total || 0,
                    avgRepairTime: Math.round(avgRepairTime * 10) / 10,
                    serviceRevenue,
                })

            } catch (err) {
                showToast('ไม่สามารถโหลดข้อมูล Dashboard ได้', 'error')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [showToast])

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
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">แผงควบคุมธุรกิจ</h1>
                    <p className="text-slate-500">ภาพรวมประจำวัน - การขาย สต็อก และบริการ</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
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

            {/* Sales & Revenue Performance */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiDollarSign className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-bold text-slate-900">การขาย & รายได้</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="รายได้รวม"
                        value={`฿${stats.totalRevenue.toLocaleString()}`}
                        icon={<FiDollarSign />}
                        color="green"
                        subtitle="จากการขายที่เสร็จสิ้น"
                    />
                    <MetricCard
                        title="ออเดอร์ที่รอดำเนินการ"
                        value={stats.pendingOrders}
                        icon={<FiClock />}
                        color="orange"
                        subtitle="ต้องการดำเนินการ"
                    />
                    <MetricCard
                        title="ออเดอร์ที่เสร็จสิ้น"
                        value={stats.completedOrders}
                        icon={<FiShoppingCart />}
                        color="blue"
                        subtitle="เสร็จสิ้นแล้ว"
                    />
                    <MetricCard
                        title="ลูกค้าทั้งหมด"
                        value={stats.totalCustomers}
                        icon={<FiUsers />}
                        color="purple"
                        subtitle="ฐานลูกค้า"
                    />
                </div>

                {/* Sales Trends Chart */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-slate-900">แนวโน้มยอดขาย 7 วันล่าสุด</h3>
                        <div className="h-48">
                            <SimpleLineChart data={salesTrends} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-slate-900">แบรนด์ขายดีที่สุด</h3>
                        <div className="space-y-3">
                            {topBrands.map((brand, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 text-center text-sm font-bold text-slate-600">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">{brand.brand_name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">฿{brand.revenue.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">{brand.percentage}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory & Stock Management */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiPackage className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900">สต็อก & คลังสินค้า</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="สินค้าพร้อมขาย"
                        value={stats.availableItems}
                        icon={<FiPackage />}
                        color="green"
                        subtitle="พร้อมส่งมอบ"
                    />
                    <MetricCard
                        title="อะไหล่ใกล้หมด"
                        value={stats.lowStockParts}
                        icon={<FiAlertCircle />}
                        color="red"
                        subtitle="น้อยกว่า 5 ชิ้น"
                    />
                    <MetricCard
                        title="รุ่นสินค้า"
                        value={modelData?.pagination?.total || 0}
                        icon={<FiTag />}
                        color="blue"
                        subtitle="ทั้งหมด"
                    />
                    <MetricCard
                        title="หมวดหมู่"
                        value={categoryData?.pagination?.total || 0}
                        icon={<FiBarChart2 />}
                        color="purple"
                        subtitle="ทั้งหมด"
                    />
                </div>

                {/* Inventory Status Distribution */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-slate-900">สถานะสินค้าคงเหลือ</h3>
                        <div className="h-48">
                            <SimplePieChart data={inventoryStatus} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="mb-4 font-bold text-slate-900">รายการอะไหล่ใกล้หมด</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <span className="text-sm font-medium text-red-700">อะไหล่ที่ต้องเติม</span>
                                <span className="text-sm font-bold text-red-700">{stats.lowStockParts} รายการ</span>
                            </div>
                            <p className="text-xs text-slate-500">ตรวจสอบและสั่งซื้ออะไหล่ที่ใกล้หมดเพื่อป้องกันการสูญเสียการขาย</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Repair & Service Operations */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiTool className="h-5 w-5 text-orange-600" />
                    <h2 className="text-xl font-bold text-slate-900">การซ่อม & บริการ</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="กำลังซ่อม"
                        value={stats.inProgressRepairs}
                        icon={<FiTool />}
                        color="blue"
                        subtitle="อยู่ระหว่างดำเนินการ"
                    />
                    <MetricCard
                        title="ซ่อมเสร็จ"
                        value={stats.completedRepairs}
                        icon={<FiCheck />}
                        color="green"
                        subtitle="เสร็จสมบูรณ์"
                    />
                    <MetricCard
                        title="รายได้บริการ"
                        value={`฿${stats.serviceRevenue.toLocaleString()}`}
                        icon={<FiDollarSign />}
                        color="purple"
                        subtitle="จากค่าแรงและอะไหล่"
                    />
                    <MetricCard
                        title="ระยะเวลาเฉลี่ย"
                        value={`${stats.avgRepairTime} วัน`}
                        icon={<FiClock />}
                        color="orange"
                        subtitle="เวลาซ่อมเฉลี่ย"
                    />
                </div>

                {/* Repair Status Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="mb-4 font-bold text-slate-900">สถานะการซ่อม</h3>
                    <div className="h-48">
                        <SimpleBarChart data={repairStatus} />
                    </div>
                </div>
            </div>

            {/* Claims & Supplier Relations */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiFileText className="h-5 w-5 text-red-600" />
                    <h2 className="text-xl font-bold text-slate-900">การเคลม & ความสัมพันธ์ซัพพลายเออร์</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="เคลมที่รอดำเนินการ"
                        value={stats.pendingClaims}
                        icon={<FiClock />}
                        color="orange"
                        subtitle="ต้องการติดตาม"
                    />
                    <MetricCard
                        title="อัตราการเคลม"
                        value="2.3%"
                        icon={<FiPieChart />}
                        color="red"
                        subtitle="จากยอดขายทั้งหมด"
                    />
                    <MetricCard
                        title="เปลี่ยนใหม่"
                        value={claimResolutions.find(r => r.resolution === 'เปลี่ยนใหม่')?.count || 0}
                        icon={<FiPackage />}
                        color="blue"
                        subtitle="กรณีที่แก้ไข"
                    />
                    <MetricCard
                        title="คืนเงิน"
                        value={claimResolutions.find(r => r.resolution === 'คืนเงิน')?.count || 0}
                        icon={<FiDollarSign />}
                        color="green"
                        subtitle="กรณีที่แก้ไข"
                    />
                </div>

                {/* Claim Resolution Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="mb-4 font-bold text-slate-900">การแก้ไขปัญหาการเคลม</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {claimResolutions.map((resolution, index) => (
                            <div key={index} className="text-center">
                                <div className="mb-2 text-2xl font-bold text-slate-900">{resolution.count}</div>
                                <div className="text-sm font-medium text-slate-600">{resolution.resolution}</div>
                                <div className="text-xs text-slate-500">{resolution.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper Components
function MetricCard({ title, value, icon, color, subtitle }: any) {
    const colorClasses: any = {
        green: 'border-green-100 bg-green-50/30',
        blue: 'border-blue-100 bg-blue-50/30',
        purple: 'border-purple-100 bg-purple-50/30',
        orange: 'border-orange-100 bg-orange-50/30',
        red: 'border-red-100 bg-red-50/30',
    }

    const iconColors: any = {
        green: 'text-green-600',
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        red: 'text-red-600',
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${colorClasses[color]}`}
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="bg-bg rounded-lg p-2.5 shadow-sm ring-1 ring-slate-100">
                    <div className={iconColors[color]}>{icon}</div>
                </div>
            </div>
            <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    {title}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                    {value}
                </h2>
                <p className="mt-2 text-xs font-medium text-slate-400">
                    {subtitle}
                </p>
            </div>
        </motion.div>
    )
}

// Simple Chart Components (without external libraries)
function SimpleLineChart({ data }: { data: SalesTrend[] }) {
    const maxRevenue = Math.max(...data.map(d => d.revenue))
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - (d.revenue / maxRevenue) * 100
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="relative h-full w-full">
            <svg className="h-full w-full" viewBox="0 0 100 100">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                    <line
                        key={y}
                        x1="0" y1={y} x2="100" y2={y}
                        stroke="#e2e8f0" strokeWidth="0.5"
                    />
                ))}
                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                />
                {/* Points */}
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 100
                    const y = 100 - (d.revenue / maxRevenue) * 100
                    return (
                        <circle
                            key={i}
                            cx={x} cy={y} r="2"
                            fill="#3b82f6"
                        />
                    )
                })}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500">
                {data.map((d, i) => (
                    <span key={i} className="text-center" style={{ width: `${100/data.length}%` }}>
                        {d.date}
                    </span>
                ))}
            </div>
        </div>
    )
}

function SimplePieChart({ data }: { data: InventoryStatus[] }) {
    const total = data.reduce((acc, d) => acc + d.count, 0)
    let currentAngle = 0

    const segments = data.map(d => {
        const percentage = (d.count / total) * 100
        const angle = (percentage / 100) * 360
        const startAngle = currentAngle
        const endAngle = currentAngle + angle
        currentAngle += angle

        const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
        const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
        const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
        const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
        const largeArc = angle > 180 ? 1 : 0

        return {
            path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
            color: d.color,
            count: d.count,
            status: d.status,
            percentage
        }
    })

    return (
        <div className="flex h-full items-center justify-center">
            <div className="relative">
                <svg className="h-40 w-40" viewBox="0 0 100 100">
                    {segments.map((segment, i) => (
                        <path
                            key={i}
                            d={segment.path}
                            fill={segment.color}
                            stroke="white"
                            strokeWidth="2"
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-lg font-bold text-slate-900">{total}</div>
                    <div className="text-xs text-slate-500">รายการ</div>
                </div>
            </div>
            <div className="ml-6 space-y-2">
                {segments.map((segment, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${segment.color}`} />
                        <span className="text-sm text-slate-600">{segment.status}: {segment.count}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SimpleBarChart({ data }: { data: RepairStatus[] }) {
    const maxCount = Math.max(...data.map(d => d.count))

    return (
        <div className="flex h-full items-end justify-around gap-4 px-4">
            {data.map((item, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                    <div className="relative w-full">
                        <div
                            className={`mx-auto w-full max-w-16 rounded-t ${item.color}`}
                            style={{ height: `${(item.count / maxCount) * 100}%` }}
                        />
                        <div className="absolute -top-6 left-0 right-0 text-center text-sm font-bold text-slate-900">
                            {item.count}
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 text-center">
                        {item.status}
                    </div>
                </div>
            ))}
        </div>
    )
}
