"use client"

import { useState, useEffect } from "react"
import { fetchDashboardData } from "@/src/lib/api"

export interface SalesData {
  today: { amount: number; sales: number; change: number; cash: number }
  yesterday: { amount: number; sales: number; change: number; cash: number }
  thisWeek: { amount: number; sales: number; change: number; cash: number }
  thisMonth: { amount: number; sales: number; change: number; cash: number; mobileMoney: number }
  thisYear: {
    amount: number
    sales: number
    change: number
    cash: number
    mobileMoney: number
    credit: number
    mpesa: number
  }
}

export interface ProfitData {
  today: { amount: number; sales: number; costOfGoods: number; expenses: number }
  yesterday: { amount: number; sales: number; costOfGoods: number; expenses: number }
  thisWeek: { amount: number; sales: number; costOfGoods: number; expenses: number }
  thisMonth: { amount: number; sales: number; costOfGoods: number; expenses: number }
  thisYear: { amount: number; sales: number; costOfGoods: number; expenses: number }
}

export interface DashboardStats {
  itemsSoldToday: number
  totalProducts: number
  activeProducts: number
  lowStockItems: number
  staffActive: number
}

interface DashboardState {
  sales: SalesData | null
  profit: ProfitData | null
  stats: DashboardStats | null
  revenueTrends: any[]
  weeklySales: any[]
  peakHours: any[]
  paymentBreakdown: any[]
  topProducts: any[]
  recentSales: any[]
  lowStock: any[]
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardState>({
    sales: null,
    profit: null,
    stats: null,
    revenueTrends: [],
    weeklySales: [],
    peakHours: [],
    paymentBreakdown: [],
    topProducts: [],
    recentSales: [],
    lowStock: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const result = await fetchDashboardData()
        if (isMounted) {
          setData({
            sales: result.sales,
            profit: result.profit,
            stats: result.stats,
            revenueTrends: result.revenueTrends || [],
            weeklySales: result.weeklySales || [],
            peakHours: result.peakHours || [],
            paymentBreakdown: result.paymentBreakdown || [],
            topProducts: result.topProducts || [],
            recentSales: result.recentSales || [],
            lowStock: result.lowStock || [],
          })
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) loadData()
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return {
    sales: data.sales,
    profit: data.profit,
    stats: data.stats,
    revenueTrends: data.revenueTrends,
    weeklySales: data.weeklySales,
    peakHours: data.peakHours,
    paymentBreakdown: data.paymentBreakdown,
    topProducts: data.topProducts,
    recentSales: data.recentSales,
    lowStock: data.lowStock,
    loading,
    error,
  }
}
