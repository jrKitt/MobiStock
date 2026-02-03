export interface ClaimOrder {
    claim_id?: number
    claim_code: string
    claim_date_received: Date
    claim_date_returned?: Date
    claim_status: string
    claim_resolution: string
    supplier_id: number
    customer_id: number
    item_id: number
    create_at?: Date
    update_at?: Date
}
