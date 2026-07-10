"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

export function Header({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Refresh the page to reload all data
    window.location.reload()
  }

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-dark-800/95 backdrop-blur border-b border-white/5 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1" />
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw 
              className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
          
          {/* Other header content */}
        </div>
      </div>
    </header>
  )
}