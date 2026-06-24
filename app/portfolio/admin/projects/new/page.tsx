'use client'

import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NewProjectPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 shrink-0">
        <div>
          <Button
            onClick={() => router.push('/portfolio/admin/projects')}
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 -ml-2"
          >
            <ArrowLeft className="size-3.5" />
            Back to Projects
          </Button>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            New Project
          </h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Create a new client job entry and set scope targets.
          </p>
        </div>
      </div>

      {/* Placeholder Workspace Area */}
      <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center bg-card/30">
        <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <FileText className="size-6 animate-bounce" />
        </div>
        <h3 className="text-base font-bold text-foreground">Project Form Placeholder</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
          The project details capture sheet (capturing client details, deal amounts, scopes, and the Inline Quick-Add Product modal) will live here.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full font-mono border">
          <Sparkles className="size-3 text-amber-500" />
          Active: Studio Workspace Shell
        </div>
      </div>
    </div>
  )
}
