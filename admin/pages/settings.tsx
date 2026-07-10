"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/dashboard/Sidebar"
import { Header } from "@/src/components/dashboard/Header"
import { GlassCard } from "@/src/components/ui/GlassCard"
import { cn } from "@/src/lib/utils"
import { Save } from "lucide-react"

export default function SettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [settings, setSettings] = useState({
    storeName: "MiniMingle Baby World",
    storeEmail: "admin@minimingle.com",
    storeCurrency: "KES",
    taxRate: "0",
  })

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = () => {
    alert("Settings saved successfully!")
  }

  return (
    <div className="min-h-screen bg-dashboard text-white">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Header sidebarCollapsed={sidebarCollapsed} />

      <main className={cn("pt-20 pb-8 px-6 transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-64")}>
        <GlassCard>
          <h1 className="text-white text-2xl font-bold mb-6">Settings</h1>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => handleChange("storeName", e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Store Email</label>
              <input
                type="email"
                value={settings.storeEmail}
                onChange={(e) => handleChange("storeEmail", e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
              <select
                value={settings.storeCurrency}
                onChange={(e) => handleChange("storeCurrency", e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) => handleChange("taxRate", e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition mt-6"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
          </div>
        </GlassCard>
      </main>
    </div>
  )
}