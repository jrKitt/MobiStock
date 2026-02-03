export interface Brand {
    brand_id?: number
    brand_name: string
    brand_country: string
    create_at?: Date
    update_at?: Date
}

export interface Category {
    category_id?: number
    category_name_th: string
    category_name_en: string
    create_at?: Date
    update_at?: Date
}

export interface Supplier {
    supplier_id?: number
    supplier_name: string
    supplier_phone: string
    supplier_email: string
    supplier_address: string
    supplier_contact_person: string
    create_at?: Date
    update_at?: Date
}

export interface Customer {
    customer_id?: number
    customer_fname: string
    customer_lname: string
    customer_phone: string
    customer_tax_number: string
    customer_address: string
    create_at?: Date
    update_at?: Date
}

export interface ProductModel {
    model_id?: number
    model_name: string
    model_made_in: string
    model_warranty_duration: number
    brand_id: number
    category_id: number
    create_at?: Date
    update_at?: Date
}

export interface ProductItem {
    item_id?: number
    item_serial_number: string
    item_imei: string
    item_lot_number: string
    item_status: string
    model_id: number
    create_at?: Date
    update_at?: Date
}

export interface PurchaseOrder {
    po_id?: number
    po_code: string
    po_date: Date
    po_status: string
    supplier_id: number
    create_at?: Date
    update_at?: Date
}

export interface PurchaseOrderItem {
    po_item_id?: number
    po_price: number
    po_quantity: number
    po_id: number
    model_id: number
    create_at?: Date
    update_at?: Date
}

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

export interface SaleOrderItem {
    sale_item_id?: number
    sale_price: number
    sale_id: number
    item_id: number
    create_at?: Date
    update_at?: Date
}

export interface SparePart {
    part_id?: number
    part_name: string
    part_status: string
    create_at?: Date
    update_at?: Date
}

export interface SupplierSparePart {
    supplier_id: number
    part_id: number
    create_at?: Date
    update_at?: Date
}

export interface RepairOrder {
    repair_id?: number
    repair_problem_desc: string
    repair_technician_note: string
    repair_date_received: Date
    repair_date_completed?: Date
    repair_labor_cost: number
    repair_status: string
    customer_id: number
    item_id: number
    create_at?: Date
    update_at?: Date
}

export interface RepairOrderPart {
    repair_id: number
    part_id: number
    repair_part_quantity: number
    repair_part_unit_price: number
    create_at?: Date
    update_at?: Date
}

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
