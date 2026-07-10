"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { cn } from "@/src/lib/utils"
import { AlertCircle } from "lucide-react"

export default function InventoryPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const lowStockItems = [
    { id: "1", name: "Baby Wipes", current: 3, minimum: 10, status: "critical" },
    { id: "2", name: "Pacifiers", current: 5, minimum: 15, status: "low" },
    { id: "3", name: "Diapers Size 1", current: 8, minimum: 20, status: "low" },
  ]

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-accent-red" />
              <h1 className="text-white text-2xl font-bold">Low Stock Alert</h1>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">PRODUCT</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">CURRENT</th>
                    <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">MINIMUM</th>
                    <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {lowStockItems.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white font-medium text-sm">{item.name}</td>
                      <td className="py-3 px-4 text-accent-orange text-right font-bold">{item.current}</td>
                      <td className="py-3 px-4 text-gray-300 text-right text-sm">{item.minimum}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.status === "critical"
                              ? "bg-accent-red/20 text-accent-red"
                              : "bg-accent-orange/20 text-accent-orange"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}