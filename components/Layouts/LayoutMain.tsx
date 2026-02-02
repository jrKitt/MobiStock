'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

export default function LayoutMain({
    children,
    user,
}: {
    children: React.ReactNode
    user?: {
        id: number
        email: string
        username: string
    } | null
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    return (
        <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
            {/* Sidebar with overlay props */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-x-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
