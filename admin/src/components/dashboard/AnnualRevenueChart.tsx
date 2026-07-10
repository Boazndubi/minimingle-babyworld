"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency } from "@/src/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AnnualRevenueChartProps {
  data?: { month: string; revenue: number }[]
}

export function AnnualRevenueChart({ data = [] }: AnnualRevenueChartProps) {
  const safeData = Array.isArray(data) ? data : []
  const total = safeData.reduce((sum, d) => sum + (d?.revenue ?? 0), 0)

  return (
    <GlassCard className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Annual Revenue</h3>
          <p className="text-gray-400 text-xs">Last 12 months</p>
        </div>
        <span className="text-accent-blue text-xs font-medium">{formatCurrency(total)}</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              tickFormatter={(value) => `KES ${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e2a5a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}