import React from 'react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems: number
    pageSize: number
    onPageSizeChange?: (size: number) => void
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    pageSize,
    onPageSizeChange
}: PaginationProps) {
    const getVisiblePages = () => {
        const delta = 2
        const range = []
        const rangeWithDots = []
        let left = currentPage - delta
        let right = currentPage + delta + 1

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || i === left || i === right) {
                range.push(i)
            } else if (i === left - 1 || i === right + 1) {
                rangeWithDots.push(i)
            }
        }

        for (let i = 0; i < range.length; i++) {
            if (rangeWithDots.includes(range[i])) {
                if (range[i - 1] && rangeWithDots.includes(range[i - 1])) {
                    rangeWithDots.push('...')
                }
                rangeWithDots.push(range[i])
            }
        }

        return rangeWithDots
    }

    const visiblePages = getVisiblePages()

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page)
        }
    }

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = parseInt(e.target.value)
        onPageSizeChange?.(newSize)
    }

    return (
        <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-600">
                แสดง {totalItems} รายการ • หน้า {currentPage} จาก {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ก่อนหน้า
                </button>

                <div className="flex items-center">
                    {visiblePages.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`dots-${index}`} className="px-2 text-slate-300">
                                    ...
                                </span>
                            )
                        }

                        const pageNum = typeof page === 'number' ? page : 0
                        return (
                            <button
                                key={page}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    pageNum === currentPage
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        )
                    })}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    หน้าถัดไป
                </button>
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">
                    แสดง
                </label>
                <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 bg-white outline-hidden transition-colors hover:border-blue-300 focus:border-blue-600"
                >
                    <option value={5}>5 รายการ</option>
                    <option value={10}>10 รายการ</option>
                    <option value={25}>25 รายการ</option>
                    <option value={50}>50 รายการ</option>
                </select>
            </div>
        </div>
    )
}
