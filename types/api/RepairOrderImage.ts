export interface RepairOrderImage {
    image_id?: number
    repair_id: number
    image_url: string
    image_caption?: string | null
    image_type?: 'received' | 'completed'
    create_at?: Date
}
