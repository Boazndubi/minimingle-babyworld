"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { apiFetch } from "@/src/lib/api"
import { formatCurrency, cn } from "@/src/lib/utils"
import { Search, Eye } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  user?: { firstName: string; lastName: string; email: string }
  grandTotal?: number
  paymentStatus: string
  paymentMethod?: string
  channel?: string
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/orders")
      let ordersArray: Order[] = []
      if (Array.isArray(data)) {
        ordersArray = data
      } else if (data?.data && Array.isArray(data.data)) {
        ordersArray = data.data
      }
      setOrders(ordersArray)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchSearch =
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === "all" || o.paymentStatus === filterStatus
    return matchSearch && matchStatus
  })

  const paginatedOrders = filteredOrders.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <GlassCard>
          <div className="mb-6">
            <h1 className="text-white text-2xl font-bold">Orders</h1>
            <p className="text-gray-400 text-sm mt-1">Manage customer orders and payments</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-blue"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-accent-blue"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No orders found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">ORDER #</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">CUSTOMER</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">METHOD</th>
                      <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">AMOUNT</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">STATUS</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">DATE</th>
                      <th className="text-center py-3 px-4 text-gray-400 text-xs font-medium">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paginatedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-accent-blue text-sm font-medium">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-white text-sm">
                          {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{order.paymentMethod || "—"}</td>
                        <td className="py-3 px-4 text-white text-sm text-right font-medium">
                          {formatCurrency(order.grandTotal || 0)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            order.paymentStatus === "paid"
                              ? "bg-accent-green/20 text-accent-green"
                              : order.paymentStatus === "pending"
                              ? "bg-accent-orange/20 text-accent-orange"
                              : "bg-accent-red/20 text-accent-red"
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4 text-center">
                          <button className="p-1 hover:bg-white/10 rounded transition">
                            <Eye className="w-4 h-4 text-accent-blue" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded text-sm transition ${
                        page === p
                          ? "bg-accent-blue text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </GlassCard>
      </main>
    </div>
  )
}