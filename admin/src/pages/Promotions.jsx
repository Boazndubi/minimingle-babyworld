import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const emptyForm = {
  name: '', type: 'PERCENTAGE', value: '',
  couponCode: '', minimumOrder: '0',
  startDate: '', endDate: '', appliesToAll: true,
  selectedProducts: []
}

export default function Promotions() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => api.get('/promotions?all=true').then(r => r.data)
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products?limit=100').then(r => r.data.data)
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/promotions', {
      ...form,
      value: parseFloat(form.value),
      minimumOrder: parseFloat(form.minimumOrder),
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      appliesToAll: form.selectedProducts.length === 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions'])
      toast.success('Promotion created!')
      setShowModal(false)
      setForm(emptyForm)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions'])
      toast.success('Promotion deleted')
    }
  })

  const toggleProduct = (productId) => {
    setForm(f => ({
      ...f,
      selectedProducts: f.selectedProducts.includes(productId)
        ? f.selectedProducts.filter(id => id !== productId)
        : [...f.selectedProducts, productId]
    }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Promotions</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700">
          <Plus size={16} /> Add Promotion
        </button>
      </div>

      {isLoading ? <p className="text-slate-400">Loading...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions?.map(promo => (
            <div key={promo.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-slate-700">{promo.name}</p>
                <button onClick={() => deleteMutation.mutate(promo.id)}
                  className="p-1 rounded-lg hover:bg-red-50 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-2xl font-bold text-pink-600">
                {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `KES ${promo.value}`} off
              </p>
              {promo.couponCode && (
                <p className="text-xs mt-1 font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded inline-block">
                  {promo.couponCode}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {promo.appliesToAll ? 'Applies to all products' : 'Specific products'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ends: {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'No expiry'}
              </p>
            </div>
          ))}
          {promotions?.length === 0 && <p className="text-slate-400 text-sm">No promotions yet.</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Add Promotion</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Promotion Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                    <option value="PERCENTAGE">Percentage %</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Value *</label>
                  <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === 'PERCENTAGE' ? '20' : '500'}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Coupon Code (optional)</label>
                <input value={form.couponCode} onChange={e => setForm(f => ({ ...f, couponCode: e.target.value }))}
                  placeholder="WELCOME10"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Minimum Order (KES)</label>
                <input type="number" value={form.minimumOrder} onChange={e => setForm(f => ({ ...f, minimumOrder: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
              </div>

              {/* Apply to products */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Apply To</label>
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, appliesToAll: true, selectedProducts: [] }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.appliesToAll
                        ? 'bg-pink-50 border-pink-400 text-pink-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    All Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, appliesToAll: false }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      !form.appliesToAll
                        ? 'bg-pink-50 border-pink-400 text-pink-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    Specific Products
                  </button>
                </div>

                {!form.appliesToAll && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    {products?.length === 0 && (
                      <p className="text-xs text-slate-400 p-3">No products found.</p>
                    )}
                    {products?.map(product => (
                      <label key={product.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={form.selectedProducts.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          className="accent-pink-600"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {product.featuredImageUrl && (
                            <img src={product.featuredImageUrl} alt={product.name}
                              className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{product.name}</p>
                            <p className="text-xs text-slate-400">KES {Number(product.basePrice).toLocaleString()}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {!form.appliesToAll && form.selectedProducts.length > 0 && (
                  <p className="text-xs text-pink-600 mt-1">
                    {form.selectedProducts.length} product(s) selected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 rounded-lg py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
                  className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700 disabled:opacity-50">
                  {createMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}