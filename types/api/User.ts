export interface User {
    user_id?: number
    username: string
    email: string
    password?: string // Optional because we usually don't want to send it to the frontend
    role?: 'admin' | 'staff'
    created_at?: Date
}
