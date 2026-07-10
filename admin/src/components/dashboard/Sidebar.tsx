"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  ShoppingBag,
  Users2,
  TrendingUp,
  Settings,
  DollarSign,
  Boxes,
  FileText,
} from "lucide-react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get logged-in user from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error("Failed to parse user data", err)
      }
    }
    setIsLoading(false)
  }, [])

  const mainMenuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Point of Sale", icon: ShoppingBag, href: "/point-of-sale" },
    { label: "Contacts", icon: Users2, href: "/contacts" },
    { label: "Purchases", icon: FileText, href: "/purchases" },
  ]

  const productsMenuItems = [
    { label: "All Products", icon: Package, href: "/products" },
    { label: "Categories", icon: Boxes, href: "/categories" },
    { label: "Inventory", icon: TrendingUp, href: "/inventory" },
  ]

  const settingsMenuItems = [
    { label: "Orders", icon: ShoppingCart, href: "/orders" },
    { label: "Users", icon: Users, href: "/users" },
    { label: "Analytics", icon: BarChart3, href: "/analytics" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const isActive = (href: string) => router.pathname === href

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-dark-800 border-r border-white/10 transition-all duration-300 z-50 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        {!collapsed && <h1 className="text-white font-bold text-sm">MiniMingle</h1>}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft
            className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {/* Main Menu */}
        <div>
          {!collapsed && <p className="text-gray-500 text-xs font-semibold px-2 mb-2">MAIN</p>}
          <div className="space-y-1">
            {mainMenuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    active
                      ? "bg-accent-blue text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Products Section */}
        <div>
          {!collapsed && (
            <p className="text-gray-500 text-xs font-semibold px-2 mb-2">PRODUCTS</p>
          )}
          <div className="space-y-1">
            {productsMenuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    active
                      ? "bg-accent-blue text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Settings Section */}
        <div>
          {!collapsed && (
            <p className="text-gray-500 text-xs font-semibold px-2 mb-2">MANAGEMENT</p>
          )}
          <div className="space-y-1">
            {settingsMenuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    active
                      ? "bg-accent-blue text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        {!isLoading && user ? (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 text-gray-300 hover:bg-accent-red/20 hover:text-accent-red rounded-lg transition"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
