'use client'

import { Button } from "@/components/ui/button"
import { Briefcase, Plus, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProjectsPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Projects Manager
          </h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Manage your architecture and 3D visualization clients, jobs, and execution phases.
          </p>
        </div>
        <Button onClick={() => router.push('/portfolio/admin/projects/new')} size="default" className="w-full sm:w-auto px-4 font-medium shrink-0">
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          New Project
        </Button>
      </div>

      {/* Placeholder Workspace Area */}
      <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center bg-card/30">
        <div className="size-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
          <Briefcase className="size-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-foreground">Projects Workspace</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
          High-level project lists, active phases (Concept, Under Construction, Completed), and portfolio visibility controls will appear here once connected to database assets.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full font-mono border">
          <Sparkles className="size-3 text-amber-500" />
          Active: Studio Workspace Shell
        </div>
      </div>
    </div>
  )
}
