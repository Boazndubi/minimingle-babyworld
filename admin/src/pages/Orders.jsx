import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, X, Package, MapPin, Phone, Mail } from 'lucide-react'
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
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Order status updated')
    }
  })

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, paymentStatus }) => api.put(`/orders/${id}/status`, { paymentStatus }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries(['orders'])
      toast.success('Payment marked as received')
      setSelectedOrder(prev => prev ? { ...prev, paymentStatus: variables.paymentStatus } : prev)
    }
  })

  const filtered = orders?.filter(order => {
    const matchStatus = statusFilter ? order.status === statusFilter : true
    const matchSearch = search
      ? order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        order.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(search.toLowerCase())
      : true
    return matchStatus && matchSearch
  })

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Orders</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order # or customer..."
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 w-64"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {isLoading ? <p className="text-slate-400">Loading...</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total (KES)</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map(order => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p>{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-slate-400">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{Number(order.grandTotal).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-500'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={e => updateMutation.mutate({ id: order.id, status: e.target.value })}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
                      {Object.keys(statusColors).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold">Order {selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[selectedOrder.status]}`}>
                  {selectedOrder.status}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedOrder.paymentStatus}
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                  {selectedOrder.paymentMethod}
                </span>
                {selectedOrder.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, paymentStatus: 'paid' })}
                    className="text-xs px-3 py-1 rounded-full font-medium bg-pink-600 text-white hover:bg-pink-700 transition-colors">
                    Mark as Paid
                  </button>
                )}
              </div>

              {/* Customer info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Phone size={14} className="text-pink-500" /> Customer Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <p><span className="text-slate-400">Name:</span> {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                  <p><span className="text-slate-400">Email:</span> {selectedOrder.user?.email}</p>
                  <p><span className="text-slate-400">Phone:</span> {selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Shipping address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <MapPin size={14} className="text-pink-500" /> Delivery Address
                  </h4>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>{selectedOrder.shippingAddress.address_line_1}</p>
                    <p>{selectedOrder.shippingAddress.city}</p>
                    <p>{selectedOrder.shippingAddress.name}</p>
                  </div>
                </div>
              )}

              {/* Order items */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package size={14} className="text-pink-500" /> Items Ordered
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      {item.product?.featuredImageUrl && (
                        <img src={item.product.featuredImageUrl} alt={item.product?.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {item.product?.name || 'Product'}
                        </p>
                        <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        KES {Number(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order totals */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>KES {Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>KES {Number(selectedOrder.shippingFee || 0).toLocaleString()}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- KES {Number(selectedOrder.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-800 text-base pt-1 border-t border-slate-100">
                  <span>Total</span>
                  <span>KES {Number(selectedOrder.grandTotal).toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-yellow-700 mb-1">Customer Notes</p>
                  <p className="text-sm text-yellow-800">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Update status */}
              <div className="flex gap-3 pt-2">
                <select
                  defaultValue={selectedOrder.status}
                  onChange={e => updateMutation.mutate({ id: selectedOrder.id, status: e.target.value })}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
                  {Object.keys(statusColors).map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <button onClick={() => setSelectedOrder(null)}
                  className="flex-1 bg-pink-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-pink-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}