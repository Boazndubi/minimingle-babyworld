import { useEffect, useState } from 'react'
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api'

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-6 border border-slate-200 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 text-slate-400">Loading dashboard...</div>
  )

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} color="bg-pink-500" />
        <StatCard label="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="bg-purple-500" />
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-500" />
        <StatCard label="Revenue (KES)" value={Number(stats.totalRevenue).toLocaleString()} icon={TrendingUp} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Revenue (Last 7 Days)</h3>
          {stats.revenueChart && stats.revenueChart.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-300 text-sm">
              No revenue data yet for the last 7 days.
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            Low Stock Alerts
          </h3>
          {stats.lowStockProducts?.length === 0 ? (
            <p className="text-slate-400 text-sm">All products well stocked.</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {stats.lowStockProducts?.map(product => (
                <div key={product.id} className="flex items-center gap-3">
                  {product.featuredImageUrl ? (
                    <img src={product.featuredImageUrl} alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{product.name}</p>
                    <p className={`text-xs ${product.quantity === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                      {product.quantity === 0 ? 'Out of stock' : `Only ${product.quantity} left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Recent Orders</h3>
        {stats.recentOrders.length === 0 ? (
          <p className="text-slate-400 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-2">Order #</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map(order => (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 font-mono text-xs">{order.orderNumber}</td>
                  <td className="py-2">{order.user?.firstName || 'Guest'}</td>
                  <td className="py-2">KES {Number(order.grandTotal).toLocaleString()}</td>
                  <td className="py-2">
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}