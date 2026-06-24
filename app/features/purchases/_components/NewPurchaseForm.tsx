'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Plus, Trash2, AlertCircle, ChevronDown, Package } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ProductQuickAdd } from './ProductQuickAdd'
import type {
  LineItemDraft, PurchaseHeaderValues, DiscountMode,
  Supplier, Product, QuickProductFormValues,
} from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const num = (v: string | number) => Number(v) || 0
const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)
const today = () => new Date().toISOString().slice(0, 10)
function localId() { return Math.random().toString(36).slice(2) }

function computeLineTotal(row: LineItemDraft): number {
  const qty = num(row.qty_input)
  const price = num(row.unit_price)
  return parseFloat((qty * price).toFixed(2))
}

function computeBaseUnits(row: LineItemDraft): number {
  const qty = num(row.qty_input)
  if (row.buy_mode === 'box' && row.product?.units_per_box) {
    return qty * row.product.units_per_box
  }
  return qty
}

function emptyRow(): LineItemDraft {
  return {
    id: localId(),
    product: null,
    buy_mode: 'unit',
    qty_input: '',
    unit_price: '',
    tax_rate: '18',
    base_units: 0,
    line_total: 0,
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-sm font-medium text-foreground/80">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
  )
}

// ─── Supplier search ──────────────────────────────────────────────────────────

