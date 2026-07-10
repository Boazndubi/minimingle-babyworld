"use client"

import { GlassCard } from "@/src/components/ui/GlassCard"
import { ShoppingCart, Package, AlertTriangle, Users } from "lucide-react"

interface QuickStatsProps {
  itemsSoldToday: number
  totalProducts: number
  activeProducts: number
  lowStockItems: number
  staffActive: number
}

export function QuickStats({ 
  itemsSoldToday, 
  totalProducts, 
  activeProducts, 
  lowStockItems, 
  staffActive 
}: QuickStatsProps) {
  const stats = [
    {
      icon: ShoppingCart,
      label: "Items Sold Today",
      value: itemsSoldToday,
      color: "text-accent-green",
      bgColor: "bg-accent-green/10",
    },
    {
      icon: Package,
      label: "Total Products",
      value: totalProducts,
      subValue: `${activeProducts} active`,
      color: "text-accent-blue",
      bgColor: "bg-accent-blue/10",
    },
    {
      icon: AlertTriangle,
      label: "Low Stock Items",
      value: lowStockItems,
      subValue: "need restocking",
      color: "text-accent-orange",
      bgColor: "bg-accent-orange/10",
    },
    {
      icon: Users,
      label: "Staff",
      value: staffActive,
      subValue: "active",
      color: "text-accent-purple",
      bgColor: "bg-accent-purple/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <GlassCard key={index} padding="sm" className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-white text-lg font-bold">{stat.value}</p>
            <p className="text-gray-400 text-xs">{stat.label}</p>
            {stat.subValue && (
              <p className="text-accent-orange text-xs">{stat.subValue}</p>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  )
}
