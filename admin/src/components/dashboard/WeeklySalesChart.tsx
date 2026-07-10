"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface WeeklySalesChartProps {
  data: { day: string; sales: number; profit: number }[]
}

export function WeeklySalesChart({ data }: WeeklySalesChartProps) {
  return (
    <GlassCard className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">This Week</h3>
          <p className="text-gray-400 text-xs">Daily sales overview</p>
        </div>
        <span className="text-accent-blue text-xs font-medium cursor-pointer hover:text-accent-cyan">
          View Report
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280" 
              fontSize={10}
              tickLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={10}
              tickLine={false}
              tickFormatter={(value) => `KES ${value/1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e2a5a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Sales"]}
            />
            <Bar 
              dataKey="sales" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar 
              dataKey="profit" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}