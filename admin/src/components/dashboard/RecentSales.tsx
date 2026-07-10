"use client"

import { useState } from "react"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency } from "@/src/lib/utils"
import { Badge } from "@/src/components/ui/Badge"

interface RecentSalesProps {
  data?: { id: string; cashier: string; method: string; amount: number; time: string | Date }[]
}

export function RecentSales({ data = [] }: RecentSalesProps) {
  const [limit, setLimit] = useState(10)
  const safeData = Array.isArray(data) ? data.slice(0, limit) : []

  const formatTime = (time: string | Date) => {
    try {
      const date = new Date(time)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return String(time)
    }
  }

  return (
    <GlassCard className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Recent Sales</h3>
          <p className="text-gray-400 text-xs">Latest {safeData.length} transactions</p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="text-xs bg-white/10 text-white px-2 py-1 rounded border border-white/20"
        >
          <option value={5}>Last 5</option>
          <option value={10}>Last 10</option>
          <option value={20}>Last 20</option>
          <option value={50}>Last 50</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-white/5">
              <th className="text-gray-400 text-xs font-medium pb-2 pr-3">SALE ID</th>
              <th className="text-gray-400 text-xs font-medium pb-2 pr-3">CASHIER</th>
              <th className="text-gray-400 text-xs font-medium pb-2 pr-3">METHOD</th>
              <th className="text-gray-400 text-xs font-medium pb-2 pr-3 text-right">AMOUNT</th>
              <th className="text-gray-400 text-xs font-medium pb-2 text-right">TIME</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {safeData.length > 0 ? (
              safeData.map((sale, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 pr-3 text-accent-blue text-xs font-medium">{sale.id}</td>
                  <td className="py-2 pr-3 text-gray-300 text-xs">{sale.cashier}</td>
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-accent-green/20 text-accent-green">
                      {sale.method}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-white text-xs font-medium text-right">{formatCurrency(sale.amount)}</td>
                  <td className="py-2 text-gray-400 text-xs text-right">{formatTime(sale.time)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">No sales data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}