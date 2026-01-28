'use client'

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type }])

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onRemove={removeToast}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({
    toast,
    onRemove,
}: {
    toast: Toast
    onRemove: (id: string) => void
}) {
    // Minimal style: dark charcoal background, white text, simple icon
    const icons = {
        success: (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                    ></path>
                </svg>
            </div>
        ),
        error: (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M6 18L18 6M6 6l12 12"
                    ></path>
                </svg>
            </div>
        ),
        info: (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
            </div>
        ),
        warning: (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
                <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                </svg>
            </div>
        ),
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
                opacity: 0,
                y: 10,
                scale: 0.95,
                transition: { duration: 0.2 },
            }}
            layout
            className="flex min-w-75 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-lg shadow-gray-200/50 transition-colors hover:bg-gray-50"
            onClick={() => onRemove(toast.id)}
        >
            <div className="shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium text-gray-700">
                {toast.message}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove(toast.id)
                }}
                className="text-gray-400 hover:text-gray-600"
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
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                    ></path>
                </svg>
            </button>
        </motion.div>
    )
}
