'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ProductItem, ProductModel } from '@/types/api'

export default function ProductItemsPage() {
    const { showToast } = useToast()
    const [items, setItems] = useState<ProductItem[]>([])
    const [models, setModels] = useState<ProductModel[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null)
    const [formData, setFormData] = useState({
        item_serial_number: '',
        item_imei: '',
        item_lot_number: '',
        item_status: 'Available',
        model_id: 0,
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            const [itemsRes, modelsRes] = await Promise.all([
                fetch('/api/product-items?page=1&limit=100'),
                fetch('/api/product-models?page=1&limit=100'),
            ])

            if (!itemsRes.ok || !modelsRes.ok) throw new Error('Failed to fetch data')

            const [itemsData, modelsData] = await Promise.all([
                itemsRes.json(),
                modelsRes.json(),
            ])

            setItems(itemsData.data)
            setModels(modelsData.data)
        } catch (err) {
            showToast('Failed to load inventory data', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (item: ProductItem) => {
        setSelectedItem(item)
        setFormData({
            item_serial_number: item.item_serial_number || '',
            item_imei: item.item_imei || '',
            item_lot_number: item.item_lot_number || '',
            item_status: item.item_status || 'Available',
            model_id: item.model_id || 0,
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return
        try {
            const response = await fetch(`/api/product-items/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Failed to delete item')
            showToast('Item deleted successfully', 'success')
            fetchData()
        } catch (err) {
            showToast('Failed to delete item', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedItem ? `/api/product-items/${selectedItem.item_id}` : '/api/product-items'
            const method = selectedItem ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save item')
            showToast(`Item ${selectedItem ? 'updated' : 'created'} successfully`, 'success')
            setIsModalOpen(false)
            setSelectedItem(null)
            fetchData()
        } catch (err) {
            showToast('Failed to save item', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Items</h1>
                    <p className="text-sm text-slate-500">Track individual physical units and serial numbers</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedItem(null)
                        setFormData({
                            item_serial_number: '',
                            item_imei: '',
                            item_lot_number: '',
                            item_status: 'Available',
                            model_id: models[0]?.model_id || 0,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Add Item
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
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Model / SN</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">IMEI / Lot</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <tr key={item.item_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {models.find(m => m.model_id === item.model_id)?.model_name || 'Unknown Model'}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase">SN: {item.item_serial_number || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900">IMEI: {item.item_imei || '-'}</div>
                                        <div className="text-xs text-slate-400">Lot: {item.item_lot_number || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold ${item.item_status === 'Available' ? 'text-green-600' : 'text-slate-400'}`}>
                                            {item.item_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => item.item_id && handleDelete(item.item_id)}
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
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{selectedItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Product Model</label>
                                <select
                                    required
                                    value={formData.model_id}
                                    onChange={(e) => setFormData({ ...formData, model_id: parseInt(e.target.value) })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value={0}>Select Model</option>
                                    {models.map(model => (
                                        <option key={model.model_id} value={model.model_id}>{model.model_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Serial Number</label>
                                <input
                                    type="text"
                                    value={formData.item_serial_number}
                                    onChange={(e) => setFormData({ ...formData, item_serial_number: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">IMEI</label>
                                <input
                                    type="text"
                                    value={formData.item_imei}
                                    onChange={(e) => setFormData({ ...formData, item_imei: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lot Number</label>
                                <input
                                    type="text"
                                    value={formData.item_lot_number}
                                    onChange={(e) => setFormData({ ...formData, item_lot_number: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
                                <select
                                    required
                                    value={formData.item_status}
                                    onChange={(e) => setFormData({ ...formData, item_status: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Sold">Sold</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Reserved">Reserved</option>
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
                                    {selectedItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
