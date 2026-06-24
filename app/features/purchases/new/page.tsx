'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Plus, Trash2, AlertCircle, ChevronDown, X,
  Package, Loader2, CalendarDays, FileText, Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ProductQuickAdd } from '../_components/ProductQuickAdd'
import { useNewPurchase } from './useNewPurchase'
import { useBreadcrumb } from '@/components/app-shell'
import type {
  LineItemDraft, PurchaseHeaderValues, DiscountMode,
  Supplier, Product, QuickProductFormValues,
} from '../_components/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const num = (v: string | number) => Number(v) || 0
const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)
const today = () => new Date().toISOString().slice(0, 10)
function localId() { return Math.random().toString(36).slice(2) }

function computeLineTotal(row: LineItemDraft): number {
  return parseFloat((num(row.qty_input) * num(row.unit_price)).toFixed(2))
}
function computeBaseUnits(row: LineItemDraft): number {
  const qty = num(row.qty_input)
  if (row.buy_mode === 'box' && row.product?.units_per_box) return qty * row.product.units_per_box
  return qty
}
function emptyRow(): LineItemDraft {
  return { id: localId(), product: null, buy_mode: 'unit', qty_input: '', unit_price: '', tax_rate: '18', base_units: 0, line_total: 0 }
}

function normalized(value: string | null | undefined) {
  return (value ?? '').toLocaleLowerCase('en-IN')
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}{required && <span className="text-red-500 ml-0.5 normal-case">*</span>}
    </Label>
  )
}

// ─── SupplierSearch ───────────────────────────────────────────────────────────

