import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// CORS headers helper
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': 'https://mobistock.jrkitt.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    }
}

// Handle preflight OPTIONS request
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file received.' },
                { status: 400, headers: corsHeaders() }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Sanitize filename and add timestamp to make it unique
        const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const filename = `${Date.now()}-${originalName}`

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        const path = join(uploadDir, filename)
        await writeFile(path, buffer)

        // Return the public URL for the image
        const url = `/uploads/${filename}`

        return NextResponse.json(
            { url, success: true }, 
            { status: 201, headers: corsHeaders() }
        )
    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json(
            { error: 'Failed to upload file.' },
            { status: 500, headers: corsHeaders() }
        )
    }
}
