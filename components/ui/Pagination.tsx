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
    
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white px-6 py-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">
                แสดง {startItem} ถึง {endItem} จาก {totalItems} รายการ
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ก่อนหน้า
                </button>

                <div className="flex items-center">
                    {visiblePages.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`dots-${index}`} className="relative inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                                    ...
                                </span>
                            )
                        }

                        const pageNum = typeof page === 'number' ? page : 0
                        return (
                            <button
                                key={page}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    pageNum === currentPage
                                        ? 'z-10 border border-blue-500 bg-blue-600 text-white'
                                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
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
                    className="relative inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <label className="text-sm font-medium text-slate-700">
                    รายการ
                </label>
            </div>
        </div>
    )
}
