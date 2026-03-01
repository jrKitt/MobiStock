'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

interface HeaderProps {
    onMenuClick?: () => void
}

const routeInfo: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: 'แดชบอร์ด', subtitle: 'ภาพรวมการจัดการสต็อก' },
    '/inventory/models': {
        title: 'รุ่นสินค้า',
        subtitle: 'จัดการข้อมูลรุ่นสินค้า',
    },
    '/inventory/items': {
        title: 'สต็อกสินค้า',
        subtitle: 'จัดการรายการสต็อกสินค้า',
    },
    '/base-tables/categories': {
        title: 'หมวดหมู่',
        subtitle: 'จัดการหมวดหมู่สินค้า',
    },
    '/base-tables/brands': {
        title: 'ยี่ห้อ',
        subtitle: 'จัดการข้อมูลยี่ห้อสินค้า',
    },
    '/base-tables/suppliers': {
        title: 'ซัพพลายเออร์',
        subtitle: 'จัดการข้อมูลซัพพลายเออร์',
    },
    '/base-tables/customers': {
        title: 'ลูกค้า',
        subtitle: 'จัดการข้อมูลลูกค้า',
    },
    '/base-tables/spare-parts': {
        title: 'อะไหล่',
        subtitle: 'จัดการข้อมูลอะไหล่',
    },
    '/transactions/sale-orders': {
        title: 'ใบสั่งขาย',
        subtitle: 'จัดการใบสั่งขายสินค้า',
    },
    '/settings': {
        title: 'ตั้งค่า',
        subtitle: 'จัดการค่าพื้นฐานของร้าน',
    },
}

export default function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname()

    // Find the longest matching path prefix for dynamic routes
    const currentRoute = useMemo(() => {
        if (!pathname) return routeInfo['/dashboard']

        const matchedKey = Object.keys(routeInfo)
            .filter((key) => pathname.startsWith(key))
            .sort((a, b) => b.length - a.length)[0]

        return matchedKey
            ? routeInfo[matchedKey]
            : { title: 'ระบบจัดการสต็อก', subtitle: 'MobiStock' }
    }, [pathname])

    const currentDate = useMemo(() => {
        return new Intl.DateTimeFormat('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date())
    }, [])

    return (
        <header className="bg-bg/80 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-md">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    {/* Hamburger Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>

                    <div>
                        <h1 className="text-xl font-bold text-gray-900 lg:text-3xl">
                            {currentRoute.title}
                        </h1>
                        <p className="mt-1 hidden items-center gap-2 text-sm text-gray-600 sm:flex">
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
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            {currentRoute.subtitle}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="mr-2 hidden text-right sm:block lg:mr-4">
                        <p className="text-xs text-slate-500">วันที่</p>
                        <p className="text-sm font-medium text-gray-700">
                            {currentDate}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    )
}
