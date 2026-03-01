export interface ProductItem {
    item_id?: number
    item_serial_number: string
    item_imei: string
    item_lot_number: string
    item_status: 'Available' | 'Sold' | 'Damaged' | 'Reserved'
    model_id: number
    create_at?: Date
    update_at?: Date
}
