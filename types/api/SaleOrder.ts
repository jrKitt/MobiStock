export interface SaleOrder {
    sale_id?: number
    sale_code: string
    sale_date: Date
    sale_total_amount: number
    sale_status: string
    customer_id: number
    create_at?: Date
    update_at?: Date
}
