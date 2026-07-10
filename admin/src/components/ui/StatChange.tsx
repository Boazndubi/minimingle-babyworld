"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface StatChangeProps {
  value: number
  className?: string
  showIcon?: boolean
}

export function StatChange({ value, className, showIcon = true }: StatChangeProps) {
  const isPositive = value >= 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        isPositive ? "text-accent-green" : "text-accent-red",
        className
      )}
    >
      {showIcon && (
        isPositive ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      )}
      {isPositive ? "+" : ""}{value}%
    </span>
  )
}
