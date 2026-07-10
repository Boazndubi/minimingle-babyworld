"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { cn } from "@/src/lib/utils"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  Banknote,
} from "lucide-react"
import { apiFetch } from "@/src/lib/api"
import toast from "react-hot-toast"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  stock: number
}

export default function PointOfSalePage() {
  const queryClient = useQueryClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card">("cash")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [completed, setCompleted] = useState<any>(null)
  const [waitingForMpesa, setWaitingForMpesa] = useState(false)

  // Fetch products from database
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiFetch("/products?limit=100")
      return res.data || res
    },
  })

  const filtered = products?.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error(`Only ${product.quantity} in stock`)
          return prev
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      if (product.quantity === 0) {
        toast.error("Out of stock")
        return prev
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: parseFloat(product.basePrice),
          quantity: 1,
          image: product.featuredImageUrl,
          stock: product.quantity,
        },
      ]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find((i) => i.id === productId)
    if (!item) return

    if (quantity <= 0) {
      removeFromCart(productId)
    } else if (quantity > item.stock) {
      toast.error(`Only ${item.stock} in stock`)
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
      )
    }
  }

  const clearCart = () => {
    setCart([])
    setCustomerName("")
    setCustomerPhone("")
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const pollPaymentStatus = useCallback(
    (orderId: string) => {
      let attempts = 0
      const maxAttempts = 30
      let interval: NodeJS.Timeout

      const check = async () => {
        attempts++
        try {
          const res = await apiFetch(`/mpesa/status/${orderId}`)
          if (res.paymentStatus === "paid") {
            clearInterval(interval)
            setWaitingForMpesa(false)
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("M-Pesa payment received!")
            const orderRes = await apiFetch(`/orders/${orderId}`)
            setCompleted(orderRes.data || orderRes)
            clearCart()
          } else if (res.paymentStatus === "failed") {
            clearInterval(interval)
            setWaitingForMpesa(false)
            toast.error("M-Pesa payment failed or was cancelled.")
          }
        } catch {
          // ignore
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval)
          setWaitingForMpesa(false)
          toast.error("Payment timed out. Please try again.")
        }
      }

      interval = setInterval(check, 3000)
      return () => clearInterval(interval)
    },
    [queryClient]
  )

  useEffect(() => {
    return () => {
      // cleanup handled by pollPaymentStatus return
    }
  }, [])

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/orders/pos", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
          paymentMethod,
          customerName,
          customerPhone,
          total,
        }),
      })
      return res.data || res
    },
    onSuccess: async (order) => {
      if (paymentMethod === "mpesa") {
        if (!customerPhone) {
          toast.error("Please enter customer phone number for M-Pesa payment")
          return
        }
        try {
          await apiFetch("/mpesa/stkpush", {
            method: "POST",
            body: JSON.stringify({
              phone: customerPhone,
              amount: total,
              orderId: order.id,
              orderNumber: order.orderNumber,
            }),
          })
          toast.success("M-Pesa prompt sent to customer phone")
          setWaitingForMpesa(true)
          pollPaymentStatus(order.id)
        } catch (err: any) {
          toast.error(err.message || "Failed to send M-Pesa prompt")
        }
      } else if (paymentMethod === "card") {
        try {
          const pesapalRes = await apiFetch("/pesapal/initiate", {
            method: "POST",
            body: JSON.stringify({
              orderId: order.id,
              orderNumber: order.orderNumber,
              amount: total,
              phone: customerPhone,
              firstName: customerName || "Walk-in",
              lastName: "Customer",
            }),
          })
          const redirectUrl = pesapalRes.redirectUrl || pesapalRes.data?.redirectUrl
          if (redirectUrl) window.open(redirectUrl, "_blank")
          toast.success("Pesapal payment page opened in new tab")
          setCompleted(order)
          clearCart()
          queryClient.invalidateQueries({ queryKey: ["products"] })
        } catch (err: any) {
          toast.error(err.message || "Failed to initiate card payment")
        }
      } else {
        setCompleted(order)
        clearCart()
        queryClient.invalidateQueries({ queryKey: ["products"] })
        toast.success("Sale recorded!")
      }
    },
    onError: (err: any) =>
      toast.error(err.message || "Error creating order"),
  })

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    if (paymentMethod === "mpesa" && !customerPhone) {
      toast.error("Enter customer phone number for M-Pesa payment")
      return
    }
    createOrderMutation.mutate()
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-dashboard text-white">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className={cn("pt-20 pb-8 px-6 transition-all duration-300 flex items-center justify-center", sidebarCollapsed ? "ml-16" : "ml-64")}>
          <GlassCard className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle size={40} className="text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Sale Complete!</h2>
            <p className="text-gray-400 text-sm mb-4">Order recorded successfully</p>
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Order #</span><span className="font-mono font-bold text-white">{completed.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="font-bold text-accent-green">KES {Number(completed.grandTotal || completed.total).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Payment</span><span className="capitalize text-white">{completed.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Channel</span><span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">In Store</span></div>
            </div>
            <button onClick={() => setCompleted(null)} className="w-full bg-accent-green hover:bg-green-600 text-white rounded-xl py-3 font-medium transition-colors">New Sale</button>
          </GlassCard>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        {waitingForMpesa && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <GlassCard className="max-w-sm w-full text-center p-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 p-4 rounded-full animate-pulse">
                  <img src="/mpesa-logo.png" alt="M-Pesa" className="w-8 h-8 object-contain" />
                </div>
              </div>
              <h3 className="font-semibold text-white mb-2">Waiting for M-Pesa Payment</h3>
              <p className="text-sm text-gray-400 mb-2">STK push sent to <span className="font-medium text-white">{customerPhone}</span>.</p>
              <p className="text-xs text-gray-500">Ask the customer to enter their M-Pesa PIN to complete payment.</p>
              <div className="mt-6 flex justify-center"><div className="w-6 h-6 border-2 border-green-500/30 border-t-green-400 rounded-full animate-spin" /></div>
              <button onClick={() => setWaitingForMpesa(false)} className="mt-4 text-xs text-gray-400 hover:text-white transition">Cancel</button>
            </GlassCard>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard>
              <h2 className="text-white text-xl font-bold mb-4">Products</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search products by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-green/50" />
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/20 border-t-accent-green rounded-full animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {filtered?.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8 col-span-full">No products found</p>
                  ) : (
                    filtered?.map((product: any) => (
                      <button key={product.id} onClick={() => addToCart(product)} disabled={product.quantity === 0} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition group disabled:opacity-40 disabled:cursor-not-allowed">
                        <div className="aspect-square bg-white/5 rounded-lg overflow-hidden mb-2">
                          {product.featuredImageUrl ? (
                            <img src={product.featuredImageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ShoppingCart size={24} className="text-gray-600" /></div>
                          )}
                        </div>
                        <p className="text-white font-medium text-sm line-clamp-2 mb-1">{product.name}</p>
                        <p className="text-accent-green text-sm font-bold">KES {Number(product.basePrice).toLocaleString()}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${product.quantity === 0 ? "text-red-400" : product.quantity < 5 ? "text-yellow-400" : "text-gray-400"}`}>Stock: {product.quantity}</span>
                          <Plus className="w-4 h-4 text-accent-blue group-hover:scale-110 transition" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          <div>
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-accent-blue" />
                <h2 className="text-white text-xl font-bold">Cart</h2>
              </div>

              <div className="space-y-2 mb-4">
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-green/50" />
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={paymentMethod === "mpesa" ? "Customer phone (required for M-Pesa)" : "Customer phone (optional)"} className={`w-full border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-green/50 ${paymentMethod === "mpesa" ? "border-green-500/50 bg-green-500/10" : "border-white/20 bg-white/10"}`} />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500"><ShoppingCart size={32} className="mx-auto mb-2" /><p className="text-xs">Click products to add them</p></div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        <button onClick={() => removeFromCart(item.id)} className="p-1 hover:bg-accent-red/20 rounded transition"><Trash2 className="w-3 h-3 text-accent-red" /></button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-accent-green text-sm">KES {(item.price * item.quantity).toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white/10 rounded"><Minus className="w-3 h-3 text-gray-300" /></button>
                          <span className="text-white text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="p-1 hover:bg-white/10 rounded disabled:opacity-30"><Plus className="w-3 h-3 text-gray-300" /></button>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mt-2">@ KES {item.price.toLocaleString()} each</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-300 mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPaymentMethod("cash")} className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all capitalize flex flex-col items-center gap-2 ${paymentMethod === "cash" ? "bg-accent-green/20 border-accent-green text-accent-green" : "border-white/10 text-gray-400 hover:bg-white/5"}`}><Banknote size={20} /><span>Cash</span></button>
                  <button onClick={() => setPaymentMethod("mpesa")} className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all capitalize flex flex-col items-center gap-2 ${paymentMethod === "mpesa" ? "bg-green-500/20 border-green-500 text-green-400" : "border-white/10 text-gray-400 hover:bg-white/5"}`}><img src="/mpesa-logo.png" alt="M-Pesa" className="w-8 h-5 object-contain" /><span>M-Pesa</span></button>
                  <button onClick={() => setPaymentMethod("card")} className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all capitalize flex flex-col items-center gap-2 ${paymentMethod === "card" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 text-gray-400 hover:bg-white/5"}`}><img src="/visa-mastercard.png" alt="Card" className="w-10 h-6 object-contain" /><span>Card</span></button>
                </div>

                {paymentMethod === "mpesa" && (
                  <div className="mt-2 p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                    <p className="text-xs text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />STK push will be sent to customer phone</p>
                  </div>
                )}
                {paymentMethod === "card" && (
                  <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-xs text-blue-400">Pesapal secure card payment page will open</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between text-gray-300 text-sm"><span>Items:</span><span>{cart.reduce((sum, i) => sum + i.quantity, 0)}</span></div>
                <div className="flex justify-between text-white font-bold text-lg border-t border-white/10 pt-3"><span>Total:</span><span className="text-accent-green">KES {total.toLocaleString()}</span></div>
                <button onClick={handleCompleteSale} disabled={cart.length === 0 || createOrderMutation.isPending} className="w-full bg-accent-green hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 rounded-lg transition mt-4">
                  {createOrderMutation.isPending ? "Processing..." : paymentMethod === "mpesa" ? "Send M-Pesa Prompt" : "Complete Sale"}
                </button>
                <button onClick={clearCart} className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg transition">Clear Cart</button>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}