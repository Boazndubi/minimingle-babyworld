"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import { AlertTriangle } from "lucide-react"

interface LowStockProps {
  data?: { name: string; stock: number; reorderLevel: number }[]
}

export function LowStock({ data = [] }: LowStockProps) {
  const safeData = Array.isArray(data) ? data : []

  return (
    <GlassCard className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Low Stock Items</h3>
          <p className="text-gray-400 text-xs">Items below reorder level</p>
        </div>
        <AlertTriangle className="w-4 h-4 text-accent-orange" />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {safeData.map((item, index) => {
          const stock = item?.stock ?? 0
          const reorderLevel = item?.reorderLevel ?? 0
          const width = reorderLevel > 0 ? `${Math.min((stock / reorderLevel) * 100, 100)}%` : "0%"

          return (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs truncate">{item?.name ?? "Unnamed item"}</p>
                <p className="text-gray-500 text-xs">Reorder: {reorderLevel}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-dark-600 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      stock <= 2 ? "bg-accent-red" : "bg-accent-orange"
                    }`}
                    style={{ width }}
                  />
                </div>
                <span
                  className={`text-xs font-bold ${
                    stock <= 2 ? "text-accent-red" : "text-accent-orange"
                  }`}
                >
                  {stock}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}