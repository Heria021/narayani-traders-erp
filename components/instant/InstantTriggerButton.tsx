'use client'

import { Zap } from 'lucide-react'
import { useInstantForms } from './instant-forms-context'
import { useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

export function InstantTriggerButton() {
  const { open } = useInstantForms()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <TooltipProvider delay={400}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              id="instant-actions-trigger"
              onClick={open}
              className="
                group relative flex items-center gap-2.5
                w-full rounded-xl px-3 py-2.5
                bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10
                border border-violet-200/60 dark:border-violet-800/40
                text-violet-700 dark:text-violet-300
                hover:from-violet-500/20 hover:via-purple-500/20 hover:to-indigo-500/20
                hover:border-violet-300 dark:hover:border-violet-700
                transition-all duration-200
                shadow-sm hover:shadow-md hover:shadow-violet-500/10
              "
              aria-label="Open Instant Actions"
            >
              {/* Animated icon */}
              <div className="relative flex items-center justify-center size-5 shrink-0">
                <Zap className="size-4 fill-current text-violet-600 dark:text-violet-400 transition-transform duration-200 group-hover:scale-110" />
              </div>

              {/* Label — hidden when sidebar is collapsed */}
              {!isCollapsed && (
                <span className="flex-1 text-left text-xs font-semibold tracking-wide truncate">
                  Instant
                </span>
              )}

              {/* Shortcut badge */}
              {!isCollapsed && (
                <div className="flex items-center gap-0.5 shrink-0 opacity-50 group-hover:opacity-80 transition-opacity">
                  <kbd className="inline-flex items-center rounded border border-current/30 px-1 py-0.5 font-mono text-[9px] leading-none">
                    ⌘⇧
                  </kbd>
                </div>
              )}
            </button>
          }
        />
        <TooltipContent side="right">
          Instant Actions — quick add forms
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
