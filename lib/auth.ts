import { JWTPayload, SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET_KEY =
    process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-prod'
const key = new TextEncoder().encode(SECRET_KEY)

export async function signToken(payload: JWTPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 days
        .sign(key)
}

export async function verifyToken(token: string) {
    try {
        const {
            payload,
        }: {
            payload: {
                id: number
                email: string
                username: string
            }
        } = await jwtVerify(token, key)
        return payload
    } catch (error) {
        return null
    }
}

export async function getSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token_mobi')?.value
    if (!token) return null
    return await verifyToken(token)
}
