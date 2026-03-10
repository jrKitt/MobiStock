export interface SaleOrderImage {
    image_id?: number
    sale_id: number
    image_url: string
    image_caption?: string | null
    create_at?: Date
}
