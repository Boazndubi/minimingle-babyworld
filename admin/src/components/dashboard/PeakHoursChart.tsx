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

interface PeakHoursChartProps {
  data: { hour: string; sales: number }[]
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  return (
    <GlassCard className="h-full">
      <div className="mb-4">
        <h3 className="text-white font-semibold text-sm">Peak Hours Today</h3>
        <p className="text-gray-400 text-xs">Sales distribution by hour</p>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="hour" 
              stroke="#6b7280" 
              fontSize={9}
              tickLine={false}
              interval={1}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={10}
              tickLine={false}
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
              fill="#6366f1" 
              radius={[2, 2, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}