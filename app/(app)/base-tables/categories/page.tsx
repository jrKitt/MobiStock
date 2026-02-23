'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Category } from '@/types/api'

export default function CategoriesPage() {
    const { showToast } = useToast()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({
        category_name_th: '',
        category_name_en: '',
    })

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/categories?page=1&limit=100')
            if (!response.ok) throw new Error('Failed to fetch categories')
            const result = await response.json()
            setCategories(result.data)
        } catch (err) {
            showToast('Failed to load categories', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleEdit = (category: Category) => {
        setSelectedCategory(category)
        setFormData({
            category_name_th: category.category_name_th,
            category_name_en: category.category_name_en || '',
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return
        try {
            const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Failed to delete category')
            showToast('Category deleted successfully', 'success')
            fetchCategories()
        } catch (err) {
            showToast('Failed to delete category', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedCategory ? `/api/categories/${selectedCategory.category_id}` : '/api/categories'
            const method = selectedCategory ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save category')
            showToast(`Category ${selectedCategory ? 'updated' : 'created'} successfully`, 'success')
            setIsModalOpen(false)
            setSelectedCategory(null)
            setFormData({ category_name_th: '', category_name_en: '' })
            fetchCategories()
        } catch (err) {
            showToast('Failed to save category', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
                    <p className="text-sm text-slate-500">Organize your products into categories</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedCategory(null)
                        setFormData({ category_name_th: '', category_name_en: '' })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Add Category
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
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">TH Name</th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">EN Name</th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.map((category) => (
                                <tr key={category.category_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{category.category_name_th}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{category.category_name_en || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => category.category_id && handleDelete(category.category_id)}
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
                    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{selectedCategory ? 'Edit Category' : 'Add New Category'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Name (TH)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.category_name_th}
                                    onChange={(e) => setFormData({ ...formData, category_name_th: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Name (EN)</label>
                                <input
                                    type="text"
                                    value={formData.category_name_en}
                                    onChange={(e) => setFormData({ ...formData, category_name_en: e.target.value })}
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
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
                                    {selectedCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
