"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency, cn } from "@/src/lib/utils"
import { Search } from "lucide-react"

export default function PurchasesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const purchases = [
    { id: "PUR001", date: "2026-01-15", supplier: "Baby Goods Ltd", amount: 50000, items: 24, status: "completed" },
    { id: "PUR002", date: "2026-01-10", supplier: "Kids Store", amount: 35000, items: 18, status: "completed" },
  ]

  const filteredPurchases = purchases.filter(p =>
    p.id.includes(searchTerm) || p.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <GlassCard>
          <div className="mb-6">
            <h1 className="text-white text-2xl font-bold">Purchases</h1>
            <p className="text-gray-400 text-sm mt-1">View purchase orders and history</p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">PURCHASE ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">DATE</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">SUPPLIER</th>
                  <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">AMOUNT</th>
                  <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">ITEMS</th>
                  <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-accent-blue font-medium text-sm">{purchase.id}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{purchase.date}</td>
                    <td className="py-3 px-4 text-white text-sm">{purchase.supplier}</td>
                    <td className="py-3 px-4 text-white text-sm text-right font-medium">
                      {formatCurrency(purchase.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm text-right">{purchase.items}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-accent-green/20 text-accent-green rounded text-xs font-medium">
                        {purchase.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    </div>
  )
}