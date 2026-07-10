"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import { StatChange } from "@/src/components/ui/StatChange"
import { formatCurrency } from "@/src/lib/utils"
import { CircleDot } from "lucide-react"

interface PaymentBreakdown {
  cash?: number
  mobileMoney?: number
  credit?: number
  mpesa?: number
}

interface SalesCardProps {
  title: string
  amount: number
  sales: number
  change: number
  payments?: PaymentBreakdown
  gradient?: "blue" | "purple" | "green" | "orange" | "pink" | "none"
}

export function SalesCard({ 
  title, 
  amount, 
  sales, 
  change, 
  payments,
  gradient = "blue" 
}: SalesCardProps) {
  return (
    <GlassCard gradient={gradient} className="h-full">
      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          {title}
        </span>
        <StatChange value={change} />
      </div>

      <div className="mb-3">
        <h3 className="text-2xl font-bold text-white">
          {formatCurrency(amount)}
        </h3>
        <p className="text-gray-400 text-sm mt-0.5">
          {sales} sales
        </p>
      </div>

      {payments && (
        <div className="space-y-1.5 mt-3 pt-3 border-t border-white/5">
          {payments.cash !== undefined && (
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-gray-400">
                <CircleDot className="w-2.5 h-2.5 text-accent-blue fill-accent-blue" />
                Cash
              </span>
              <span className="text-white font-medium">{formatCurrency(payments.cash, "")}</span>
            </div>
          )}
          {payments.mobileMoney !== undefined && (
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-gray-400">
                <CircleDot className="w-2.5 h-2.5 text-accent-green fill-accent-green" />
                Mobile Money
              </span>
              <span className="text-white font-medium">{formatCurrency(payments.mobileMoney, "")}</span>
            </div>
          )}
          {payments.credit !== undefined && (
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-gray-400">
                <CircleDot className="w-2.5 h-2.5 text-accent-orange fill-accent-orange" />
                Credit
              </span>
              <span className="text-white font-medium">{formatCurrency(payments.credit, "")}</span>
            </div>
          )}
          {payments.mpesa !== undefined && (
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-gray-400">
                <CircleDot className="w-2.5 h-2.5 text-accent-purple fill-accent-purple" />
                M-Pesa
              </span>
              <span className="text-white font-medium">{formatCurrency(payments.mpesa, "")}</span>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}
