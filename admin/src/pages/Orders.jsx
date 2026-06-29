import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Phone, MapPin, Mail, Package } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Orders() {
  const queryClient = useQueryClient()
  const [expandedOrder, setExpandedOrder] = useState(null)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
    refetchInterval: 30000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order status updated')
    }
  })

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Orders</h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          Auto-refreshes every 30s
        </span>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {orders?.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-12 text-center text-slate-400">
              No orders yet.
            </div>
          )}

          {orders?.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">

              {/* Order Row */}
              <div className="flex items-center gap-4 px-4 py-3 flex-wrap">

                {/* Order Number */}
                <div className="min-w-[140px]">
                  <p className="font-mono text-xs font-bold text-slate-700">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-[150px]">
                  <p className="text-sm font-medium text-slate-700">
                    {order.shippingAddress?.name || order.user?.firstName || 'Guest'}
                  </p>
                  <p className="text-xs text-slate-400">{order.user?.email || order.shippingAddress?.email || '—'}</p>
                </div>

                {/* Phone */}
                <div className="min-w-[120px]">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone size={11} className="text-pink-400" />
                    {order.shippingAddress?.phone || '—'}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MapPin size={11} className="text-pink-400" />
                    {order.shippingAddress?.city || '—'}
                  </div>
                </div>

                {/* Total */}
                <div className="min-w-[100px]">
                  <p className="text-sm font-bold text-slate-700">
                    KES {Number(order.grandTotal).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">{order.paymentMethod || '—'}</p>
                </div>

                {/* Payment Status */}
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.paymentStatus}
                  </span>
                </div>

                {/* Order Status */}
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-500'}`}>
                    {order.status}
                  </span>
                </div>

                {/* Update Status */}
                <select
                  value={order.status}
                  onChange={e => updateMutation.mutate({ id: order.id, status: e.target.value })}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  {Object.keys(statusColors).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Expand Button */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Customer Details */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Customer Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-pink-400" />
                        <span className="font-medium">{order.shippingAddress?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-pink-400" />
                        <span>{order.shippingAddress?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-pink-400" />
                        <span>{order.shippingAddress?.email || order.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-pink-400 mt-0.5" />
                        <span>
                          {order.shippingAddress?.address_line_1}<br />
                          {order.shippingAddress?.city}
                        </span>
                      </div>
                      {order.notes && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                          <span className="font-medium">Note:</span> {order.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {item.product?.featuredImageUrl && (
                              <img
                                src={item.product.featuredImageUrl}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            )}
                            <span className="text-slate-700">{item.product?.name || 'Product'}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">x{item.quantity}</p>
                            <p className="font-medium text-slate-700">KES {Number(item.subtotal).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm">
                        <span>Total</span>
                        <span>KES {Number(order.grandTotal).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}