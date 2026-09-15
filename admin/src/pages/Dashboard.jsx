import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  background: 'rgba(255, 255, 255, 0.82)',
  border: '1px solid rgba(244, 114, 182, 0.12)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 14px 35px rgba(15, 23, 42, 0.08)',
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

const quickActions = [
  { title: 'Add Product', subtitle: 'Create a new baby item', accent: 'from-pink-500 to-rose-500', icon: Package },
  { title: 'Open Orders', subtitle: 'Check latest purchases', accent: 'from-violet-500 to-indigo-500', icon: ShoppingCart },
  { title: 'Boost Sales', subtitle: 'Review best sellers', accent: 'from-amber-400 to-orange-500', icon: TrendingUp },
]

const formatCurrency = (value) => new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())
  const [showSearch, setShowSearch] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')

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

  const handleQuickSearch = () => {
    const trimmed = quickSearch.trim()
    if (trimmed) {
      navigate('/products')
      setShowSearch(false)
      setQuickSearch('')
      return
    }
    setShowSearch((prev) => !prev)
  }

  const formatTime = (d) => d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const formatDate = (d) => d.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-6 py-3 border-b flex-shrink-0 flex-wrap"
        style={{ background: 'linear-gradient(135deg, #fb7185 0%, #f97316 55%, #f59e0b 100%)', borderColor: 'rgba(255,255,255,0.25)' }}>
        <div className="min-w-0 flex-1 sm:flex-none">
          <h2 className="text-sm sm:text-base font-bold text-white truncate">{greeting()}, {adminName}!</h2>
          <p className="text-[10px] sm:text-xs text-white/80">{formatDate(time)}</p>
        </div>
        <div className="relative flex items-center gap-1.5 sm:gap-4 flex-wrap justify-end">
          <span className="hidden sm:inline text-sm font-mono text-white/90">{formatTime(time)}</span>
          <span className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-100 border border-emerald-200/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Online
          </span>
          <button type="button" className="p-2 rounded-lg transition-colors text-white/80 hover:bg-white/10" onClick={fetchStats}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="relative">
            <button type="button" className="p-2 rounded-lg text-white/80 hover:bg-white/10" onClick={handleQuickSearch}>
              <Search size={16} />
            </button>
            {showSearch && (
              <div className="absolute right-0 top-12 z-50 w-[72vw] max-w-72 rounded-2xl border border-rose-100 bg-white p-3 shadow-xl">
                <input
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-pink-300 focus:bg-white"
                />
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => navigate('/products')} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">Products</button>
                  <button type="button" onClick={() => navigate('/orders')} className="flex-1 rounded-lg bg-pink-500 px-3 py-2 text-xs font-medium text-white hover:bg-pink-600">Orders</button>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button type="button" className="relative p-2 rounded-lg text-white/80 hover:bg-white/10" onClick={() => setShowAlerts((prev) => !prev)}>
              <Bell size={16} />
              {stats?.lowStockProducts?.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {showAlerts && (
              <div className="absolute right-0 top-12 z-50 w-[80vw] max-w-80 rounded-2xl border border-rose-100 bg-white p-3 shadow-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Alerts</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(stats?.lowStockProducts?.length ? stats.lowStockProducts : [{ id: 'none', name: 'No low-stock alerts right now.' }]).map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button type="button" onClick={() => navigate('/pos')} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap bg-slate-900/10 hover:bg-slate-900/20">
            <Plus size={13} /> <span className="hidden sm:inline">New Order</span>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Products', value: stats?.totalProducts, icon: Package, color: statColors[0] },
                { label: 'Total Orders', value: stats?.totalOrders, icon: ShoppingCart, color: statColors[1] },
                { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: statColors[2] },
                { label: 'Revenue (KES)', value: Number(stats?.totalRevenue || 0).toLocaleString(), icon: TrendingUp, color: statColors[3] },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-2xl p-5" style={glass}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <div className="p-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${color.from}22, ${color.to}22)` }}>
                      <Icon size={16} style={{ color: color.from }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <div className="mt-2 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color.from}, ${color.to})` }} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {quickActions.map(({ title, subtitle, accent, icon: Icon }) => (
                <div key={title} className="rounded-2xl p-4 border border-rose-100 bg-white/80 shadow-sm shadow-rose-100/50">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${accent} flex items-center justify-center text-white mb-3`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-3 sm:gap-4">
              <div className="rounded-2xl p-5 overflow-hidden relative" style={{ ...glass, background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,241,242,0.88))' }}>
                <div className="absolute -top-12 -right-10 h-32 w-32 rounded-full bg-pink-200/30 blur-2xl" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sales Summary</p>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">This month</h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-semibold">+12.5%</span>
                </div>
                <div className="flex items-end justify-between gap-3 relative z-10">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                    <p className="text-xs text-slate-500 mt-1">from {stats?.totalOrders || 0} completed orders</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right border border-emerald-100">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-700">Profit</p>
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency((Number(stats?.totalRevenue || 0) * 0.18).toFixed(2))}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ ...glass, background: 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(245,243,255,0.9))' }}>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Today</p>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{stats?.recentOrders?.length || 0} Orders</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Pending</span>
                    <span className="font-semibold text-amber-600">{stats?.recentOrders?.filter(order => order.status === 'pending').length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Shipped</span>
                    <span className="font-semibold text-violet-600">{stats?.recentOrders?.filter(order => order.status === 'shipped').length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Delivered</span>
                    <span className="font-semibold text-emerald-600">{stats?.recentOrders?.filter(order => order.status === 'delivered').length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Revenue Line Chart */}
              <div className="lg:col-span-2 rounded-2xl p-5" style={glass}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Revenue (Last 7 Days)</h3>
                    <p className="text-xs mt-0.5 text-slate-500">Daily revenue overview</p>
                  </div>
                </div>
                {stats?.revenueChart?.some(d => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                      />
                      <Tooltip
                        formatter={(v) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
                        contentStyle={{ background: '#fff', border: '1px solid rgba(244,114,182,0.15)', borderRadius: 8, fontSize: 12, color: '#0f172a' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2.5}
                        dot={{ fill: '#ec4899', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                    No revenue data for the last 7 days
                  </div>
                )}
              </div>

              {/* Low Stock */}
              <div className="rounded-2xl p-5 overflow-hidden" style={glass}>
                <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <AlertTriangle size={15} className="text-orange-500" />
                  Low Stock Alerts
                </h3>
                <p className="text-xs mb-4 text-slate-500">
                  {stats?.lowStockProducts?.length || 0} items need attention
                </p>
                {stats?.lowStockProducts?.length === 0 ? (
                  <p className="text-xs text-slate-400">All products well stocked.</p>
                ) : (
                  <div className="space-y-3 max-h-[185px] overflow-y-auto">
                    {stats?.lowStockProducts?.map(product => (
                      <div key={product.id} className="flex items-center gap-3 min-w-0 rounded-xl bg-rose-50/70 p-2">
                        {product.featuredImageUrl ? (
                          <img src={product.featuredImageUrl} alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-slate-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{product.name}</p>
                          <p className={`text-xs ${product.quantity === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                            {product.quantity === 0 ? 'Out of stock' : `Only ${product.quantity} left`}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: product.quantity === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.14)', color: product.quantity === 0 ? '#ef4444' : '#f59e0b' }}>
                          {product.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-3 sm:gap-4">
              {/* Recent Orders */}
              <div className="rounded-2xl p-5" style={glass}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Recent Orders</h3>
                    <p className="text-xs mt-0.5 text-slate-500">Latest transactions</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Live
                  </span>
                </div>
                {stats?.recentOrders?.length === 0 ? (
                  <p className="text-xs text-slate-400">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto -mx-1 px-1">
                    <table className="min-w-[560px] w-full text-xs">
                      <thead>
                        <tr className="text-slate-500">
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
                              style={{ borderColor: 'rgba(15, 23, 42, 0.06)' }}>
                              <td className="py-3 font-mono text-pink-600">
                                {order.orderNumber?.slice(0, 18)}...
                              </td>
                              <td className="py-3 text-slate-700">
                                {order.user?.firstName || order.shippingAddress?.name || 'Guest'}
                              </td>
                              <td className="py-3 font-semibold text-slate-800">
                                {formatCurrency(order.grandTotal)}
                              </td>
                              <td className="py-3 text-slate-500">
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
                  </div>
                )}
              </div>

              {/* Activity Feed */}
              <div className="rounded-2xl p-5" style={{ ...glass, background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(254,242,242,0.9))' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
                    <p className="text-xs mt-0.5 text-slate-500">Recent business updates</p>
                  </div>
                  <span className="rounded-full bg-pink-100 text-pink-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">Live</span>
                </div>

                <div className="space-y-3">
                  {stats?.recentOrders?.slice(0, 4).map((order, index) => (
                    <div key={order.id || index} className="flex items-start gap-3 rounded-xl bg-white/70 p-3 border border-rose-100">
                      <div className="mt-0.5 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-white flex items-center justify-center text-[10px] font-bold">
                        {String(order.user?.firstName || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {order.user?.firstName || 'Guest'} placed an order
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatCurrency(order.grandTotal)} • {order.status}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <div className="rounded-xl bg-white/70 p-3 border border-rose-100 text-sm text-slate-500">
                      No recent activity yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}