export interface ProductModel {
    model_id?: number
    model_name: string
    model_made_in: string
    model_warranty_duration: number
    brand_id: number
    category_id: number
    image_url?: string | null
    create_at?: Date
    update_at?: Date
}