function SupplierSearch({
  value, options, loading, onSelect, error,
}: {
  value: Supplier | null
  options: Supplier[]
  loading: boolean
  onSelect: (s: Supplier | null) => void
  error?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = normalized(query.trim())
    const filtered = q
      ? options.filter(s =>
        normalized(s.name).includes(q) ||
        normalized(s.phone).includes(q) ||
        normalized(s.email).includes(q)
      )
      : options
    return filtered.slice(0, 12)
  }, [options, query])

  function handleInput(next: string) {
    if (value) onSelect(null)
    setQuery(next)
    setOpen(true)
  }

  function pick(s: Supplier) {
    onSelect(s)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="space-y-1">
      <Popover open={open && !value} onOpenChange={setOpen}>
        <PopoverTrigger render={<div className="relative" />}>
          <Input
            value={value ? value.name : query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search supplier by name..."
            className={cn('pr-9', error && 'border-red-400 focus-visible:ring-red-400/40')}
          />
          {value ? (
            <button
              type="button"
              onClick={() => { onSelect(null); setQuery(''); setOpen(false) }}
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear supplier"
            >
              <X className="size-3.5" />
            </button>
          ) : loading ? (
            <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          )}
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="max-h-72 w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading suppliers...
            </div>
          ) : results.length > 0 ? (
            results.map(s => (
              <button
                key={s.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                onClick={() => pick(s)}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                  {(s.phone || s.email) && (
                    <p className="truncate text-xs text-muted-foreground">{s.phone || s.email}</p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              {query.trim() ? 'No suppliers found' : 'No suppliers available'}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" />{error}
        </p>
      )}
    </div>
  )
}

// ─── ProductSearch ────────────────────────────────────────────────────────────

function ProductSearch({
  value, options, loading, usedProductIds, onSelect, onQuickAdd,
}: {
  value: Product | null
  options: Product[]
  loading: boolean
  usedProductIds: string[]
  onSelect: (p: Product | null) => void
  onQuickAdd: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = normalized(query.trim())
    const filtered = q
      ? options.filter(p =>
        normalized(p.name).includes(q) ||
        normalized(p.sku).includes(q) ||
        normalized(p.unit_name).includes(q)
      )
      : options
    return filtered.slice(0, 18)
  }, [options, query])

  const hasExactProductName = useMemo(() => {
    const q = normalized(query.trim())
    return q.length > 0 && options.some(p => normalized(p.name) === q)
  }, [options, query])

  function handleInput(next: string) {
    setQuery(next)
    setOpen(true)
  }

  function pick(p: Product) {
    onSelect(p)
    setQuery('')
    setOpen(false)
  }

  const showQuickAdd = query.trim().length > 1 && !hasExactProductName

  return (
    <div className="relative">
      {value ? (
        <div className="flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3">
          <Package className="size-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-4 text-foreground">{value.name}</p>
            <p className="truncate text-[11px] leading-4 text-muted-foreground">
              {value.unit_name} · {rupee(value.purchase_price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onSelect(null); setQuery('') }}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear product"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={<div className="relative" />}>
            <Input
              value={query}
              onChange={e => handleInput(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Search product..."
              className="pr-8"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            )}
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="max-h-80 w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading products...
              </div>
            ) : results.length > 0 ? (
              results.map(p => {
                const alreadyUsed = usedProductIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={alreadyUsed}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors',
                      alreadyUsed ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/60',
                    )}
                    onClick={() => !alreadyUsed && pick(p)}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Package className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.sku ? `${p.sku} · ` : ''}{p.unit_name} · {rupee(p.purchase_price)}
                        {alreadyUsed && ' · already added'}
                      </p>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                {query.trim() ? `No products found for "${query.trim()}"` : 'No products available'}
              </div>
            )}
            {showQuickAdd && (
              <button
                type="button"
                className="mt-1 w-full rounded-md border-t border-border/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                onClick={() => { setOpen(false); onQuickAdd(query.trim()) }}
              >
                <p className="text-sm font-medium text-foreground">Add &quot;{query.trim()}&quot; as product</p>
              </button>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

// ─── Line Item Row ────────────────────────────────────────────────────────────

function LineItemRow({
  row, products, optionsLoading, usedProductIds, onUpdate, onRemove, onQuickAdd,
}: {
  row: LineItemDraft
  products: Product[]
  optionsLoading: boolean
  usedProductIds: string[]
  onUpdate: (id: string, patch: Partial<LineItemDraft>) => void
  onRemove: (id: string) => void
  onQuickAdd: (name: string, rowId: string) => void
}) {
  const lineTotal = computeLineTotal(row)
  const baseUnits = computeBaseUnits(row)

  function selectProduct(p: Product | null) {
    if (!p) { onUpdate(row.id, { product: null, unit_price: '', buy_mode: 'unit', qty_input: '' }); return }
    onUpdate(row.id, {
      product:    p,
      buy_mode:   'unit',
      unit_price: String(p.purchase_price),
      tax_rate:   String(p.gst_rate || 18),
      qty_input:  '',
    })
  }

  function toggleMode(mode: 'unit' | 'box') {
    if (!row.product) return
    const price = mode === 'box'
      ? String(row.product.box_purchase_price ?? row.product.purchase_price)
      : String(row.product.purchase_price)
    onUpdate(row.id, { buy_mode: mode, unit_price: price, qty_input: '' })
  }

  const canBox = row.product?.has_box && row.product?.units_per_box

  return (
    <tr className="group border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
      {/* Product */}
      <td className="py-3 pl-4 pr-3 align-middle min-w-[220px]">
        <ProductSearch
          value={row.product}
          options={products}
          loading={optionsLoading}
          usedProductIds={usedProductIds.filter(id => id !== row.product?.id)}
          onSelect={selectProduct}
          onQuickAdd={(name) => onQuickAdd(name, row.id)}
        />
      </td>

      {/* Mode toggle */}
      <td className="px-3 py-3 align-middle w-[100px]">
        <div className="flex rounded-lg overflow-hidden border border-border/60 h-9">
          <button type="button"
            onClick={() => toggleMode('unit')}
            className={cn(
              'flex-1 text-xs font-medium transition-colors',
              row.buy_mode === 'unit'
                ? 'bg-foreground text-background'
                : 'bg-background text-muted-foreground hover:bg-muted/50',
            )}>
            Unit
          </button>
          <button type="button"
            onClick={() => canBox && toggleMode('box')}
            disabled={!canBox}
            className={cn(
              'flex-1 text-xs font-medium transition-colors border-l border-border/60',
              !canBox && 'opacity-30 cursor-not-allowed',
              row.buy_mode === 'box' && canBox
                ? 'bg-foreground text-background'
                : 'bg-background text-muted-foreground hover:bg-muted/50',
            )}>
            Box
          </button>
        </div>
      </td>

      {/* Qty */}
      <td className="px-3 py-3 align-middle w-[90px]">
        <div>
          <Input
            type="number" min="0" step={row.buy_mode === 'box' ? '1' : '0.001'}
            value={row.qty_input}
            onChange={e => onUpdate(row.id, { qty_input: e.target.value })}
            placeholder="0"
            className="h-9 text-sm tabular-nums"
          />
          {row.buy_mode === 'box' && row.product?.units_per_box && num(row.qty_input) > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
              = {baseUnits} {row.product.unit_name}
            </p>
          )}
        </div>
      </td>

      {/* Unit price */}
      <td className="px-3 py-3 align-middle w-[110px]">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
          <Input
            type="number" min="0" step="0.01"
            value={row.unit_price}
            onChange={e => onUpdate(row.id, { unit_price: e.target.value })}
            placeholder="0"
            className="h-9 pl-6 text-sm tabular-nums"
          />
        </div>
      </td>

      {/* Tax % */}
      <td className="px-3 py-3 align-middle w-[80px]">
        <div className="relative">
          <Input
            type="number" min="0" max="100" step="0.01"
            value={row.tax_rate}
            onChange={e => onUpdate(row.id, { tax_rate: e.target.value })}
            className="h-9 pr-5 text-sm tabular-nums"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">%</span>
        </div>
      </td>

      {/* Line total */}
      <td className="px-3 py-3 text-right align-middle w-[120px]">
        <span className="text-sm tabular-nums font-semibold text-foreground">
          {lineTotal > 0 ? rupee(lineTotal) : <span className="text-muted-foreground/40">—</span>}
        </span>
      </td>

      {/* Delete */}
      <td className="py-3 pl-3 pr-4 align-middle w-10">
        <button type="button"
          onClick={() => onRemove(row.id)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPurchasePage() {
  const router = useRouter()
  const {
    generatePurchaseNumber,
    savePurchase,
    suppliers,
    products,
    optionsLoading,
    quickAddProduct,
  } = useNewPurchase()
  const { setCustomTitle } = useBreadcrumb()

  // ── header state ────────────────────────────────────────────────────────────
  const [header, setHeader] = useState<PurchaseHeaderValues>({
    purchase_number: '',
    purchase_date:   today(),
    supplier_id:     '',
    notes:           '',
  })
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [headerErrors, setHeaderErrors] = useState<Partial<Record<keyof PurchaseHeaderValues, string>>>({})

  // Set dynamic breadcrumb title
  useEffect(() => {
    setCustomTitle(header.purchase_number || 'New Purchase')
  }, [header.purchase_number, setCustomTitle])

  // ── line items state ─────────────────────────────────────────────────────────
  const [rows, setRows] = useState<LineItemDraft[]>([emptyRow()])

  // ── discount state ───────────────────────────────────────────────────────────
  const [discount,     setDiscount]     = useState('')
  const [discountMode, setDiscountMode] = useState<DiscountMode>('flat')

  // ── quick-add state ──────────────────────────────────────────────────────────
  const [quickAddOpen,  setQuickAddOpen]  = useState(false)
  const [quickAddName,  setQuickAddName]  = useState('')
  const [quickAddRowId, setQuickAddRowId] = useState('')

  // ── save state ───────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  // Generate PO number on mount
  useEffect(() => {
    generatePurchaseNumber().then(pn => {
      setHeader(h => ({ ...h, purchase_number: pn }))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── row helpers ──────────────────────────────────────────────────────────────
  const updateRow = useCallback((id: string, patch: Partial<LineItemDraft>) => {
    setRows(prev => prev.map(r => r.id !== id ? r : { ...r, ...patch }))
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.length === 1 ? [emptyRow()] : prev.filter(r => r.id !== id))
  }, [])

  const addRow = useCallback(() => {
    setRows(prev => [...prev, emptyRow()])
  }, [])

  const usedProductIds = rows.map(r => r.product?.id ?? '').filter(Boolean)

  // ── quick-add ────────────────────────────────────────────────────────────────
  function openQuickAdd(name: string, rowId: string) {
    setQuickAddName(name)
    setQuickAddRowId(rowId)
    setQuickAddOpen(true)
  }

  async function handleQuickAddSave(values: QuickProductFormValues): Promise<boolean> {
    const product = await quickAddProduct(values)
    if (!product) return false
    updateRow(quickAddRowId, {
      product,
      buy_mode:   'unit',
      unit_price: String(product.purchase_price),
      tax_rate:   String(product.gst_rate || 18),
      qty_input:  '',
    })
    setQuickAddOpen(false)
    return true
  }

  // ── totals ───────────────────────────────────────────────────────────────────
  const validRows   = rows.filter(r => r.product && num(r.qty_input) > 0)
  const subtotal    = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
  const taxAmount   = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
  const discountVal = discountMode === 'flat' ? num(discount) : subtotal * num(discount) / 100
  const grandTotal  = subtotal + taxAmount - discountVal

  // ── validation ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: typeof headerErrors = {}
    if (!header.purchase_number.trim()) errs.purchase_number = 'Required'
    if (!header.supplier_id)            errs.supplier_id     = 'Select a supplier'
    setHeaderErrors(errs)
    if (Object.keys(errs).length > 0) return false
    if (validRows.length === 0) {
      toast.error('Add at least one product with a valid quantity')
      return false
    }
    for (const r of validRows) {
      if (num(r.unit_price) === 0) toast.warning(`${r.product?.name} has price ₹0 — is this correct?`)
    }
    return true
  }

  // ── submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await savePurchase(header, rows, discount, discountMode)
    if (ok) {
      router.push('/features/purchases')
    } else {
      setSaving(false)
      try {
        const nextPn = await generatePurchaseNumber()
        setHeader(h => ({ ...h, purchase_number: nextPn }))
        toast.info(`Purchase number auto-refreshed to ${nextPn}. Please try saving again.`)
      } catch (err) {
        console.error('Failed to regenerate purchase number on failure:', err)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] p-4 space-y-4">

        {/* ── Section 1: Purchase Header ────────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
            <Building2 className="size-3.5 text-muted-foreground/60" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Purchase Details
            </p>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Row 1: PO number + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>Purchase Number</FieldLabel>
                <Input
                  value={header.purchase_number}
                  onChange={e => {
                    setHeader(h => ({ ...h, purchase_number: e.target.value }))
                    setHeaderErrors(e2 => ({ ...e2, purchase_number: undefined }))
                  }}
                  placeholder="PO-2025-001"
                  className={cn('font-mono', headerErrors.purchase_number && 'border-red-400')}
                />
                {headerErrors.purchase_number && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />{headerErrors.purchase_number}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3" />
                    Date
                  </span>
                </FieldLabel>
                <Input
                  type="date"
                  value={header.purchase_date}
                  onChange={e => setHeader(h => ({ ...h, purchase_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 2: Supplier */}
            <div className="space-y-1.5">
              <FieldLabel required>Supplier</FieldLabel>
              <SupplierSearch
                value={selectedSupplier}
                options={suppliers}
                loading={optionsLoading}
                onSelect={s => {
                  setSelectedSupplier(s)
                  setHeader(h => ({ ...h, supplier_id: s?.id ?? '' }))
                  setHeaderErrors(e => ({ ...e, supplier_id: undefined }))
                }}
                error={headerErrors.supplier_id}
              />
            </div>

            {/* Row 3: Notes */}
            <div className="space-y-1.5">
              <FieldLabel>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-3" />
                  Notes
                </span>
              </FieldLabel>
              <textarea
                value={header.notes}
                onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                rows={2}
                placeholder="e.g. Festival restock, urgent order…"
                className={cn(
                  'flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/40',
                  'transition-colors resize-none',
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Line Items ─────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Package className="size-3.5 text-muted-foreground/60" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Line Items
              </p>
              {validRows.length > 0 && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {validRows.length}
                </Badge>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-7 px-2.5 text-xs">
              <Plus className="size-3 mr-1" />Add Row
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] caption-bottom border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="border-b border-border/60 hover:bg-transparent">
                  {['Product', 'Mode', 'Qty', 'Unit Price', 'Tax %', 'Total', ''].map((col, i) => (
                    <th
                      key={i}
                      className={cn(
                        'h-10 align-middle text-xs font-medium text-muted-foreground whitespace-nowrap',
                        i === 0 ? 'pl-4 pr-3 text-left' : 
                        i === 6 ? 'py-3 pl-3 pr-4 w-10' : 
                        (i === 4 || i === 5) ? 'px-3 text-right' : 
                        'px-3 text-left'
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <LineItemRow
                    key={row.id}
                    row={row}
                    products={products}
                    optionsLoading={optionsLoading}
                    usedProductIds={usedProductIds}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                    onQuickAdd={openQuickAdd}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 3: Totals footer card ─────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="divide-y divide-border/60">

            {/* Subtotal */}
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-sm tabular-nums font-medium">{rupee(subtotal)}</p>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-muted-foreground">Tax (GST)</p>
              <p className="text-sm tabular-nums font-medium">{rupee(taxAmount)}</p>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between px-5 py-3 gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Discount</p>
                {/* mode toggle */}
                <div className="flex rounded-md overflow-hidden border border-border/60 text-xs h-6">
                  <button type="button"
                    onClick={() => setDiscountMode('flat')}
                    className={cn('px-2.5 transition-colors font-medium',
                      discountMode === 'flat' ? 'bg-foreground text-background' : 'bg-background text-muted-foreground hover:bg-muted/50'
                    )}>₹</button>
                  <button type="button"
                    onClick={() => setDiscountMode('percent')}
                    className={cn('px-2.5 transition-colors font-medium border-l border-border/60',
                      discountMode === 'percent' ? 'bg-foreground text-background' : 'bg-background text-muted-foreground hover:bg-muted/50'
                    )}>%</button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-28">
                  {discountMode === 'flat'
                    ? <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                    : <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                  }
                  <Input
                    type="number" min="0" step="0.01"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="0"
                    className={cn('h-8 text-sm tabular-nums', discountMode === 'flat' ? 'pl-6' : 'pr-6')}
                  />
                </div>
                <p className="text-sm tabular-nums font-medium text-emerald-600 dark:text-emerald-400 w-28 text-right">
                  {discountVal > 0 ? `−${rupee(discountVal)}` : '—'}
                </p>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between px-5 py-4 bg-muted/30">
              <p className="text-sm font-bold text-foreground">Grand Total</p>
              <p className="text-2xl tabular-nums font-bold text-foreground tracking-tight">
                {rupee(grandTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* bottom padding */}
        <div className="h-4" />
      </div>

      {/* ── Sticky bottom footer bar ───────────────────────────────────────── */}
      <div className="shrink-0 border-t bg-card px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grand Total:</span>
          <span className="text-lg font-bold text-foreground tabular-nums">{rupee(grandTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="default" onClick={() => router.back()} disabled={saving} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button type="submit" size="default" disabled={saving} className="h-9 px-5 text-xs font-semibold">
            {saving ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Saving…</> : 'Save Purchase'}
          </Button>
        </div>
      </div>

      {/* Quick-add product dialog */}
      <ProductQuickAdd
        open={quickAddOpen}
        initialName={quickAddName}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleQuickAddSave}
      />
    </form>
  )
}
