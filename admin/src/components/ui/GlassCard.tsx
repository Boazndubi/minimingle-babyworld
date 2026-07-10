"use client"

import { cn } from "@/src/lib/utils"
import { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  gradient?: "blue" | "purple" | "green" | "orange" | "pink" | "none"
  padding?: "sm" | "md" | "lg"
}

export function GlassCard({ 
  children, 
  className, 
  gradient = "none",
  padding = "md" 
}: GlassCardProps) {
  const gradientStyles = {
    blue: "border-l-4 border-l-accent-blue",
    purple: "border-l-4 border-l-accent-purple",
    green: "border-l-4 border-l-accent-green",
    orange: "border-l-4 border-l-accent-orange",
    pink: "border-l-4 border-l-accent-pink",
    none: "",
  }

  const paddingStyles = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  }

  return (
    <div
      className={cn(
        "relative rounded-xl bg-glass backdrop-blur-glass border border-glass-border",
        "shadow-lg shadow-black/20",
        "transition-all duration-300 hover:shadow-xl hover:shadow-black/30",
        gradientStyles[gradient],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  )
}