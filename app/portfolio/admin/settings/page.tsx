'use client'

import { Settings, Sparkles } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Studio Settings
          </h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Configure social accounts, tagline configurations, WhatsApp click-to-chat links, and portfolio biography options.
          </p>
        </div>
      </div>

      {/* Placeholder Workspace Area */}
      <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center bg-card/30">
        <div className="size-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <Settings className="size-6 animate-spin [animation-duration:8s]" />
        </div>
        <h3 className="text-base font-bold text-foreground">Studio Configurations</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
          Master tagline settings, WhatsApp redirects, biographical info, and custom service offerings setup will live here.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full font-mono border">
          <Sparkles className="size-3 text-amber-500" />
          Active: Studio Workspace Shell
        </div>
      </div>
    </div>
  )
}
