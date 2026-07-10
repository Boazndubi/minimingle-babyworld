"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { cn } from "@/src/lib/utils"
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function PointOfSalePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <GlassCard>
              <h2 className="text-white text-xl font-bold mb-4">Products</h2>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {[
                  { id: "1", name: "Diapers", price: 500 },
                  { id: "2", name: "Baby Wipes", price: 300 },
                  { id: "3", name: "Baby Formula", price: 1200 },
                  { id: "4", name: "Pacifiers", price: 200 },
                ].map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition group"
                  >
                    <p className="text-white font-medium text-sm">{product.name}</p>
                    <p className="text-accent-green text-sm font-bold mt-1">KES {product.price}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-400 text-xs">Click to add</span>
                      <Plus className="w-4 h-4 text-accent-blue group-hover:scale-110 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Cart Section */}
          <div>
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-accent-blue" />
                <h2 className="text-white text-xl font-bold">Cart</h2>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Cart is empty</p>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-accent-red/20 rounded transition"
                        >
                          <Trash2 className="w-3 h-3 text-accent-red" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-accent-green text-sm">KES {item.price}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Minus className="w-3 h-3 text-gray-300" />
                          </button>
                          <span className="text-white text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Plus className="w-3 h-3 text-gray-300" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-400 text-xs mt-2">
                        Subtotal: KES {item.price * item.quantity}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Summary */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal:</span>
                  <span>KES {total}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax (0%):</span>
                  <span>KES 0</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg border-t border-white/10 pt-3">
                  <span>Total:</span>
                  <span className="text-accent-green">KES {total}</span>
                </div>

                <button className="w-full bg-accent-green hover:bg-green-600 text-white font-bold py-3 rounded-lg transition mt-4">
                  Complete Payment
                </button>

                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg transition">
                  Clear Cart
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  )
}