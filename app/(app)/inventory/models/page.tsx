'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ProductModel, Brand, Category } from '@/types/api'
import ImageUpload from '@/components/ImageUpload'

export default function ProductModelsPage() {
    const { showToast } = useToast()
    const [models, setModels] = useState<ProductModel[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState<ProductModel | null>(
        null
    )
    const [formData, setFormData] = useState({
        model_name: '',
        model_made_in: '',
        model_warranty_duration: 12,
        brand_id: 0,
        category_id: 0,
        image_url: '' as string | null,
    })

    const fetchData = async () => {
        try {
            setLoading(true)
            const [modelsRes, brandsRes, catsRes] = await Promise.all([
                fetch('/api/product-models?page=1&limit=100'),
                fetch('/api/brands?page=1&limit=100'),
                fetch('/api/categories?page=1&limit=100'),
            ])

            if (!modelsRes.ok || !brandsRes.ok || !catsRes.ok)
                throw new Error('Failed to fetch data')

            const [modelsData, brandsData, catsData] = await Promise.all([
                modelsRes.json(),
                brandsRes.json(),
                catsRes.json(),
            ])

            setModels(modelsData.data)
            setBrands(brandsData.data)
            setCategories(catsData.data)
        } catch (err) {
            showToast('Failed to load inventory data', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (model: ProductModel) => {
        setSelectedModel(model)
        setFormData({
            model_name: model.model_name,
            model_made_in: model.model_made_in || '',
            model_warranty_duration: model.model_warranty_duration || 12,
            brand_id: model.brand_id || 0,
            category_id: model.category_id || 0,
            image_url: model.image_url || null,
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรุ่นสินค้านี้?')) return
        try {
            const response = await fetch(`/api/product-models/${id}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete model')
            showToast('ลบรุ่นสินค้าสำเร็จ', 'success')
            fetchData()
        } catch (err) {
            showToast('ไม่สามารถลบรุ่นสินค้าได้', 'error')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = selectedModel
                ? `/api/product-models/${selectedModel.model_id}`
                : '/api/product-models'
            const method = selectedModel ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to save model')
            showToast(
                `Model ${selectedModel ? 'updated' : 'created'} successfully`,
                'success'
            )
            setIsModalOpen(false)
            setSelectedModel(null)
            fetchData()
        } catch (err) {
            showToast('Failed to save model', 'error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    {/* <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Product Models
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage device models and technical specifications
                    </p> */}
                </div>
                <button
                    onClick={() => {
                        setSelectedModel(null)
                        setFormData({
                            model_name: '',
                            model_made_in: '',
                            model_warranty_duration: 12,
                            brand_id: brands[0]?.brand_id || 0,
                            category_id: categories[0]?.category_id || 0,
                            image_url: null,
                        })
                        setIsModalOpen(true)
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    Add Model
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
                                <th className="w-20 px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Image
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Model Name
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Brand / Category
                                </th>
                                <th className="px-6 py-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Warranty
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {models.map((model) => (
                                <tr
                                    key={model.model_id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4">
                                        {model.image_url ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={model.image_url}
                                                alt={model.model_name}
                                                className="h-10 w-10 rounded-full border border-slate-200 bg-white object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-400">
                                                N/A
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {model.model_name}
                                        </div>
                                        <div className="text-[10px] font-medium text-slate-400 uppercase">
                                            {model.model_made_in || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900">
                                            {brands.find(
                                                (b) =>
                                                    b.brand_id ===
                                                    model.brand_id
                                            )?.brand_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {categories.find(
                                                (c) =>
                                                    c.category_id ===
                                                    model.category_id
                                            )?.category_name_en || 'Misc'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {model.model_warranty_duration} Months
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() =>
                                                    handleEdit(model)
                                                }
                                                className="text-slate-400 transition-colors hover:text-blue-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    model.model_id &&
                                                    handleDelete(model.model_id)
                                                }
                                                className="text-slate-400 transition-colors hover:text-red-600"
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
                    <div className="bg-bg w-full max-w-lg rounded-xl p-8 shadow-2xl ring-1 ring-slate-200">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">
                            {selectedModel ? 'Edit Model' : 'Add New Model'}
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.model_name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            model_name: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Brand
                                </label>
                                <select
                                    required
                                    value={formData.brand_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            brand_id: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                >
                                    <option value={0}>Select Brand</option>
                                    {brands.map((brand) => (
                                        <option
                                            key={brand.brand_id}
                                            value={brand.brand_id}
                                        >
                                            {brand.brand_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Category
                                </label>
                                <select
                                    required
                                    value={formData.category_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            category_id: parseInt(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                >
                                    <option value={0}>Select Category</option>
                                    {categories.map((cat) => (
                                        <option
                                            key={cat.category_id}
                                            value={cat.category_id}
                                        >
                                            {cat.category_name_en}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Made In
                                </label>
                                <input
                                    type="text"
                                    value={formData.model_made_in}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            model_made_in: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Warranty (Months)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.model_warranty_duration}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            model_warranty_duration: parseInt(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    Product Image
                                </label>
                                <ImageUpload
                                    value={formData.image_url}
                                    onChange={(url) =>
                                        setFormData({
                                            ...formData,
                                            image_url: url,
                                        })
                                    }
                                />
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
                                    {selectedModel ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
