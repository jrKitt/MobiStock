export interface SaleOrder {
    sale_id?: number
    sale_code: string
    sale_date: Date
    sale_total_amount: number
    sale_status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled'
    customer_id: number
    create_by?: string
    update_by?: string
    create_at?: Date
    update_at?: Date
    items?: any[]
}
