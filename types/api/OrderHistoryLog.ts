export interface OrderHistoryLog {
    log_id?: number
    order_type: 'sale' | 'repair' | 'claim'
    order_id: number
    action: 'created' | 'updated' | 'deleted' | 'status_changed'
    description?: string
    old_data?: Record<string, unknown> | null
    new_data?: Record<string, unknown> | null
    action_by?: string
    create_at?: Date
}
