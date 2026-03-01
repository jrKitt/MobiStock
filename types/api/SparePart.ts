export interface SparePart {
    part_id?: number
    part_name: string
    part_status: 'Available' | 'Out of Stock'
    image_url?: string | null
    create_at?: Date
    update_at?: Date
}
