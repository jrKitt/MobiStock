'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useAppSettings } from '@/hooks/useAppSettings'

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
    useAppSettings() // This will set tab icon and title based on settings
    
    return (
        <div className="bg-bg flex min-h-screen">
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
