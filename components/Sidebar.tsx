import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
    user?: {
        id: number
        email: string
        username: string
    } | null
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleLogout = async () => {
        const res = await fetch('/api/auth/logout', {
            method: 'POST',
        })
        if (res.ok) {
            router.push('/auth/login')
        }
    }

    const menuGroups = [
        {
            title: 'Overview',
            items: [
                {
                    icon: (
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
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                    ),
                    label: 'Dashboard',
                    href: '/dashboard',
                },
            ],
        },
        {
            title: 'Inventory',
            items: [
                // {
                //     icon: (
                //         <svg
                //             className="h-4 w-4"
                //             fill="none"
                //             stroke="currentColor"
                //             viewBox="0 0 24 24"
                //         >
                //             <path
                //                 strokeLinecap="round"
                //                 strokeLinejoin="round"
                //                 strokeWidth={2}
                //                 d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                //             />
                //         </svg>
                //     ),
                //     label: 'Stock Items',
                //     href: '/inventory',
                // },
                {
                    icon: (
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
                                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                            />
                        </svg>
                    ),
                    label: 'Models',
                    href: '/inventory/models',
                },
                {
                    icon: (
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
                                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                            />
                        </svg>
                    ),
                    label: 'Categories',
                    href: '/base-tables/categories',
                },
                {
                    icon: (
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
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                        </svg>
                    ),
                    label: 'Stock',
                    href: '/inventory/items',
                },
            ],
        },
        {
            title: 'Management',
            items: [
                {
                    icon: (
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
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    ),
                    label: 'Brands',
                    href: '/base-tables/brands',
                },
                {
                    icon: (
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
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    ),
                    label: 'Suppliers',
                    href: '/base-tables/suppliers',
                },
                {
                    icon: (
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
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                    ),
                    label: 'Customers',
                    href: '/base-tables/customers',
                },
                {
                    icon: (
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
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    ),
                    label: 'Spare Parts',
                    href: '/base-tables/spare-parts',
                },
            ],
        },
        {
            title: 'Transactions',
            items: [
                {
                    icon: (
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
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    ),
                    label: 'Purchase Orders',
                    href: '/transactions/purchase-orders',
                },
                {
                    icon: (
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
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                    ),
                    label: 'Sale Orders',
                    href: '/transactions/sale-orders',
                },
            ],
        },
        // {
        //     title: 'System',
        //     items: [
        //         {
        //             icon: (
        //                 <svg
        //                     className="h-4 w-4"
        //                     fill="none"
        //                     stroke="currentColor"
        //                     viewBox="0 0 24 24"
        //                 >
        //                     <path
        //                         strokeLinecap="round"
        //                         strokeLinejoin="round"
        //                         strokeWidth={2}
        //                         d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        //                     />
        //                 </svg>
        //             ),
        //             label: 'Reports',
        //             href: '/reports',
        //         },
        //         {
        //             icon: (
        //                 <svg
        //                     className="h-4 w-4"
        //                     fill="none"
        //                     stroke="currentColor"
        //                     viewBox="0 0 24 24"
        //                 >
        //                     <path
        //                         strokeLinecap="round"
        //                         strokeLinejoin="round"
        //                         strokeWidth={2}
        //                         d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        //                     />
        //                     <path
        //                         strokeLinecap="round"
        //                         strokeLinejoin="round"
        //                         strokeWidth={2}
        //                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        //                     />
        //                 </svg>
        //             ),
        //             label: 'Settings',
        //             href: '/settings',
        //         },
        //     ],
        // },
    ]

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden"
                    onClick={onClose}
                />
            )}

            <div
                className={`fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-slate-200 bg-white shadow-xs transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
            >
                <div className="border-b border-slate-100 p-6">
                    <div className="flex items-center justify-between">
                        {(!isCollapsed || isOpen) && (
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                                        MobiStock
                                    </h1>
                                    <p className="mt-0.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                        Inventory System
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Desktop Collapse Button */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden rounded-lg p-2 transition-all duration-200 hover:bg-gray-100 lg:block"
                            title={isCollapsed ? 'ขยาย' : 'ย่อ'}
                        >
                            <svg
                                className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${
                                    isCollapsed ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="block rounded-lg p-2 transition-all duration-200 hover:bg-gray-100 lg:hidden"
                        >
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                    {menuGroups.map((group) => (
                        <div key={group.title} className="space-y-1">
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive =
                                        item.href === '/dashboard'
                                            ? pathname === '/dashboard'
                                            : pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`group flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                                            }`}
                                        >
                                            <span
                                                className={`transition-transform duration-200 ${
                                                    isActive
                                                        ? ''
                                                        : 'group-hover:scale-110'
                                                }`}
                                            >
                                                {item.icon}
                                            </span>
                                            {(!isCollapsed || isOpen) && (
                                                <span className="text-sm font-medium">
                                                    {item.label}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div
                    className="border-t border-slate-100 bg-white p-4"
                    ref={menuRef}
                >
                    <div className="relative">
                        {showUserMenu && (
                            <div
                                className={`absolute bottom-full left-0 mb-2 w-full min-w-50 rounded-lg border border-gray-100 bg-white shadow-lg ${isCollapsed && !isOpen ? 'bottom-0 left-full ml-2' : ''}`}
                            >
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
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
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    ออกจากระบบ
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 hover:bg-gray-50 ${
                                isCollapsed && !isOpen ? 'justify-center' : ''
                            }`}
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 shadow-xs ring-1 ring-slate-200">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            {(!isCollapsed || isOpen) && (
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                        {user?.username || 'Admin'}
                                    </p>
                                    <p className="truncate text-xs text-gray-600">
                                        {user?.email || 'admin@mobistock.com'}
                                    </p>
                                </div>
                            )}
                            {(!isCollapsed || isOpen) && (
                                <svg
                                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
