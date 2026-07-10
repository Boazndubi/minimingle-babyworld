"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { formatCurrency, cn } from "@/src/lib/utils"
import { Search, Plus, Edit, Trash2, X, Save } from "lucide-react"
import api from "@/src/lib/api"  // Uses axios like the store
import toast from "react-hot-toast"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  parentId?: string | null
  sortOrder?: number
  isVisible?: boolean
  createdAt?: string
}

interface Product {
  id: string
  name: string
  description?: string
  price?: number
  basePrice?: number
  costPrice?: number
  quantity?: number
  category?: Category | string
  categoryId?: string
  status?: string
  featuredImageUrl?: string
  sku?: string
}

interface ProductFormData {
  name: string
  description: string
  basePrice: number
  costPrice: number
  quantity: number
  categoryId: string
  status: string
  sku: string
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

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    basePrice: 0,
    costPrice: 0,
    quantity: 0,
    categoryId: "",
    status: "active",
    sku: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  // Fetch products using api.get() — same as store
  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get("/products")
      const data = res.data
      
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
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load products")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (category: Category | string | undefined): string => {
    if (!category) return "—"
    if (typeof category === "string") return category
    if (typeof category === "object" && category !== null && "name" in category) {
      return category.name
    }
    return "—"
  }

  const getCategoryId = (product: Product): string => {
    if (typeof product.category === "object" && product.category !== null) {
      return product.category.id
    }
    return product.categoryId || ""
  }

  // ─── Add Product ───
  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      description: "",
      basePrice: 0,
      costPrice: 0,
      quantity: 0,
      categoryId: "",
      status: "active",
      sku: "",
    })
    setShowModal(true)
  }

  // ─── Edit Product ───
  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || "",
      description: product.description || "",
      basePrice: product.basePrice || product.price || 0,
      costPrice: product.costPrice || 0,
      quantity: product.quantity || 0,
      categoryId: getCategoryId(product),
      status: product.status || "active",
      sku: product.sku || "",
    })
    setShowModal(true)
  }

  // ─── Save Product (Create or Update) ───
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Product name is required")
      return
    }
    if (formData.basePrice <= 0) {
      setError("Price must be greater than 0")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        basePrice: Number(formData.basePrice),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        quantity: Number(formData.quantity),
        categoryId: formData.categoryId || undefined,
        status: formData.status,
        sku: formData.sku || undefined,
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload)
      } else {
        await api.post("/products", payload)
      }

      setShowModal(false)
      setEditingProduct(null)
      await loadProducts()
      toast.success(editingProduct ? "Product updated!" : "Product created!")
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete Product ───
  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await api.delete(`/products/${productId}`)
      await loadProducts()
      toast.success("Product deleted!")
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to delete product")
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
            <button 
              onClick={openAddModal}
              className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
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
                        <td className="py-3 px-4 text-gray-300 text-sm">{getCategoryName(product.category)}</td>
                        <td className="py-3 px-4 text-white text-sm text-right font-medium">
                          {formatCurrency(product.basePrice || product.price || 0)}
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
                            <button 
                              onClick={() => openEditModal(product)}
                              className="p-1 hover:bg-white/10 rounded transition"
                            >
                              <Edit className="w-4 h-4 text-accent-blue" />
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              className="p-1 hover:bg-white/10 rounded transition"
                            >
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

      {/* ─── Add/Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-xl font-bold">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/10 rounded transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Base Price (KES) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Cost Price (KES)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. BAG-002"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Category ID</label>
                <input
                  type="text"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  placeholder="Enter category ID"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-blue"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-accent-green hover:bg-green-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}