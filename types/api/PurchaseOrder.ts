export interface PurchaseOrder {
    po_id?: number
    po_code: string
    po_date: Date
    po_status: string
    supplier_id: number
    create_at?: Date
    update_at?: Date
}
