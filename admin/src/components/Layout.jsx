import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart,
  Tag, Percent, LogOut, Users, ShoppingBag,
  Menu, X, Truck, Mail
} from 'lucide-react'
import { useState } from 'react'
import api from '../api'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/pos', icon: ShoppingBag, label: 'Point of Sale' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/promotions', icon: Percent, label: 'Promotions' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/delivery-zones', icon: Truck, label: 'Delivery Zones' },
  { to: '/subscribers', icon: Mail, label: 'Subscribers' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const logout = () => {
    api.post('/auth/logout').finally(() => navigate('/login', { replace: true }))
  }

  const mobileNavItems = navItems.slice(0, 4)

  return (
    <div className="flex h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl border-r border-rose-100 flex flex-col transform transition-transform duration-300 ease-in-out shadow-lg shadow-rose-100/40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 border-b border-rose-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">MiniMingle</h1>
            <p className="text-xs text-slate-500">Admin Dashboard</p>
          </div>
          <button
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200'
                    : 'text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-rose-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full min-w-0">
        <div className="mx-auto w-full max-w-[430px] lg:max-w-none lg:mx-0">
          <div className="lg:hidden flex items-center justify-between gap-3 px-3 py-3 bg-white/90 border-b border-rose-100 sticky top-0 z-30 backdrop-blur-sm shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                aria-label="Open navigation menu"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-full hover:bg-rose-50 text-slate-700 shrink-0"
              >
                <Menu size={18} />
              </button>
              <h1 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 truncate">MiniMingle</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm"
            >
              New Order
            </button>
          </div>

          <div className="p-2.5 sm:p-4 lg:p-6 w-full max-w-full overflow-x-hidden">
            <Outlet />
            {/* Leaves room so the floating bottom nav doesn't cover the last content */}
            <div className="h-24 lg:hidden" />
          </div>
        </div>

        <nav className="lg:hidden fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.25rem)] max-w-[392px] -translate-x-1/2 rounded-[26px] border border-white/60 bg-white/70 px-2 py-2 shadow-[0_18px_38px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-1">
            {mobileNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[9px] font-medium transition-all ${
                    isActive ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-[0_10px_20px_rgba(244,114,182,0.35)]' : 'text-slate-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon size={15} />
                    </span>
                    <span className="leading-none tracking-[-0.02em]">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </main>
    </div>
  )
}