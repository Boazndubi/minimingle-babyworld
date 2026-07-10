"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency } from "@/src/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ProfitCardProps {
  title: string
  amount: number
  sales: number
  costOfGoods: number
  expenses: number
  isProfit?: boolean
}

export function ProfitCard({ 
  title, 
  amount, 
  sales, 
  costOfGoods, 
  expenses,
  isProfit = true 
}: ProfitCardProps) {
  return (
    <GlassCard className="h-full">
      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          {title}
        </span>
        <span className="flex items-center gap-1 text-accent-green text-xs font-semibold">
          <TrendingUp className="w-3 h-3" />
          Profit
        </span>
      </div>

      <div className="mb-3">
        <h3 className={`text-xl font-bold ${isProfit ? "text-accent-green" : "text-accent-red"}`}>
          {formatCurrency(amount)}
        </h3>
      </div>

      <div className="space-y-1.5 mt-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Sales</span>
          <span className="text-white font-medium">{formatCurrency(sales, "")}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Cost of goods</span>
          <span className="text-accent-red font-medium">{formatCurrency(costOfGoods, "")}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Expenses</span>
          <span className="text-accent-red font-medium">{formatCurrency(expenses, "")}</span>
        </div>
      </div>
    </GlassCard>
  )
}
