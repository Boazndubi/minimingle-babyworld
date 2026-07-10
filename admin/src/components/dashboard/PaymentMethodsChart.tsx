"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency } from "@/src/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface PaymentMethodsChartProps {
  data?: Array<{ name: string; value: number; color: string }>
}

export function PaymentMethodsChart({ data = [] }: PaymentMethodsChartProps) {
  const safeData = Array.isArray(data) ? data : []

  return (
    <GlassCard className="h-full">
      <div className="mb-4">
        <h3 className="text-white font-semibold text-sm">Payment Methods</h3>
        <p className="text-gray-400 text-xs">Year-to-date split by payment type</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={safeData} dataKey="value">
                {safeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e2a5a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {safeData.map((method, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: method.color }}
                />
                <span className="text-gray-300 text-xs">{method.name}</span>
              </div>
              <span className="text-white text-xs font-medium">
                {formatCurrency(method.value, "")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}