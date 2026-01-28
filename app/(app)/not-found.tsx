import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-gray-100 p-6">
                <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">404 - ไม่พบหน้าที่ต้องการ</h2>
                <p className="mt-1 text-sm text-gray-500">
                    หน้าที่คุณค้นหาอาจถูกลบหรือยังไม่เปิดใช้งาน
                </p>
            </div>
            <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
                กลับสู่หน้าหลัก
            </Link>
        </div>
    )
}
