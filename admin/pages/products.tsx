"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { apiFetch } from "@/src/lib/api"
import { formatCurrency, cn } from "@/src/lib/utils"
import { Search, Plus, Edit, Trash2 } from "lucide-react"

interface Product {
  id: string
  name: string
  description?: string
  price?: number
  costPrice?: number
  quantity?: number
  category?: string
  status?: string
  featuredImageUrl?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await apiFetch("/products")
      
      // Handle different response formats
      let productsArray: Product[] = []
      if (Array.isArray(data)) {
        productsArray = data
      } else if (data?.data && Array.isArray(data.data)) {
        productsArray = data.data
      } else if (data?.products && Array.isArray(data.products)) {
        productsArray = data.products
      }
      
      setProducts(productsArray)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === "all" || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />
      
      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-white text-2xl font-bold">Products</h1>
              <p className="text-gray-400 text-sm mt-1">Manage your product inventory</p>
            </div>
            <button className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-blue focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-accent-blue"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={loadProducts}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No products found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">NAME</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">CATEGORY</th>
                      <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">PRICE</th>
                      <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">COST</th>
                      <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">STOCK</th>
                      <th className="text-left py-3 px-4 text-gray-400 text-xs font-medium">STATUS</th>
                      <th className="text-center py-3 px-4 text-gray-400 text-xs font-medium">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white text-sm font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{product.category || "—"}</td>
                        <td className="py-3 px-4 text-white text-sm text-right font-medium">
                          {formatCurrency(product.price || 0)}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          {formatCurrency(product.costPrice || 0)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={product.quantity && product.quantity <= 5 ? "text-accent-red font-medium" : "text-accent-green"}>
                            {product.quantity || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            product.status === "active"
                              ? "bg-accent-green/20 text-accent-green"
                              : "bg-gray-600/20 text-gray-400"
                          }`}>
                            {product.status || "inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button className="p-1 hover:bg-white/10 rounded transition">
                              <Edit className="w-4 h-4 text-accent-blue" />
                            </button>
                            <button className="p-1 hover:bg-white/10 rounded transition">
                              <Trash2 className="w-4 h-4 text-accent-red" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded text-sm transition ${
                        page === p
                          ? "bg-accent-blue text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </GlassCard>
      </main>
    </div>
  )
}