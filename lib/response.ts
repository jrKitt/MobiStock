import { NextResponse } from 'next/server'

interface ApiResponse<T> {
    success: boolean
    message: string
    data?: T
    error?: unknown
}

export function successResponse<T>(
    data: T,
    message: string = 'Success',
    status: number = 200
) {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    }
    return NextResponse.json(response, { status })
}

export function errorResponse(
    message: string,
    error?: unknown,
    status: number = 500
) {
    const response: ApiResponse<null> = {
        success: false,
        message,
        error,
    }
    return NextResponse.json(response, { status })
}
