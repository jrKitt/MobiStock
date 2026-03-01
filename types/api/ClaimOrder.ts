export interface ClaimOrder {
    claim_id?: number
    claim_code: string
    claim_date_received: Date
    claim_date_returned?: Date
    claim_status: 'pending' | 'in_review' | 'resolved' | 'rejected'
    claim_resolution: 'unknown' | 'replacement' | 'refund' | 'repair'
    supplier_id?: number | null
    customer_id: number
    item_id: number
    create_at?: Date
    update_at?: Date
}
