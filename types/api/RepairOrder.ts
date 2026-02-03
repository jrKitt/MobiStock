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
