'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { PurchaseOrder, Supplier } from '@/types/api'

export default function PurchaseOrdersPage() {
    const { showToast } = useToast()
    const [orders, setOrders] = useState<PurchaseOrder[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
    const [formData, setFormData] = useState({
        po_code: '',
        po_date: new Date().toISOString().split('T')[0],
        po_status: 'Pending',
        supplier_id: 0,
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            const [ordersRes, suppliersRes] = await Promise.all([
                fetch('/api/purchase-orders?page=1&limit=100'),
                fetch('/api/suppliers?page=1&limit=100'),
            ])

            if (!ordersRes.ok || !suppliersRes.ok) throw new Error('Failed to fetch data')

            const [ordersData, suppliersData] = await Promise.all([
                ordersRes.json(),
                suppliersRes.json(),
            ])

            setOrders(ordersData.data)
            setSuppliers(suppliersData.data)
        } catch (err) {
            showToast('Failed to load transaction data', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (order: PurchaseOrder) => {
        setSelectedOrder(order)
        setFormData({
            po_code: order.po_code,
            po_date: new Date(order.po_date).toISOString().split('T')[0],
            po_status: order.po_status,
            supplier_id: order.supplier_id,
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this purchase order?')) return
        try {
            const response = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Failed to delete order')
            showToast('Purchase order deleted successfully', 'success')
            fetchData()
        } catch (err) {
            showToast('Failed to delete order', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedOrder ? `/api/purchase-orders/${selectedOrder.po_id}` : '/api/purchase-orders'
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
                    <p className="text-sm text-slate-500">Track inbound stock and supplier orders</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedOrder(null)
                        setFormData({
                            po_code: `PO-${Date.now().toString().slice(-6)}`,
                            po_date: new Date().toISOString().split('T')[0],
                            po_status: 'Pending',
                            supplier_id: suppliers[0]?.supplier_id || 0,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Create PO
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
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">PO Code</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Supplier</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Date / Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => (
                                <tr key={order.po_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.po_code}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {suppliers.find(s => s.supplier_id === order.supplier_id)?.supplier_name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900">{new Date(order.po_date || '').toLocaleDateString()}</div>
                                        <div className={`text-[10px] font-bold uppercase ${
                                            order.po_status === 'Completed' ? 'text-green-600' : 
                                            order.po_status === 'Cancelled' ? 'text-red-600' : 'text-orange-500'
                                        }`}>
                                            {order.po_status}
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
                                                onClick={() => order.po_id && handleDelete(order.po_id)}
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
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{selectedOrder ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">PO Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.po_code}
                                    onChange={(e) => setFormData({ ...formData, po_code: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.po_date}
                                    onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</label>
                                <select
                                    required
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value={0}>Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
                                <select
                                    required
                                    value={formData.po_status}
                                    onChange={(e) => setFormData({ ...formData, po_status: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
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
