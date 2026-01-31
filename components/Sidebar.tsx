import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
    user?: any
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const router = useRouter()
    const { showToast } = useToast()

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
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
            })
            if (res.ok) {
                showToast('ออกจากระบบสำเร็จ', 'success')
                router.push('/auth/login')
            }
        } catch {
            showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error')
        }
    }

    const menuItems = [
        {
            icon: (
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            label: 'Dashboard',
            href: '/dashboard',
        },
        {
            icon: (
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
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            ),
            label: 'สินค้า',
            href: '/products',
        },
        {
            icon: (
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                </svg>
            ),
            label: 'คลังสินค้า',
            href: '/inventory',
        },
        {
            icon: (
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            label: 'รายงาน',
            href: '/reports',
        },
        {
            icon: (
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
            label: 'ตั้งค่า',
            href: '/settings',
        },
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
                className={`fixed inset-y-0 left-0 z-30 flex h-screen flex-col border-r border-gray-200 bg-linear-to-b from-white to-gray-50 shadow-sm transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
            >
                <div className="border-b border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                        {(!isCollapsed || isOpen) && (
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">
                                        MobiStock
                                    </h1>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                                        ระบบจัดการสต็อก
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

                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {menuItems.map((item) => {
                        const isActive =
                            item.href === '/dashboard'
                                ? pathname === '/dashboard'
                                : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose} // Close sidebar on navigate (mobile)
                                className={`group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                                    isActive
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                <span
                                    className={`transition-transform duration-200 ${
                                        isActive ? '' : 'group-hover:scale-110'
                                    }`}
                                >
                                    {item.icon}
                                </span>
                                {(!isCollapsed || isOpen) && ( // Show label if not collapsed OR if open (mobile always shows full width)
                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>
                                )}
                                {isActive && (!isCollapsed || isOpen) && (
                                    <svg
                                        className="ml-auto h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div
                    className="border-t border-gray-200 bg-white p-4"
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
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-blue-700 font-bold text-white shadow-lg ring-2 ring-blue-100">
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
