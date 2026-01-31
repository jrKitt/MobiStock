'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

export default function LayoutMain({ 
    children,
    user 
}: { 
    children: React.ReactNode
    user?: any 
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Sidebar with overlay props */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 lg:p-8 overflow-x-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
