"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { SalesCard } from "@/src/components/dashboard/SalesCard"
import { ProfitCard } from "@/src/components/dashboard/ProfitCard"
import { QuickStats } from "@/src/components/dashboard/QuickStats"
import { AnnualRevenueChart } from "@/src/components/dashboard/AnnualRevenueChart"
import { WeeklySalesChart } from "@/src/components/dashboard/WeeklySalesChart"
import { PeakHoursChart } from "@/src/components/dashboard/PeakHoursChart"
import { PaymentMethodsChart } from "@/src/components/dashboard/PaymentMethodsChart"
import { TopProducts } from "@/src/components/dashboard/TopProducts"
import { RecentSales } from "@/src/components/dashboard/RecentSales"
import { LowStock } from "@/src/components/dashboard/LowStock"
import { InstallPrompt } from "@/src/components/dashboard/InstallPrompt"
import { useDashboardData } from "@/src/hooks/useDashboardData"
import { cn } from "@/src/lib/utils"

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    sales, profit, stats,
    revenueTrends, weeklySales, peakHours, paymentBreakdown, topProducts, recentSales, lowStock,
    loading, error,
  } = useDashboardData()

  if (!isClient) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading dashboard…</p>
      </div>
    )
  }

  if (error || !sales || !profit || !stats) {
    return (
      <div className="min-h-screen bg-dashboard text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-red text-sm mb-4">Failed to load dashboard</p>
          <p className="text-gray-400 text-xs">{error}</p>
          <p className="text-gray-500 text-xs mt-2">Make sure you are logged in and the backend is running.</p>
        </div>
      </div>
    )
  }

  const safeLowStock = Array.isArray(lowStock) ? lowStock : []
  const safeRevenueTrends = Array.isArray(revenueTrends) ? revenueTrends : []
  const safeWeeklySales = Array.isArray(weeklySales) ? weeklySales : []
  const safePeakHours = Array.isArray(peakHours) ? peakHours : []
  const safePaymentBreakdown = Array.isArray(paymentBreakdown) ? paymentBreakdown : []
  const safeTopProducts = Array.isArray(topProducts) ? topProducts : []
  const safeRecentSales = Array.isArray(recentSales) ? recentSales : []

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <Header sidebarCollapsed={sidebarCollapsed} />
      
      <main 
        className={cn(
          "pt-20 pb-8 px-6 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Sales Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <SalesCard 
            title="Today" 
            amount={sales.today.amount} 
            sales={sales.today.sales} 
            change={sales.today.change ?? 0}
            payments={{ cash: sales.today.cash }}
            gradient="blue"
          />
          <SalesCard 
            title="Yesterday" 
            amount={sales.yesterday.amount} 
            sales={sales.yesterday.sales} 
            change={sales.yesterday.change ?? 0}
            payments={{ cash: sales.yesterday.cash }}
            gradient="blue"
          />
          <SalesCard 
            title="This Week" 
            amount={sales.thisWeek.amount} 
            sales={sales.thisWeek.sales} 
            change={sales.thisWeek.change ?? 0}
            payments={{ cash: sales.thisWeek.cash }}
            gradient="green"
          />
          <SalesCard 
            title="This Month" 
            amount={sales.thisMonth.amount} 
            sales={sales.thisMonth.sales} 
            change={sales.thisMonth.change ?? 0}
            payments={{ cash: sales.thisMonth.cash, mobileMoney: sales.thisMonth.mobileMoney }}
            gradient="orange"
          />
          <SalesCard 
            title="This Year" 
            amount={sales.thisYear.amount} 
            sales={sales.thisYear.sales} 
            change={sales.thisYear.change ?? 0}
            payments={{ 
              cash: sales.thisYear.cash, 
              mobileMoney: sales.thisYear.mobileMoney,
              credit: sales.thisYear.credit,
              mpesa: sales.thisYear.mpesa
            }}
            gradient="pink"
          />
        </div>

        {/* Profit & Loss Row */}
        <div className="mb-4">
          <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
            Profit & Loss <span className="text-gray-600">Sales - cost of goods - expenses</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <ProfitCard 
              title="Today" 
              amount={profit.today.amount} 
              sales={profit.today.sales} 
              costOfGoods={profit.today.costOfGoods} 
              expenses={profit.today.expenses} 
            />
            <ProfitCard 
              title="Yesterday" 
              amount={profit.yesterday.amount} 
              sales={profit.yesterday.sales} 
              costOfGoods={profit.yesterday.costOfGoods} 
              expenses={profit.yesterday.expenses} 
            />
            <ProfitCard 
              title="This Week" 
              amount={profit.thisWeek.amount} 
              sales={profit.thisWeek.sales} 
              costOfGoods={profit.thisWeek.costOfGoods} 
              expenses={profit.thisWeek.expenses} 
            />
            <ProfitCard 
              title="This Month" 
              amount={profit.thisMonth.amount} 
              sales={profit.thisMonth.sales} 
              costOfGoods={profit.thisMonth.costOfGoods} 
              expenses={profit.thisMonth.expenses} 
            />
            <ProfitCard 
              title="This Year" 
              amount={profit.thisYear.amount} 
              sales={profit.thisYear.sales} 
              costOfGoods={profit.thisYear.costOfGoods} 
              expenses={profit.thisYear.expenses} 
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-4">
          <QuickStats 
            itemsSoldToday={stats.itemsSoldToday}
            totalProducts={stats.totalProducts}
            activeProducts={stats.activeProducts}
            lowStockItems={safeLowStock.length}
            staffActive={0}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <AnnualRevenueChart data={safeRevenueTrends} />
          </div>
          <div>
            <WeeklySalesChart data={safeWeeklySales} />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <PeakHoursChart data={safePeakHours} />
          <PaymentMethodsChart data={safePaymentBreakdown} />
          <TopProducts data={safeTopProducts} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentSales data={safeRecentSales} />
          </div>
          <div>
            <LowStock data={safeLowStock} />
          </div>
        </div>
      </main>

      <InstallPrompt />
    </div>
  )
}