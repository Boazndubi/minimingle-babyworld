"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { cn } from "@/src/lib/utils"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Category {
  id: string
  name: string
  description: string
  products: number
}

export default function CategoriesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [categories] = useState<Category[]>([
    { id: "1", name: "Diapers & Wipes", description: "All diaper products", products: 24 },
    { id: "2", name: "Baby Feeding", description: "Bottles, formula, bibs", products: 18 },
    { id: "3", name: "Clothing", description: "Baby clothes and accessories", products: 45 },
  ])

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">Categories</h1>
              <p className="text-gray-400 text-sm mt-1">Manage product categories</p>
            </div>
            <button className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{category.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{category.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-accent-blue/20 rounded">
                      <Edit className="w-4 h-4 text-accent-blue" />
                    </button>
                    <button className="p-1 hover:bg-accent-red/20 rounded">
                      <Trash2 className="w-4 h-4 text-accent-red" />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded px-3 py-2">
                  <p className="text-accent-green font-bold text-lg">{category.products}</p>
                  <p className="text-gray-400 text-xs">Products</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </div>
  )
}