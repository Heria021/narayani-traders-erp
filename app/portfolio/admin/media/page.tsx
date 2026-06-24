'use client'

import { Image, Sparkles } from "lucide-react"

export default function MediaPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Media Library
          </h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Manage, filter, and audit uploaded floor plans, 3D renders, and site photos.
          </p>
        </div>
      </div>

      {/* Placeholder Workspace Area */}
      <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center bg-card/30">
        <div className="size-12 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
          <Image className="size-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-foreground">Media Asset Bucket</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
          A unified view showing uploaded files categorized into Renders, Floor Plans, and Site Photos. Filterable by category and project.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full font-mono border">
          <Sparkles className="size-3 text-amber-500" />
          Active: Studio Workspace Shell
        </div>
      </div>
    </div>
  )
}
