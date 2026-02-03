export interface RepairOrderPart {
    repair_id: number
    part_id: number
    repair_part_quantity: number
    repair_part_unit_price: number
    create_at?: Date
    update_at?: Date
}
