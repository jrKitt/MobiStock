export interface Supplier {
    supplier_id?: number
    supplier_name: string
    supplier_phone: string
    supplier_email: string
    supplier_address: string
    supplier_contact_person: string
    image_url?: string | null
    create_at?: Date
    update_at?: Date
}
