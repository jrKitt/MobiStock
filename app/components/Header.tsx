'use client'

import { useState, useEffect } from 'react'

export default function Header() {
    const [currentDate, setCurrentDate] = useState('')

    useEffect(() => {
        const date = new Date()
        const formatter = new Intl.DateTimeFormat('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })

        setCurrentDate(formatter.format(date))
    }, [])

    return (
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-8 py-5">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard
                    </h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
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
                        ภาพรวมการจัดการสต็อกสินค้า
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="mr-4 text-right">
                        <p className="text-xs text-gray-500">วันที่</p>
                        <p className="text-sm font-medium text-gray-700">
                            {currentDate}
                        </p>
                    </div>
                    <button className="relative rounded-lg p-2.5 transition-all duration-200 hover:bg-gray-100">
                        <svg
                            className="h-5 w-5 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>
                </div>
            </div>
        </header>
    )
}
