'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Customer } from '@/types/api'

export default function CustomersPage() {
    const { showToast } = useToast()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        null
    )
    const [formData, setFormData] = useState({
        customer_fname: '',
        customer_lname: '',
        customer_phone: '',
        customer_tax_number: '',
        customer_address: '',
    })

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/customers?page=1&limit=100')
            if (!response.ok) throw new Error('Failed to fetch customers')
            const result = await response.json()
            setCustomers(result.data)
        } catch (err) {
            showToast('ไม่สามารถโหลดลูกค้า', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer)
        setFormData({
            customer_fname: customer.customer_fname,
            customer_lname: customer.customer_lname || '',
            customer_phone: customer.customer_phone || '',
            customer_tax_number: customer.customer_tax_number || '',
            customer_address: customer.customer_address || '',
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('คุณแน่ใจหรือว่าต้องการลบลูกค้านี้?')) return
        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete customer')
            showToast('ลูกค้าถูกลบสำเร็จ', 'success')
            fetchCustomers()
        } catch (err) {
            showToast('ไม่สามารถลบลูกค้า', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedCustomer
                ? `/api/customers/${selectedCustomer.customer_id}`
                : '/api/customers'
            const method = selectedCustomer ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save customer')
            showToast(
                `ลูกค้า${selectedCustomer ? 'อัพเดต' : 'สร้าง'}สำเร็จ`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedCustomer(null)
            setFormData({
                customer_fname: '',
                customer_lname: '',
                customer_phone: '',
                customer_tax_number: '',
                customer_address: '',
            })
            fetchCustomers()
        } catch (err) {
            showToast('ไม่สามารถบันทึกลูกค้า', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        ลูกค้า
                    </h1>
                </div>
                <button
                    onClick={() => {
                        setSelectedCustomer(null)
                        setFormData({
                            customer_fname: '',
                            customer_lname: '',
                            customer_phone: '',
                            customer_tax_number: '',
                            customer_address: '',
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    เพิ่มลูกค้า
                </button>
            </div>

            {loading ? (
                <div className="bg-bg flex items-center justify-center rounded-lg border border-slate-200 p-24">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                </div>
            ) : (
                <div className="bg-bg overflow-hidden rounded-lg border border-slate-200 shadow-xs">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    ชื่อลูกค้า
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    เลขประจำตัวผู้เสียภาษี / โทรศัพท์
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    ที่อยู่
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    การดำเนินการ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {customers.map((customer) => (
                                <tr
                                    key={customer.customer_id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {customer.customer_fname}{' '}
                                            {customer.customer_lname}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900">
                                            {customer.customer_phone || '-'}
                                        </div>
                                        <div className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                            {customer.customer_tax_number ||
                                                'ไม่มีเลขประจำตัวผู้เสียภาษี'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate text-sm text-slate-600">
                                            {customer.customer_address || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() =>
                                                    handleEdit(customer)
                                                }
                                                className="text-slate-400 transition-colors hover:text-blue-600"
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() =>
                                                    customer.customer_id &&
                                                    handleDelete(
                                                        customer.customer_id
                                                    )
                                                }
                                                className="text-slate-400 transition-colors hover:text-red-600"
                                            >
                                                ลบ
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
                    <div className="bg-bg w-full max-w-lg rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            {selectedCustomer
                                ? 'แก้ไขลูกค้า'
                                : 'เพิ่มลูกค้าใหม่'}
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ชื่อจริง
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.customer_fname}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_fname: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    นามสกุล
                                </label>
                                <input
                                    type="text"
                                    value={formData.customer_lname}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_lname: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    โทรศัพท์
                                </label>
                                <input
                                    type="text"
                                    value={formData.customer_phone}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_phone: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    เลขประจำตัวผู้เสียภาษี
                                </label>
                                <input
                                    type="text"
                                    value={formData.customer_tax_number}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_tax_number: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    ที่อยู่
                                </label>
                                <textarea
                                    value={formData.customer_address}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            customer_address: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                    rows={3}
                                />
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    {selectedCustomer ? 'อัพเดต' : 'สร้าง'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
