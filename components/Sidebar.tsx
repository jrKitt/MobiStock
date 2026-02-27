import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
    HiHome, 
    HiClipboardDocumentList, 
    HiWrench, 
    HiExclamationTriangle,
    HiViewColumns,
    HiListBullet,
    HiCubeTransparent,
    HiCog6Tooth,
    HiBuildingOffice2,
    HiUserGroup,
    HiUsers,
    HiArrowRightOnRectangle,
    HiUser,
    HiChevronDown,
    HiChevronLeft,
    HiXMark
} from 'react-icons/hi2'

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
            title: 'ภาพรวม',
            items: [
                {
                    icon: <HiHome className="h-4 w-4" />,
                    label: 'แดชบอร์ด',
                    href: '/dashboard',
                },
                {
                    icon: <HiClipboardDocumentList className="h-4 w-4" />,
                    label: 'ใบสั่งขาย',
                    href: '/transactions/sale-orders',
                },
            ],
        },
        {
            title: 'บริการซ่อม',
            items: [
                {
                    icon: <HiWrench className="h-4 w-4" />,
                    label: 'คำขอซ่อม',
                    href: '/services/repair-orders',
                },
                {
                    icon: <HiExclamationTriangle className="h-4 w-4" />,
                    label: 'การแจ้งเรียกร้อง',
                    href: '/services/claim-orders',
                },
            ],
        },
        {
            title: 'คลังสินค้า',
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
                    icon: <HiViewColumns className="h-4 w-4" />,
                    label: 'รุ่นสินค้า',
                    href: '/inventory/models',
                },
                {
                    icon: <HiListBullet className="h-4 w-4" />,
                    label: 'หมวดหมู่',
                    href: '/base-tables/categories',
                },
                {
                    icon: <HiCubeTransparent className="h-4 w-4" />,
                    label: 'สต็อกสินค้า',
                    href: '/inventory/items',
                },
                {
                    icon: <HiCog6Tooth className="h-4 w-4" />,
                    label: 'อะไหล่',
                    href: '/base-tables/spare-parts',
                },
            ],
        },
        {
            title: 'การจัดการ',
            items: [
                {
                    icon: <HiBuildingOffice2 className="h-4 w-4" />,
                    label: 'ยี่ห้อ',
                    href: '/base-tables/brands',
                },
                {
                    icon: <HiUserGroup className="h-4 w-4" />,
                    label: 'ซัพพลายเออร์',
                    href: '/base-tables/suppliers',
                },
                {
                    icon: <HiUsers className="h-4 w-4" />,
                    label: 'ลูกค้า',
                    href: '/base-tables/customers',
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
                            <HiChevronLeft
                                className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${
                                    isCollapsed ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="block rounded-lg p-2 transition-all duration-200 hover:bg-gray-100 lg:hidden"
                        >
                            <HiXMark className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                    {menuGroups.map((group, index) => (
                        <div
                            key={group.title}
                            className={index !== 0 ? 'pt-4' : ''}
                        >
                            {(!isCollapsed || isOpen) && (
                                <h3 className="mb-2 px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                    {group.title}
                                </h3>
                            )}
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
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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
                                    <HiArrowRightOnRectangle className="h-4 w-4" />
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
                                <HiUser className="h-5 w-5" />
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
                                <HiChevronDown
                                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                                />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
