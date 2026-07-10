"use client"

import { X, Download } from "lucide-react"
import { useState } from "react"
import { GlassCard } from "@/src/components/ui/GlassCard"

export function InstallPrompt() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <GlassCard className="flex items-center gap-3" padding="sm">
        <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-accent-blue" />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Install Demo Supermarket</p>
          <p className="text-gray-400 text-xs">Add to your home screen for quick access</p>
        </div>
        <button className="px-4 py-1.5 bg-accent-red hover:bg-accent-red/80 text-white text-xs font-medium rounded-lg transition-colors">
          Install
        </button>
        <button 
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </GlassCard>
    </div>
  )
}