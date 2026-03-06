export interface RepairOrder {
    repair_id?: number
    repair_problem_desc: string
    repair_technician_note: string
    repair_date_received: Date
    repair_date_completed?: Date
    repair_labor_cost: number
    repair_status: 'received' | 'in_progress' | 'completed' | 'cancelled'
    customer_id: number
    item_id: number
    create_by?: string
    update_by?: string
    create_at?: Date
    update_at?: Date
}
