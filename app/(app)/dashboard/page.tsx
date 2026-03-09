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
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

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

export default function DashboardPage() {
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
        <div className="space-y-8 text-black">
            
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    {/* <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">ภาพรวมธุรกิจของคุณ</p> */}
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <FiRefreshCw className="h-4 w-4" />
                        รีเฟรช
                    </button>
                </div>
            </div>

            
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiDollarSign className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-slate-900">การขาย</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="รายได้รวม"
                        value={`฿${stats.totalRevenue.toLocaleString()}`}
                        icon={<FiDollarSign />}
                        color="green"
                    />
                    <MetricCard
                        title="ออเดอร์ที่รอดำเนินการ"
                        value={stats.pendingOrders}
                        icon={<FiClock />}
                        color="orange"
                    />
                    <MetricCard
                        title="ออเดอร์ที่เสร็จสิ้น"
                        value={stats.completedOrders}
                        icon={<FiShoppingCart />}
                        color="blue"
                    />
                    <MetricCard
                        title="ลูกค้าทั้งหมด"
                        value={stats.totalCustomers}
                        icon={<FiUsers />}
                        color="purple"
                    />
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="mb-4 font-semibold text-slate-900">แนวโน้มยอดขาย 7 วัน</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fontSize: 12 }}
                                        stroke="#64748b"
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12 }}
                                        stroke="#64748b"
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px'
                                        }}
                                        formatter={(value: any) => [`฿${value.toLocaleString()}`, 'รายได้']}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="mb-4 font-semibold text-slate-900">ยี่ห้อที่ขายดีที่สุด</h3>
                        <div className="space-y-3">
                            {topBrands.slice(0, 5).map((brand, index) => (
                                <div key={brand.brand_name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                            index === 0 ? 'bg-yellow-500' : 
                                            index === 1 ? 'bg-gray-400' : 
                                            index === 2 ? 'bg-orange-600' : 'bg-slate-400'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-slate-900">{brand.brand_name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-slate-900">฿{brand.revenue.toLocaleString()}</div>
                                        <div className="text-sm text-slate-500">{brand.percentage}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiPackage className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">สต็อกสินค้า</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="สินค้าพร้อมขาย"
                        value={stats.availableItems}
                        icon={<FiPackage />}
                        color="blue"
                    />
                    <MetricCard
                        title="อะไหล่ใกล้หมด"
                        value={stats.lowStockParts}
                        icon={<FiAlertCircle />}
                        color="red"
                    />
                    <MetricCard
                        title="รุ่นสินค้า"
                        value={modelData?.pagination?.total || 0}
                        icon={<FiTag />}
                        color="purple"
                    />
                    <MetricCard
                        title="หมวดหมู่"
                        value={categoryData?.pagination?.total || 0}
                        icon={<FiBarChart2 />}
                        color="green"
                    />
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h3 className="mb-4 font-semibold text-slate-900">สถานะสินค้า</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="count"
                                >
                                    {inventoryStatus.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={
                                                entry.color === 'bg-green-500' ? '#10b981' :
                                                entry.color === 'bg-blue-500' ? '#3b82f6' :
                                                entry.color === 'bg-red-500' ? '#ef4444' :
                                                entry.color === 'bg-orange-500' ? '#f97316' : '#6b7280'
                                            } 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: any, name: any) => [value, 'จำนวน']}
                                    contentStyle={{ 
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {inventoryStatus.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div 
                                        className="h-3 w-3 rounded-full" 
                                        style={{
                                            backgroundColor: 
                                                item.color === 'bg-green-500' ? '#10b981' :
                                                item.color === 'bg-blue-500' ? '#3b82f6' :
                                                item.color === 'bg-red-500' ? '#ef4444' :
                                                item.color === 'bg-orange-500' ? '#f97316' : '#6b7280'
                                        }}
                                    />
                                    <span className="text-xs text-slate-600">{item.status} ({item.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

         
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiTool className="h-5 w-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-slate-900">การซ่อม</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">กำลังซ่อม</p>
                                <p className="text-xl font-bold text-slate-900">{stats.inProgressRepairs}</p>
                            </div>
                            <FiTool className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">ซ่อมเสร็จ</p>
                                <p className="text-xl font-bold text-slate-900">{stats.completedRepairs}</p>
                            </div>
                            <FiCheck className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">รายได้บริการ</p>
                                <p className="text-xl font-bold text-slate-900">฿{stats.serviceRevenue.toLocaleString()}</p>
                            </div>
                            <FiDollarSign className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">ระยะเวลาเฉลี่ย</p>
                                <p className="text-xl font-bold text-slate-900">{stats.avgRepairTime} วัน</p>
                            </div>
                            <FiClock className="h-8 w-8 text-orange-500" />
                        </div>
                    </div>
                </div>

         
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FiFileText className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-slate-900">การเคลม</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">เคลมที่รอดำเนินการ</p>
                                <p className="text-xl font-bold text-slate-900">{stats.pendingClaims}</p>
                            </div>
                            <FiFileText className="h-8 w-8 text-orange-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">เปลี่ยนใหม่</p>
                                <p className="text-xl font-bold text-slate-900">{claimResolutions.find(r => r.resolution === 'เปลี่ยนใหม่')?.count || 0}</p>
                            </div>
                            <FiPackage className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">คืนเงิน</p>
                                <p className="text-xl font-bold text-slate-900">{claimResolutions.find(r => r.resolution === 'คืนเงิน')?.count || 0}</p>
                            </div>
                            <FiDollarSign className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">อัตราการเคลม</p>
                                <p className="text-xl font-bold text-slate-900">2.3%</p>
                            </div>
                            <FiPieChart className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}

// Helper Components
function MetricCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-600">{title}</p>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    color === 'green' ? 'bg-green-100 text-green-600' :
                    color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    'bg-slate-100 text-slate-600'
                }`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

