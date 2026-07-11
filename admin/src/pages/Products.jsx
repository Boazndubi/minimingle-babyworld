import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '', slug: '', sku: '', description: '',
  basePrice: '', compareAtPrice: '', costPrice: '',
  quantity: '', featuredImageUrl: '', status: 'active',
  isFeatured: false, milestoneTags: '', categoryId: ''
}

export default function Products() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products?limit=100').then(r => r.data.data)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data)
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => editId
      ? api.put(`/products/${editId}`, payload)
      : api.post('/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      toast.success(editId ? 'Product updated!' : 'Product created!')
      setShowModal(false)
      setForm(emptyForm)
      setEditId(null)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving product')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      toast.success('Product deleted')
    }
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await api.post('/upload/image', formData)
      setForm(f => ({ ...f, featuredImageUrl: res.data.url }))
      toast.success('Image uploaded!')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      basePrice: parseFloat(form.basePrice),
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
      costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
      quantity: parseInt(form.quantity) || 0,
      categoryId: form.categoryId || null,
      milestoneTags: form.milestoneTags ? form.milestoneTags.split(',').map(t => t.trim()) : []
    }
    saveMutation.mutate(payload)
  }

  const openEdit = (product) => {
    setForm({
      ...product,
      categoryId: product.categoryId || '',
      milestoneTags: product.milestoneTags?.join(', ') || ''
    })
    setEditId(product.id)
    setShowModal(true)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Products</h2>
        <button
          onClick={() => { setShowModal(true); setForm(emptyForm); setEditId(null) }}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {isLoading ? <p className="text-slate-400">Loading...</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price (KES)</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map(product => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {product.featuredImageUrl
                      ? <img src={product.featuredImageUrl} className="w-10 h-10 rounded-lg object-cover" />
                      : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs">No img</div>
                    }
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{product.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {product.category?.name || <span className="text-slate-300">None</span>}
                  </td>
                  <td className="px-4 py-3">{Number(product.basePrice).toLocaleString()}</td>
                  <td className="px-4 py-3">{product.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No products yet. Add your first product!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">{editId ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">SKU *</label>
                  <input required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Slug *</label>
                  <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="">No Category</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Price (KES) *</label>
                  <input required type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Compare Price (KES)</label>
                  <input type="number" value={form.compareAtPrice} onChange={e => setForm(f => ({ ...f, compareAtPrice: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cost Price (KES)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stock Quantity</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Milestone Tags (comma separated)</label>
                  <input value={form.milestoneTags} onChange={e => setForm(f => ({ ...f, milestoneTags: e.target.value }))}
                    placeholder="teething, crawling, newborn"
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Product Image</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-pink-50 file:text-pink-600 file:text-xs file:font-medium" />
                  {uploading && <p className="text-xs text-slate-400 mt-1">Uploading...</p>}
                  {form.featuredImageUrl && (
                    <img src={form.featuredImageUrl} className="mt-2 h-20 w-20 object-cover rounded-lg border" />
                  )}
                </div>

              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}