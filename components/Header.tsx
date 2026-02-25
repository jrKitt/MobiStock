'use client'

import { useMemo } from 'react'

interface HeaderProps {
    onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    const currentDate = useMemo(() => {
        return new Intl.DateTimeFormat('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(new Date())
    }, [])

    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
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
                            แดชบอร์ด
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
                            ภาพรวมการจัดการสต็อก
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
