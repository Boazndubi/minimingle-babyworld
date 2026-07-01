import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle, Smartphone } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

export default function POS() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [completed, setCompleted] = useState(null)
  const [waitingForMpesa, setWaitingForMpesa] = useState(false)

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products?limit=100').then(r => r.data.data)
  })

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
        )
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.basePrice),
        quantity: 1,
        image: product.featuredImageUrl,
        stock: product.quantity
      }]
    })
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id))
    } else {
      setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
    }
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const pollPaymentStatus = (orderId) => {
    let attempts = 0
    const maxAttempts = 30

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await api.get(`/mpesa/status/${orderId}`)
        if (res.data.paymentStatus === 'paid') {
          clearInterval(interval)
          setWaitingForMpesa(false)
          queryClient.invalidateQueries(['products'])
          toast.success('M-Pesa payment received!')
          // fetch the full order to show completion screen
          const orderRes = await api.get(`/orders/${orderId}`)
          setCompleted(orderRes.data)
          setCart([])
          setCustomerName('')
          setCustomerPhone('')
        } else if (res.data.paymentStatus === 'failed') {
          clearInterval(interval)
          setWaitingForMpesa(false)
          toast.error('M-Pesa payment failed or was cancelled.')
        }
      } catch {
        // ignore single poll errors
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setWaitingForMpesa(false)
        toast.error('Payment timed out. Please try again.')
      }
    }, 3000)
  }

  const createOrderMutation = useMutation({
    mutationFn: () => api.post('/orders/pos', {
      items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
      paymentMethod,
      customerName,
      customerPhone,
      total
    }),
    onSuccess: async (res) => {
      const order = res.data

      if (paymentMethod === 'mpesa') {
        if (!customerPhone) {
          toast.error('Please enter customer phone number for M-Pesa payment')
          return
        }
        try {
          await api.post('/mpesa/stkpush', {
            phone: customerPhone,
            amount: total,
            orderId: order.id,
            orderNumber: order.orderNumber
          })
          toast.success('M-Pesa prompt sent to customer phone')
          setWaitingForMpesa(true)

          // For POS M-Pesa, we need to update the order status manually
          // since the callback will handle it, but let's also poll
          pollPaymentStatus(order.id)
        } catch (err) {
          toast.error(err.response?.data?.error || 'Failed to send M-Pesa prompt')
        }
      } else {
        // Cash or card — immediately complete
        setCompleted(order)
        setCart([])
        setCustomerName('')
        setCustomerPhone('')
        queryClient.invalidateQueries(['products'])
        toast.success('Sale recorded!')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error creating order')
  })

  const handleCompleteSale = () => {
    if (paymentMethod === 'mpesa' && !customerPhone) {
      toast.error('Enter customer phone number for M-Pesa payment')
      return
    }
    createOrderMutation.mutate()
  }

  if (completed) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle size={40} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sale Complete!</h2>
          <p className="text-slate-500 text-sm mb-4">Order recorded successfully</p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Order #</span>
              <span className="font-mono font-bold">{completed.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total</span>
              <span className="font-bold">KES {Number(completed.grandTotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment</span>
              <span className="capitalize">{completed.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Channel</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">In Store</span>
            </div>
          </div>
          <button
            onClick={() => setCompleted(null)}
            className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium hover:bg-pink-700 transition-colors">
            New Sale
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Point of Sale</h2>

      {/* M-Pesa waiting modal */}
      {waitingForMpesa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-pink-50 p-4 rounded-full animate-pulse">
                <Smartphone size={32} className="text-pink-600" />
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Waiting for M-Pesa Payment</h3>
            <p className="text-sm text-slate-500 mb-2">
              STK push sent to <span className="font-medium">{customerPhone}</span>.
            </p>
            <p className="text-xs text-slate-400">
              Ask the customer to enter their M-Pesa PIN to complete payment.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
            </div>
            <button
              onClick={() => setWaitingForMpesa(false)}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left — Product Search */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
            {filtered?.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.quantity === 0}
                className="bg-white rounded-xl border border-slate-200 p-3 text-left hover:border-pink-300 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden mb-2">
                  {product.featuredImageUrl
                    ? <img src={product.featuredImageUrl} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={24} className="text-slate-200" />
                      </div>
                  }
                </div>
                <p className="text-xs font-medium text-slate-700 line-clamp-2 mb-1">{product.name}</p>
                <p className="text-sm font-bold text-pink-600">KES {Number(product.basePrice).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Stock: {product.quantity}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Cart */}
        <div className="w-80 flex flex-col bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-700 mb-3">Current Sale</h3>

          {/* Customer info */}
          <div className="space-y-2 mb-4">
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <input
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder={paymentMethod === 'mpesa' ? 'Customer phone (required for M-Pesa)' : 'Customer phone (optional)'}
              className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                paymentMethod === 'mpesa' ? 'border-pink-300 bg-pink-50' : 'border-slate-200'
              }`}
            />
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-300">
                <ShoppingBag size={32} className="mx-auto mb-2" />
                <p className="text-xs">Click products to add them</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
                    <p className="text-xs text-pink-600 font-bold">KES {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30">
                      <Plus size={12} />
                    </button>
                    <button onClick={() => updateQty(item.id, 0)}
                      className="p-1 rounded-lg hover:bg-red-50 text-red-400 ml-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment method */}
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-600 mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'mpesa', 'card'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    paymentMethod === method
                      ? 'bg-pink-50 border-pink-400 text-pink-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {method}
                </button>
              ))}
            </div>
            {paymentMethod === 'mpesa' && (
              <p className="text-xs text-pink-500 mt-2">
                STK push will be sent to customer phone
              </p>
            )}
          </div>

          {/* Total and checkout */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="text-xl font-bold text-pink-600">KES {total.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || createOrderMutation.isPending}
              className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium hover:bg-pink-700 transition-colors disabled:opacity-40 text-sm">
              {createOrderMutation.isPending
                ? 'Processing...'
                : paymentMethod === 'mpesa'
                ? 'Send M-Pesa Prompt'
                : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}