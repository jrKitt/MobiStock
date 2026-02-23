'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { SaleOrder, Customer } from '@/types/api'

export default function SaleOrdersPage() {
    const { showToast } = useToast()
    const [orders, setOrders] = useState<SaleOrder[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null)
    const [formData, setFormData] = useState({
        sale_code: '',
        sale_date: new Date().toISOString().split('T')[0],
        sale_total_amount: 0,
        sale_status: 'Pending',
        customer_id: 0,
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            const [ordersRes, customersRes] = await Promise.all([
                fetch('/api/sale-orders?page=1&limit=100'),
                fetch('/api/customers?page=1&limit=100'),
            ])

            if (!ordersRes.ok || !customersRes.ok) throw new Error('Failed to fetch data')

            const [ordersData, customersData] = await Promise.all([
                ordersRes.json(),
                customersRes.json(),
            ])

            setOrders(ordersData.data)
            setCustomers(customersData.data)
        } catch (err) {
            showToast('Failed to load sales data', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (order: SaleOrder) => {
        setSelectedOrder(order)
        setFormData({
            sale_code: order.sale_code,
            sale_date: new Date(order.sale_date).toISOString().split('T')[0],
            sale_total_amount: order.sale_total_amount || 0,
            sale_status: order.sale_status || 'Pending',
            customer_id: order.customer_id || 0,
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this sale order?')) return
        try {
            const response = await fetch(`/api/sale-orders/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Failed to delete order')
            showToast('Sale order deleted successfully', 'success')
            fetchData()
        } catch (err) {
            showToast('Failed to delete order', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedOrder ? `/api/sale-orders/${selectedOrder.sale_id}` : '/api/sale-orders'
            const method = selectedOrder ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save order')
            showToast(`Order ${selectedOrder ? 'updated' : 'created'} successfully`, 'success')
            setIsModalOpen(false)
            setSelectedOrder(null)
            fetchData()
        } catch (err) {
            showToast('Failed to save order', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sale Orders</h1>
                    <p className="text-sm text-slate-500">Manage customer sales and outbound logistics</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedOrder(null)
                        setFormData({
                            sale_code: `SO-${Date.now().toString().slice(-6)}`,
                            sale_date: new Date().toISOString().split('T')[0],
                            sale_total_amount: 0,
                            sale_status: 'Pending',
                            customer_id: customers[0]?.customer_id || 0,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Create SO
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-24">
                     <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">SO Code</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Amount / Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => (
                                <tr key={order.sale_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.sale_code}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {(() => {
                                            const c = customers.find(c => c.customer_id === order.customer_id);
                                            return c ? `${c.customer_fname} ${c.customer_lname}` : 'Unknown';
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-900">฿{order.sale_total_amount?.toLocaleString() || '0'}</div>
                                        <div className={`text-[10px] font-bold uppercase ${
                                            order.sale_status === 'Completed' ? 'text-green-600' : 
                                            order.sale_status === 'Cancelled' ? 'text-red-600' : 'text-orange-500'
                                        }`}>
                                            {order.sale_status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(order)}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => order.sale_id && handleDelete(order.sale_id)}
                                                className="text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{selectedOrder ? 'Edit Sale Order' : 'New Sale Order'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">SO Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.sale_code}
                                    onChange={(e) => setFormData({ ...formData, sale_code: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.sale_date}
                                    onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</label>
                                <select
                                    required
                                    value={formData.customer_id}
                                    onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value={0}>Select Customer</option>
                                    {customers.map(c => (
                                        <option key={c.customer_id} value={c.customer_id}>{c.customer_fname} {c.customer_lname}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount (฿)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.sale_total_amount}
                                    onChange={(e) => setFormData({ ...formData, sale_total_amount: parseFloat(e.target.value) })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
                                <select
                                    required
                                    value={formData.sale_status}
                                    onChange={(e) => setFormData({ ...formData, sale_status: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Processing">Processing</option>
                                </select>
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    {selectedOrder ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
