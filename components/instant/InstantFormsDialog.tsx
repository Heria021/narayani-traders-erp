'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Package, Truck, Users, ShoppingCart, ReceiptText,
  ChevronLeft, ChevronRight, X, Keyboard, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstantForms, FORM_ORDER, type InstantFormKey } from './instant-forms-context'
import { ProductFormSlide }  from './form-slides/ProductFormSlide'
import { SupplierFormSlide } from './form-slides/SupplierFormSlide'
import { CustomerFormSlide } from './form-slides/CustomerFormSlide'
import { PurchaseFormSlide } from './form-slides/PurchaseNavSlide'
import { SaleNavSlide }      from './form-slides/SaleNavSlide'

// ─── form config ──────────────────────────────────────────────────────────────

interface FormConfig {
  key: InstantFormKey
  label: string
  shortcutDisplay: string
  icon: React.ElementType
  description: string
  component: React.ComponentType<{ onSuccess?: () => void }>
}

const FORM_CONFIG: FormConfig[] = [
  {
    key: 'product',
    label: 'Add Product',
    shortcutDisplay: '⌘⇧P',
    icon: Package,
    description: 'Add a new product to the catalog',
    component: ProductFormSlide,
  },
  {
    key: 'supplier',
    label: 'Add Supplier',
    shortcutDisplay: '⌘⇧S',
    icon: Truck,
    description: 'Register a new supplier account',
    component: SupplierFormSlide,
  },
  {
    key: 'customer',
    label: 'Add Customer',
    shortcutDisplay: '⌘⇧U',
    icon: Users,
    description: 'Register a new customer account',
    component: CustomerFormSlide,
  },
  {
    key: 'purchase',
    label: 'New Purchase',
    shortcutDisplay: '⌘⇧B',
    icon: ShoppingCart,
    description: 'Record a supplier purchase with line items',
    component: PurchaseFormSlide,
  },
  {
    key: 'sale',
    label: 'New Sale',
    shortcutDisplay: '⌘⇧L',
    icon: ReceiptText,
    description: 'Create a new sale invoice',
    component: SaleNavSlide,
  },
]

const SHORTCUT_HINTS = [
  { keys: ['⌘', '⇧', 'P'], desc: 'Jump to Add Product' },
  { keys: ['⌘', '⇧', 'S'], desc: 'Jump to Add Supplier' },
  { keys: ['⌘', '⇧', 'U'], desc: 'Jump to Add Customer' },
  { keys: ['⌘', '⇧', 'B'], desc: 'Jump to New Purchase' },
  { keys: ['⌘', '⇧', 'L'], desc: 'Jump to New Sale' },
  { keys: ['⌘', '→'], desc: 'Next form' },
  { keys: ['⌘', '←'], desc: 'Previous form' },
  { keys: ['Esc'], desc: 'Close dialog' },
]

// ─── component ────────────────────────────────────────────────────────────────

