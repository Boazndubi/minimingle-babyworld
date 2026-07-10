"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency } from "@/src/lib/utils"

interface TopProductsProps {
  data?: Array<{
    name: string
    sales: number
    revenue: number
    color?: string
  }>
}

export function TopProducts({ data = [] }: TopProductsProps) {
  const safeData = Array.isArray(data) ? data : []

  return (
    <GlassCard className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">Top Products</h3>
          <p className="text-gray-400 text-xs">Best performers</p>
        </div>
      </div>

      <div className="space-y-3">
        {safeData.map((product, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs truncate max-w-[60%]">
                {product.name}
              </span>
              <span className="text-accent-blue text-xs font-medium">
                {product.sales}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}