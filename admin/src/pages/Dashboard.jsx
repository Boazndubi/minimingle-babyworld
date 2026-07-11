import { useEffect, useState } from 'react'
import {
  Package, ShoppingCart, Users, TrendingUp, AlertTriangle,
  Search, Bell, Plus, RefreshCw
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts'
import api from '../api'

const glass = {
  background: 'rgba(15, 21, 53, 0.7)',
  border: '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
}

const statColors = [
  { from: '#ec4899', to: '#be185d' },
  { from: '#8b5cf6', to: '#6d28d9' },
  { from: '#3b82f6', to: '#1d4ed8' },
  { from: '#10b981', to: '#047857' },
]

const statusColors = {
  pending: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  confirmed: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  shipped: { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
  delivered: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  const adminName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return user?.firstName || 'Admin'
    } catch {
      return 'Admin'
    }
  })()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchStats = () => {
    setLoading(true)
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  const greeting = () => {
    const h = time.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const formatTime = (d) => d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const formatDate = (d) => d.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ background: 'rgba(10,14,39,0.9)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div>
          <h2 className="text-base font-bold text-white">{greeting()}, {adminName}!</h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatDate(time)}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-white">{formatTime(time)}</span>
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onClick={fetchStats}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Search size={16} />
          </button>
          <button className="relative p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Bell size={16} />
            {stats?.lowStockProducts?.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
            <Plus size={13} /> New Order
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Products', value: stats?.totalProducts, icon: Package, color: statColors[0] },
                { label: 'Total Orders', value: stats?.totalOrders, icon: ShoppingCart, color: statColors[1] },
                { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: statColors[2] },
                { label: 'Revenue (KES)', value: Number(stats?.totalRevenue || 0).toLocaleString(), icon: TrendingUp, color: statColors[3] },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl p-5" style={glass}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                    <div className="p-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${color.from}22, ${color.to}22)` }}>
                      <Icon size={16} style={{ color: color.from }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <div className="mt-2 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }} />
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue Line Chart */}
              <div className="lg:col-span-2 rounded-2xl p-5" style={glass}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Revenue (Last 7 Days)</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Daily revenue overview</p>
                  </div>
                </div>
                {stats?.revenueChart?.some(d => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={11}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                      />
                      <Tooltip
                        formatter={(v) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                        contentStyle={{ background: '#0f1535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2.5}
                        dot={{ fill: '#ec4899', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    No revenue data for the last 7 days
                  </div>
                )}
              </div>

              {/* Low Stock */}
              <div className="rounded-2xl p-5 overflow-hidden" style={glass}>
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-orange-400" />
                  Low Stock Alerts
                </h3>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {stats?.lowStockProducts?.length || 0} items need attention
                </p>
                {stats?.lowStockProducts?.length === 0 ? (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>All products well stocked.</p>
                ) : (
                  <div className="space-y-3 max-h-[185px] overflow-y-auto">
                    {stats?.lowStockProducts?.map(product => (
                      <div key={product.id} className="flex items-center gap-3 min-w-0">
                        {product.featuredImageUrl ? (
                          <img src={product.featuredImageUrl} alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.05)' }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{product.name}</p>
                          <p className={`text-xs ${product.quantity === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                            {product.quantity === 0 ? 'Out of stock' : `Only ${product.quantity} left`}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: product.quantity === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: product.quantity === 0 ? '#ef4444' : '#f59e0b' }}>
                          {product.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-2xl p-5" style={glass}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Latest transactions</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  Live
                </span>
              </div>
              {stats?.recentOrders?.length === 0 ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No orders yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <th className="text-left pb-3 font-medium">Order #</th>
                      <th className="text-left pb-3 font-medium">Customer</th>
                      <th className="text-left pb-3 font-medium">Amount</th>
                      <th className="text-left pb-3 font-medium">Payment</th>
                      <th className="text-left pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentOrders?.map(order => {
                      const sc = statusColors[order.status] || statusColors.pending
                      return (
                        <tr key={order.id} className="border-t transition-colors"
                          style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                          <td className="py-3 font-mono" style={{ color: '#ec4899' }}>
                            {order.orderNumber?.slice(0, 18)}...
                          </td>
                          <td className="py-3 text-white">
                            {order.user?.firstName || order.shippingAddress?.name || 'Guest'}
                          </td>
                          <td className="py-3 font-semibold text-white">
                            KES {Number(order.grandTotal).toLocaleString()}
                          </td>
                          <td className="py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {order.paymentMethod?.toUpperCase()}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                              style={{ background: sc.bg, color: sc.text }}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}