export function InstantFormsDialog() {
  const { isOpen, activeKey, close, goTo, next, prev } = useInstantForms()
  const bodyRef = useRef<HTMLDivElement>(null)
  const prevKeyRef = useRef<InstantFormKey>(activeKey)

  const activeIndex = FORM_ORDER.indexOf(activeKey)
  const prevIndex = FORM_ORDER.indexOf(prevKeyRef.current)
  const direction = activeIndex >= prevIndex ? 1 : -1

  useEffect(() => {
    prevKeyRef.current = activeKey
  }, [activeKey])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0
  }, [activeKey])

  // ── keyboard shortcuts ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey

    if (e.key === 'Escape') { close(); return }

    if (mod && e.key === 'ArrowRight') { e.preventDefault(); next(); return }
    if (mod && e.key === 'ArrowLeft')  { e.preventDefault(); prev(); return }
    if (mod && e.key === ']')          { e.preventDefault(); next(); return }
    if (mod && e.key === '[')          { e.preventDefault(); prev(); return }

    if (mod && e.shiftKey) {
      const map: Record<string, InstantFormKey> = {
        P: 'product', S: 'supplier', U: 'customer', B: 'purchase', L: 'sale',
      }
      const target = map[e.key.toUpperCase()]
      if (target) { e.preventDefault(); goTo(target) }
    }
  }, [close, next, prev, goTo])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const activeConfig = FORM_CONFIG.find(c => c.key === activeKey) ?? FORM_CONFIG[0]
  const ActiveSlide = activeConfig.component

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ──────────────────────────────────────────────── */}
          <motion.div
            key="instant-backdrop"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
          />

          {/* ── Dialog panel ──────────────────────────────────────────── */}
          <motion.div
            key="instant-dialog"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            aria-modal="true"
            role="dialog"
            aria-label="Instant Actions"
          >
            <motion.div
              className="
                relative flex flex-col pointer-events-auto
                w-[96vw] h-[94vh] max-w-[1120px]
                bg-background border border-border
                rounded-2xl shadow-2xl shadow-black/15
                overflow-hidden
              "
              initial={{ opacity: 0, scale: 0.97, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* ── Header ────────────────────────────────────────────── */}
              <div className="shrink-0 border-b border-border bg-background">
                {/* Title row */}
                <div className="flex items-center justify-between px-6 pt-4 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-7 rounded-lg bg-foreground text-background">
                      <Zap className="size-3.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground leading-tight">Instant Actions</h2>
                      <p className="text-[11px] text-muted-foreground leading-tight">{activeConfig.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    className="flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Tab strip */}
                <div className="flex items-stretch overflow-x-auto scrollbar-none px-4 gap-0.5">
                  {FORM_CONFIG.map((config) => {
                    const Icon = config.icon
                    const isActive = config.key === activeKey
                    return (
                      <button
                        key={config.key}
                        onClick={() => goTo(config.key)}
                        className={`
                          group relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium whitespace-nowrap
                          transition-colors duration-150 rounded-t-lg border-b-2
                          ${isActive
                            ? 'border-foreground text-foreground bg-muted/40'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                          }
                        `}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{config.label}</span>
                        <kbd className={`
                          hidden sm:inline-flex items-center rounded border px-1 py-0.5 font-mono text-[9px] leading-none
                          transition-opacity border-border
                          ${isActive ? 'opacity-60' : 'opacity-30 group-hover:opacity-50'}
                        `}>
                          {config.shortcutDisplay}
                        </kbd>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Scrollable Body ────────────────────────────────────── */}
              <div ref={bodyRef} className="flex-1 overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={activeKey}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -40 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="px-8 py-6"
                  >
                    <ActiveSlide onSuccess={() => {}} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── Footer ────────────────────────────────────────────── */}
              <div className="shrink-0 border-t border-border bg-muted/20 px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                  {/* Navigation arrows */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prev}
                      className="h-8 w-8 p-0"
                      aria-label="Previous form"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {activeIndex + 1} / {FORM_ORDER.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={next}
                      className="h-8 w-8 p-0"
                      aria-label="Next form"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
                    {FORM_ORDER.map((key, i) => (
                      <button
                        key={key}
                        onClick={() => goTo(key)}
                        className={`
                          rounded-full transition-all duration-200
                          ${key === activeKey
                            ? 'w-4 h-2 bg-foreground'
                            : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                          }
                        `}
                        aria-label={`Go to ${FORM_CONFIG[i].label}`}
                      />
                    ))}
                  </div>

                  {/* Shortcuts hint */}
                  <ShortcutsHint />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── shortcuts tooltip ────────────────────────────────────────────────────────

function ShortcutsHint() {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted">
        <Keyboard className="size-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      <div className="
        absolute bottom-full right-0 mb-2 w-64
        bg-popover border border-border rounded-xl shadow-xl
        p-3 space-y-2
        opacity-0 pointer-events-none scale-95 origin-bottom-right
        group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100
        transition-all duration-150 z-10
      ">
        <p className="text-[11px] font-semibold text-foreground mb-2">Keyboard shortcuts</p>
        {SHORTCUT_HINTS.map(({ keys, desc }) => (
          <div key={desc} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">{desc}</span>
            <div className="flex items-center gap-0.5 shrink-0">
              {keys.map((k, i) => (
                <kbd
                  key={i}
                  className="inline-flex items-center rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] leading-none"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
