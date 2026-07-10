"use client"

import { cn } from "@/src/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-dark-600 text-gray-300",
    success: "bg-accent-green/20 text-accent-green border border-accent-green/30",
    warning: "bg-accent-orange/20 text-accent-orange border border-accent-orange/30",
    danger: "bg-accent-red/20 text-accent-red border border-accent-red/30",
    info: "bg-accent-blue/20 text-accent-blue border border-accent-blue/30",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
