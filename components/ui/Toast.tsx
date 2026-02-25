'use client'

import { ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export function useToast() {
    return {
        showToast: (_message: string, _type: ToastType) => {},
    }
}

export function ToastProvider({ children }: { children: ReactNode }) {
    return children
}