function SupplierSearch({
  value, onSelect, onSearch, error,
}: {
  value: Supplier | null
  onSelect: (s: Supplier) => void
  onSearch: (q: string) => Promise<Supplier[]>
  error?: string
}) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Supplier[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleInput(q: string) {
    setQuery(q)
    if (q.trim().length < 1) { setResults([]); return }
    setLoading(true)
    const res = await onSearch(q)
    setResults(res)
    setOpen(true)
    setLoading(false)
  }

  function pick(s: Supplier) {
    onSelect(s)
    setQuery(s.name)
    setOpen(false)
    setResults([])
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Input
          value={value ? value.name : query}
          onChange={e => {
            if (value) { onSelect(null as unknown as Supplier); }
            handleInput(e.target.value)
          }}
          onFocus={() => { if (query && results.length) setOpen(true) }}
          placeholder="Search supplier…"
          className={cn(error && 'border-red-400')}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          {results.map(s => (
            <button key={s.id} type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors flex items-center gap-2"
              onClick={() => pick(s)}>
              <div className="size-7 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-violet-700 dark:text-violet-400">
                  {s.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="size-3" />{error}</p>}
    </div>
  )
}

// ─── Product search in row ────────────────────────────────────────────────────

function ProductSearch({
  value, rowId, usedProductIds, onSelect, onSearch, onQuickAdd,
}: {
  value: Product | null
  rowId: string
  usedProductIds: string[]
  onSelect: (p: Product) => void
  onSearch: (q: string) => Promise<Product[]>
  onQuickAdd: (name: string) => void
}) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleInput(q: string) {
    setQuery(q)
    if (q.trim().length < 1) { setResults([]); setOpen(false); return }
    setLoading(true)
    const res = await onSearch(q)
    setResults(res)
    setOpen(true)
    setLoading(false)
  }

  function pick(p: Product) {
    onSelect(p)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  const filteredResults = results.filter(p => !usedProductIds.includes(p.id) || p.id === value?.id)
  const showQuickAdd = query.trim().length > 1

  return (
    <div className="relative" ref={ref}>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 bg-muted/30">
          <Package className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate flex-1">{value.name}</span>
          <button type="button"
            onClick={() => { onSelect(null as unknown as Product); setQuery('') }}
            className="text-muted-foreground hover:text-foreground shrink-0">
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => { if (query && (filteredResults.length || showQuickAdd)) setOpen(true) }}
            placeholder="Search product…"
            className="pr-8"
          />
          {loading
            ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
            : <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          }
        </div>
      )}

      {open && !value && (
        <div className="absolute z-50 top-full mt-1 w-72 rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {filteredResults.map(p => {
            const alreadyUsed = usedProductIds.includes(p.id)
            return (
              <button key={p.id} type="button"
                disabled={alreadyUsed}
                className={cn(
                  'w-full text-left px-3 py-2.5 transition-colors flex items-center gap-2',
                  alreadyUsed
                    ? 'opacity-50 cursor-not-allowed bg-muted/20'
                    : 'hover:bg-muted/60',
                )}
                onClick={() => !alreadyUsed && pick(p)}>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.unit_name} · ₹{p.purchase_price}
                    {alreadyUsed && ' · already added'}
                  </p>
                </div>
              </button>
            )
          })}
          {filteredResults.length === 0 && query.trim() && !loading && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          )}
          {showQuickAdd && (
            <button type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-t border-border/40 transition-colors"
              onClick={() => { setOpen(false); onQuickAdd(query.trim()) }}>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                + Add &quot;{query}&quot; as product
              </p>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Line item row ────────────────────────────────────────────────────────────

function LineItemRow({
  row, usedProductIds, index, onUpdate, onRemove, onSearch, onQuickAdd,
}: {
  row: LineItemDraft
  usedProductIds: string[]
  index: number
  onUpdate: (id: string, patch: Partial<LineItemDraft>) => void
  onRemove: (id: string) => void
  onSearch: (q: string) => Promise<Product[]>
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
    <div className="grid grid-cols-[1fr_90px_80px_90px_64px_100px_36px] gap-2 items-start py-3 border-b border-border/40 last:border-0">
      {/* Product */}
      <ProductSearch
        value={row.product}
        rowId={row.id}
        usedProductIds={usedProductIds}
        onSelect={selectProduct}
        onSearch={onSearch}
        onQuickAdd={(name) => onQuickAdd(name, row.id)}
      />

      {/* Mode toggle */}
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

      {/* Qty */}
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

      {/* Unit price */}
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

      {/* Tax % */}
      <div className="relative">
        <Input
          type="number" min="0" max="100" step="0.01"
          value={row.tax_rate}
          onChange={e => onUpdate(row.id, { tax_rate: e.target.value })}
          className="h-9 pr-5 text-sm tabular-nums"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">%</span>
      </div>

      {/* Line total */}
      <p className="text-sm tabular-nums font-medium text-foreground text-right pt-2">
        {lineTotal > 0 ? rupee(lineTotal) : '—'}
      </p>

      {/* Delete */}
      <button type="button"
        onClick={() => onRemove(row.id)}
        className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors mt-0">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  initialPurchaseNumber: string
  onClose: () => void
  onSubmit: (
    header: PurchaseHeaderValues,
    lineItems: LineItemDraft[],
    discount: string,
    discountMode: DiscountMode,
  ) => Promise<boolean>
  onSearchSuppliers: (q: string) => Promise<Supplier[]>
  onSearchProducts:  (q: string) => Promise<Product[]>
  onQuickAddProduct: (values: QuickProductFormValues) => Promise<Product | null>
}

export function NewPurchaseForm({
  open, initialPurchaseNumber,
  onClose, onSubmit,
  onSearchSuppliers, onSearchProducts, onQuickAddProduct,
}: Props) {

  // ── header state ─────────────────────────────────────────────────────────────
  const [header, setHeader] = useState<PurchaseHeaderValues>({
    purchase_number: '',
    purchase_date:   today(),
    supplier_id:     '',
    notes:           '',
  })
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [headerErrors, setHeaderErrors] = useState<Partial<Record<keyof PurchaseHeaderValues, string>>>({})

  // ── line items state ──────────────────────────────────────────────────────────
  const [rows, setRows] = useState<LineItemDraft[]>([emptyRow()])

  // ── discount state ────────────────────────────────────────────────────────────
  const [discount,     setDiscount]     = useState('')
  const [discountMode, setDiscountMode] = useState<DiscountMode>('flat')

  // ── quick-add state ───────────────────────────────────────────────────────────
  const [quickAddOpen,   setQuickAddOpen]   = useState(false)
  const [quickAddName,   setQuickAddName]   = useState('')
  const [quickAddRowId,  setQuickAddRowId]  = useState('')

  // ── save state ────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) {
      setHeader({
        purchase_number: initialPurchaseNumber,
        purchase_date:   today(),
        supplier_id:     '',
        notes:           '',
      })
      setSelectedSupplier(null)
      setHeaderErrors({})
      setRows([emptyRow()])
      setDiscount('')
      setDiscountMode('flat')
      setSaving(false)
    }
  }, [open, initialPurchaseNumber])

  // ── line item helpers ─────────────────────────────────────────────────────────
  const updateRow = useCallback((id: string, patch: Partial<LineItemDraft>) => {
    setRows(prev => prev.map(r => r.id !== id ? r : { ...r, ...patch }))
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.length === 1 ? [emptyRow()] : prev.filter(r => r.id !== id))
  }, [])

  const addRow = useCallback(() => {
    setRows(prev => [...prev, emptyRow()])
  }, [])

  // Used product IDs (for duplicate detection)
  const usedProductIds = rows.map(r => r.product?.id ?? '').filter(Boolean)

  // ── quick-add product ─────────────────────────────────────────────────────────
  function openQuickAdd(name: string, rowId: string) {
    setQuickAddName(name)
    setQuickAddRowId(rowId)
    setQuickAddOpen(true)
  }

  async function handleQuickAddSave(values: QuickProductFormValues): Promise<boolean> {
    const product = await onQuickAddProduct(values)
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

  // ── totals ────────────────────────────────────────────────────────────────────
  const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
  const subtotal  = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
  const taxAmount = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
  const discountVal = discountMode === 'flat'
    ? num(discount)
    : subtotal * num(discount) / 100
  const grandTotal = subtotal + taxAmount - discountVal

  // ── validation ────────────────────────────────────────────────────────────────
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
    // warn zero-price rows
    for (const r of validRows) {
      if (num(r.unit_price) === 0) {
        toast.warning(`${r.product?.name} has price ₹0 — is this correct?`)
      }
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await onSubmit(header, rows, discount, discountMode)
    if (ok) onClose()
    else setSaving(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full lg:w-[900px] lg:max-w-[900px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden"
        >
          <SheetHeader className="px-6 py-5 border-b border-border/60 shrink-0">
            <SheetTitle className="text-base font-bold">New Purchase</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 [scrollbar-width:thin]">

              {/* ── Section 1: Purchase Header ──────────────────────────── */}
              <div className="space-y-4">
                <SectionTitle>Purchase Header</SectionTitle>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel required>Purchase No.</FieldLabel>
                    <Input
                      value={header.purchase_number}
                      onChange={e => {
                        setHeader(h => ({ ...h, purchase_number: e.target.value }))
                        setHeaderErrors(e2 => ({ ...e2, purchase_number: undefined }))
                      }}
                      placeholder="PO-2024-001"
                      className={cn('font-mono', headerErrors.purchase_number && 'border-red-400')}
                    />
                    {headerErrors.purchase_number && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />{headerErrors.purchase_number}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel required>Date</FieldLabel>
                    <DatePicker
                      value={header.purchase_date}
                      onChange={val => setHeader(h => ({ ...h, purchase_date: val }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel required>Supplier</FieldLabel>
                  <SupplierSearch
                    value={selectedSupplier}
                    onSelect={(s) => {
                      setSelectedSupplier(s)
                      setHeader(h => ({ ...h, supplier_id: s?.id ?? '' }))
                      setHeaderErrors(e => ({ ...e, supplier_id: undefined }))
                    }}
                    onSearch={onSearchSuppliers}
                    error={headerErrors.supplier_id}
                  />
                </div>

                <div className="space-y-1.5">
                  <FieldLabel>Notes</FieldLabel>
                  <textarea
                    value={header.notes}
                    onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                    rows={2}
                    placeholder="e.g. Festival restock, urgent order…"
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>
              </div>

              <Separator />

              {/* ── Section 2: Line Items ───────────────────────────────── */}
              <div className="space-y-3">
                <SectionTitle>Line Items</SectionTitle>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_90px_80px_90px_64px_100px_36px] gap-2 pb-1">
                  {['Product', 'Mode', 'Qty', 'Unit Price', 'Tax%', 'Total', ''].map((h, i) => (
                    <p key={i} className={`text-xs font-semibold text-muted-foreground ${i >= 4 ? 'text-right' : ''}`}>{h}</p>
                  ))}
                </div>

                <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40 px-3">
                  {rows.map((row, index) => (
                    <LineItemRow
                      key={row.id}
                      row={row}
                      index={index}
                      usedProductIds={usedProductIds.filter(id => id !== row.product?.id)}
                      onUpdate={updateRow}
                      onRemove={removeRow}
                      onSearch={onSearchProducts}
                      onQuickAdd={openQuickAdd}
                    />
                  ))}
                </div>

                <Button type="button" variant="outline" size="sm" onClick={addRow}
                  className="text-xs h-8">
                  <Plus className="size-3 mr-1.5" /> Add Product Row
                </Button>
              </div>

              <Separator />

              {/* ── Section 3: Totals ───────────────────────────────────── */}
              <div className="space-y-3">
                <SectionTitle>Totals</SectionTitle>

                <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">

                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-sm tabular-nums font-medium">{rupee(subtotal)}</p>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-muted-foreground">Tax (GST)</p>
                    <p className="text-sm tabular-nums font-medium">{rupee(taxAmount)}</p>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm text-muted-foreground">Discount</p>
                      {/* mode toggle */}
                      <div className="flex rounded overflow-hidden border border-border/60 text-xs h-6">
                        <button type="button"
                          onClick={() => setDiscountMode('flat')}
                          className={cn('px-2 transition-colors',
                            discountMode === 'flat' ? 'bg-foreground text-background' : 'bg-background text-muted-foreground'
                          )}>₹</button>
                        <button type="button"
                          onClick={() => setDiscountMode('percent')}
                          className={cn('px-2 transition-colors border-l border-border/60',
                            discountMode === 'percent' ? 'bg-foreground text-background' : 'bg-background text-muted-foreground'
                          )}>%</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
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

                  <div className="flex items-center justify-between px-4 py-4 bg-muted/30">
                    <p className="text-sm font-bold text-foreground">Grand Total</p>
                    <p className="text-lg tabular-nums font-bold text-foreground">{rupee(grandTotal)}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}
                className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 px-6">
                {saving
                  ? <><Loader2 className="size-4 animate-spin mr-2" />Saving…</>
                  : 'Save Purchase'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Quick-add product mini modal */}
      <ProductQuickAdd
        open={quickAddOpen}
        initialName={quickAddName}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleQuickAddSave}
      />
    </>
  )
}
