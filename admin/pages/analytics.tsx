"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency, cn } from "@/src/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

export default function AnalyticsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const stats = [
    { label: "Total Revenue", value: "KES 29,306.00", change: "+15.3%", icon: TrendingUp, color: "text-accent-green" },
    { label: "Total Orders", value: "25", change: "+8.2%", icon: TrendingUp, color: "text-accent-blue" },
    { label: "Avg Order Value", value: "KES 1,172.24", change: "-2.1%", icon: TrendingDown, color: "text-accent-orange" },
    { label: "Conversion Rate", value: "3.2%", change: "+0.5%", icon: TrendingUp, color: "text-accent-green" },
  ]

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Business performance metrics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <GlassCard key={idx}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                    <p className="text-white text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs mt-2 ${stat.color}`}>{stat.change}</p>
                  </div>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </GlassCard>
            )
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-white font-semibold text-sm mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {[
                { name: "Luxury Baby Stroller", sales: 18500 },
                { name: "Pampers Medium Size", sales: 7306 },
                { name: "Quilted Travel Diaper Bag Set", sales: 3500 },
              ].map((product, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <p className="text-white text-sm">{product.name}</p>
                    <p className="text-gray-400 text-xs mt-1">Top performer</p>
                  </div>
                  <span className="text-accent-green font-bold">KES {product.sales}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-white font-semibold text-sm mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {[
                { name: "Cash", value: 5320, color: "bg-accent-green" },
                { name: "Mobile Money", value: 5486, color: "bg-accent-blue" },
                { name: "Credit Card", value: 0, color: "bg-gray-600" },
                { name: "M-Pesa", value: 1825, color: "bg-accent-purple" },
              ].map((method, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${method.color}`} />
                    <p className="text-white text-sm">{method.name}</p>
                  </div>
                  <span className="text-gray-300 text-sm font-medium">KES {method.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}