'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Trash2, AlertCircle, ChevronDown, X,
  Package, Loader2, CalendarDays, FileText, User,
  AlertTriangle, Info, CreditCard, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ProductQuickAdd } from '../../purchases/_components/ProductQuickAdd'
import { InvoiceModal } from '../_components/InvoiceModal'
import { useNewSale } from './useNewSale'
import { useBreadcrumb } from '@/components/app-shell'
import type {
  SaleDraftLineItem, SaleHeaderValues, DiscountMode,
  Customer, SaleProduct, QuickProductFormValues, PaymentMethod, SaleWithItems, SaleItem, PaymentRecord,
} from '../_components/types'
import {
  PAYMENT_METHOD_LABELS, STATUS_CONFIG,
} from '../_components/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const num = (v: string | number) => Number(v) || 0
const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)
const today = () => new Date().toISOString().slice(0, 10)
function localId() { return Math.random().toString(36).slice(2) }

function normalized(value: string | null | undefined) {
  return (value ?? '').toLocaleLowerCase('en-IN')
}

function computeLineTotal(row: SaleDraftLineItem): number {
  return parseFloat((num(row.qty_input) * num(row.unit_price)).toFixed(2))
}

function computeBaseUnits(row: SaleDraftLineItem): number {
  const qty = num(row.qty_input)
  if (row.sell_mode === 'box' && row.product?.units_per_box) return qty * row.product.units_per_box
  return qty
}

function emptyRow(): SaleDraftLineItem {
  return {
    id: localId(), product: null, sell_mode: 'unit',
    qty_input: '', unit_price: '', tax_rate: '18',
    base_units: 0, line_total: 0,
  }
}

const REFERENCE_METHODS: PaymentMethod[] = ['upi', 'card', 'bank_transfer']

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}{required && <span className="text-red-500 ml-0.5 normal-case">*</span>}
    </Label>
  )
}

// ─── CustomerSearch ───────────────────────────────────────────────────────────

function CustomerSearch({
  value, options, loading, onSelect,
}: {
  value: Customer | null
  options: Customer[]
  loading: boolean
  onSelect: (c: Customer | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)

  const results = useMemo(() => {
    const q = normalized(query.trim())
    const filtered = q
      ? options.filter(c =>
          normalized(c.name).includes(q) ||
          normalized(c.phone).includes(q)
        )
      : options
    return filtered.slice(0, 12)
  }, [options, query])

  function handleInput(next: string) {
    if (value) onSelect(null)
    setQuery(next)
    setOpen(true)
  }

  function pick(c: Customer) {
    onSelect(c)
    setQuery('')
    setOpen(false)
  }

  return (
    <Popover open={open && !value} onOpenChange={setOpen}>
      <PopoverTrigger render={<div className="relative" />} nativeButton={false}>
        <Input
          value={value ? value.name : query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search customer by name or phone…"
          className="pr-9"
        />
        {value ? (
          <button
            type="button"
            onClick={() => { onSelect(null); setQuery(''); setOpen(false) }}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear customer"
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
            <Loader2 className="size-3.5 animate-spin" />Loading customers…
          </div>
        ) : results.length > 0 ? (
          results.map(c => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              onClick={() => pick(c)}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
              </div>
            </button>
          ))
        ) : (
          <div className="px-3 py-3 text-sm text-muted-foreground">
            {query.trim() ? 'No customers found' : 'No customers available'}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ─── CustomerInfoPanel ────────────────────────────────────────────────────────

function CustomerInfoPanel({
  customer, outstanding,
}: { customer: Customer; outstanding: number }) {
  const creditLimit   = customer.credit_limit
  const openingBal    = customer.opening_balance
  const totalOwed     = outstanding + Math.max(0, openingBal)
  const hasAdvance    = openingBal < 0

  // No limit means 0
  const noLimit = creditLimit <= 0
  const usageRatio   = noLimit ? 0 : totalOwed / creditLimit
  const nearLimit    = !noLimit && usageRatio >= 0.8 && usageRatio < 1
  const atLimit      = !noLimit && usageRatio >= 1

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-background border text-xs font-bold text-foreground">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{customer.name}</p>
            {customer.phone && (
              <p className="text-xs text-muted-foreground">📞 {customer.phone}</p>
            )}
          </div>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p className="text-muted-foreground">Outstanding</p>
          <p className={cn('font-bold tabular-nums', outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
            {rupee(outstanding)}
          </p>
        </div>
      </div>

      {/* Credit limit info */}
      {!noLimit && (
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>Credit Limit: {rupee(creditLimit)}</span>
          <span>Available: {rupee(Math.max(0, creditLimit - totalOwed))}</span>
        </div>
      )}

      {/* Advance credit */}
      {hasAdvance && (
        <div className="flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
          <Info className="size-3.5 shrink-0" />
          <span>{customer.name} has {rupee(Math.abs(openingBal))} advance credit</span>
        </div>
      )}

      {/* Near limit warning */}
      {nearLimit && !atLimit && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>
            {customer.name} is nearing their credit limit ({rupee(totalOwed)} of {rupee(creditLimit)} used)
          </span>
        </div>
      )}

      {/* At limit */}
      {atLimit && (
        <div className="flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>Credit limit reached. {rupee(totalOwed)} outstanding.</span>
        </div>
      )}
    </div>
  )
}

// ─── ProductSearch ────────────────────────────────────────────────────────────

function ProductSearch({
  value, options, loading, usedProductIds, onSelect, onQuickAdd,
}: {
  value: SaleProduct | null
  options: SaleProduct[]
  loading: boolean
  usedProductIds: string[]
  onSelect: (p: SaleProduct | null) => void
  onQuickAdd: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)

  const results = useMemo(() => {
    const q = normalized(query.trim())
    const filtered = q
      ? options.filter(p =>
          normalized(p.name).includes(q) ||
          normalized(p.sku).includes(q)
        )
      : options
    return filtered.slice(0, 18)
  }, [options, query])

  const hasExactName = useMemo(() => {
    const q = normalized(query.trim())
    return q.length > 0 && options.some(p => normalized(p.name) === q)
  }, [options, query])

  function pick(p: SaleProduct) {
    onSelect(p)
    setQuery('')
    setOpen(false)
  }

  const showQuickAdd = query.trim().length > 1 && !hasExactName

  return (
    <div className="relative">
      {value ? (
        <div className="flex h-10 items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3">
          <Package className="size-3.5 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-4 text-foreground">{value.name}</p>
            <p className="truncate text-[11px] leading-4 text-muted-foreground">
              {value.unit_name} · {rupee(value.selling_price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onSelect(null); setQuery('') }}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={<div className="relative" />} nativeButton={false}>
            <Input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Search product…"
              className="pr-8"
            />
            {loading
              ? <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
              : <ChevronDown className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            }
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="max-h-80 w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />Loading products…
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
                        {p.sku ? `${p.sku} · ` : ''}{p.unit_name} · {rupee(p.selling_price)}
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

// ─── StockIndicator ───────────────────────────────────────────────────────────

function StockIndicator({ product, requestedUnits }: {
  product: SaleProduct; requestedUnits: number
}) {
  if (!product.track_inventory || requestedUnits <= 0) return null
  const stock = product.current_stock

  if (stock <= 0) {
    return (
      <p className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1 mt-0.5">
        <AlertCircle className="size-3" />Out of stock
      </p>
    )
  }
  if (requestedUnits > stock) {
    return (
      <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
        <AlertTriangle className="size-3" />Only {stock} in stock
      </p>
    )
  }
  return null
}

// ─── LineItemRow ──────────────────────────────────────────────────────────────

function LineItemRow({
  row, products, optionsLoading, usedProductIds, onUpdate, onRemove, onQuickAdd,
}: {
  row: SaleDraftLineItem
  products: SaleProduct[]
  optionsLoading: boolean
  usedProductIds: string[]
  onUpdate: (id: string, patch: Partial<SaleDraftLineItem>) => void
  onRemove: (id: string) => void
  onQuickAdd: (name: string, rowId: string) => void
}) {
  const lineTotal  = computeLineTotal(row)
  const baseUnits  = computeBaseUnits(row)

  function selectProduct(p: SaleProduct | null) {
    if (!p) {
      onUpdate(row.id, { product: null, unit_price: '', sell_mode: 'unit', qty_input: '' })
      return
    }
    onUpdate(row.id, {
      product:    p,
      sell_mode:  'unit',
      unit_price: String(p.selling_price),
      tax_rate:   String(p.gst_rate || 18),
      qty_input:  '',
    })
  }

  function toggleMode(mode: 'unit' | 'box') {
    if (!row.product) return
    const price = mode === 'box'
      ? String(row.product.box_selling_price ?? row.product.selling_price)
      : String(row.product.selling_price)
    onUpdate(row.id, { sell_mode: mode, unit_price: price, qty_input: '' })
  }

  const canBox = row.product?.has_box && row.product?.units_per_box

  return (
    <tr className="group border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
      {/* Product */}
      <td className="py-3 pl-4 pr-3 align-middle min-w-[220px]">
        <div>
          <ProductSearch
            value={row.product}
            options={products}
            loading={optionsLoading}
            usedProductIds={usedProductIds.filter(id => id !== row.product?.id)}
            onSelect={selectProduct}
            onQuickAdd={name => onQuickAdd(name, row.id)}
          />
          {row.product && (
            <StockIndicator product={row.product} requestedUnits={baseUnits} />
          )}
        </div>
      </td>

      {/* Mode toggle */}
      <td className="px-3 py-3 align-middle w-[100px]">
        <div className="flex rounded-lg overflow-hidden border border-border/60 h-9">
          <button type="button"
            onClick={() => toggleMode('unit')}
            className={cn(
              'flex-1 text-xs font-medium transition-colors',
              row.sell_mode === 'unit'
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
              row.sell_mode === 'box' && canBox
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
            type="number" min="0" step={row.sell_mode === 'box' ? '1' : '0.001'}
            value={row.qty_input}
            onChange={e => onUpdate(row.id, { qty_input: e.target.value })}
            placeholder="0"
            className="h-9 text-sm tabular-nums"
          />
          {row.sell_mode === 'box' && row.product?.units_per_box && num(row.qty_input) > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
              = {baseUnits} {row.product.unit_name}
            </p>
          )}
        </div>
      </td>

      {/* Sell Price */}
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

export default function NewSalePage() {
  const router = useRouter()
  const { generateBillNumber, saveSale, customers, products, optionsLoading, quickAddProduct, getOrCreateWalkinCustomer } = useNewSale()
  const { setCustomTitle } = useBreadcrumb()

  // ── header state ────────────────────────────────────────────────────────────
  const [header, setHeader] = useState<SaleHeaderValues>({
    invoice_number: '',
    sale_date: today(),
    customer_id: '',
    walkin_name: '',
    notes: '',
  })
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOutstanding, setCustomerOutstanding] = useState(0)
  const [loadingOutstanding, setLoadingOutstanding] = useState(false)
  const [headerErrors, setHeaderErrors] = useState<Partial<Record<string, string>>>({})

  // ── line items state ─────────────────────────────────────────────────────────
  const [rows, setRows] = useState<SaleDraftLineItem[]>([emptyRow()])

  // ── discount state ───────────────────────────────────────────────────────────
  const [discount,     setDiscount]     = useState('')
  const [discountMode, setDiscountMode] = useState<DiscountMode>('flat')

  // ── payment state ────────────────────────────────────────────────────────────
  const [paymentMethod,  setPaymentMethod]  = useState<PaymentMethod>('cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [amountPaid,     setAmountPaid]     = useState('')
  const [dueDate,        setDueDate]        = useState('')

  // ── quick-add state ──────────────────────────────────────────────────────────
  const [quickAddOpen,  setQuickAddOpen]  = useState(false)
  const [quickAddName,  setQuickAddName]  = useState('')
  const [quickAddRowId, setQuickAddRowId] = useState('')

  // ── save state ───────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  // ── invoice preview state ─────────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSale, setPreviewSale] = useState<SaleWithItems | null>(null)

  // Set dynamic breadcrumb
  useEffect(() => {
    setCustomTitle(header.invoice_number || 'New Sale')
  }, [header.invoice_number, setCustomTitle])

  // Generate bill number on mount
  useEffect(() => {
    generateBillNumber().then(bn => setHeader(h => ({ ...h, invoice_number: bn })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load customer outstanding when customer selected
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!selectedCustomer) { setCustomerOutstanding(0); return }
    setLoadingOutstanding(true)
    supabase
      .from('sales')
      .select('balance_due')
      .eq('customer_id', selectedCustomer.id)
      .neq('payment_status', 'paid')
      .then(({ data }) => {
        const total = (data ?? []).reduce((s: number, r: { balance_due: number }) => s + r.balance_due, 0)
        setCustomerOutstanding(total)
        setLoadingOutstanding(false)
      })
  }, [selectedCustomer, supabase])

  // ── totals ───────────────────────────────────────────────────────────────────
  const validRows   = rows.filter(r => r.product && num(r.qty_input) > 0)
  const subtotal    = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
  const taxAmount   = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
  const discountVal = discountMode === 'flat' ? num(discount) : subtotal * num(discount) / 100
  const grandTotal  = subtotal + taxAmount - discountVal

  // Sync amountPaid on first render / grandTotal change if not yet set
  useEffect(() => {
    if (!amountPaid && grandTotal > 0) {
      setAmountPaid(grandTotal.toFixed(2))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal])

  const paidAmt    = num(amountPaid)
  const balanceDue = Math.max(0, grandTotal - paidAmt)

  const paymentStatus =
    paidAmt <= 0       ? 'pending'
    : balanceDue <= 0.001 ? 'paid'
    : 'partial'

  // Auto-set amount paid to 0 when method = credit
  useEffect(() => {
    if (paymentMethod === 'credit') setAmountPaid('0')
  }, [paymentMethod])

  const showReference = REFERENCE_METHODS.includes(paymentMethod)
  const showDueDate   = paymentMethod === 'credit'

  // ── row helpers ──────────────────────────────────────────────────────────────
  const updateRow = useCallback((id: string, patch: Partial<SaleDraftLineItem>) => {
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
      sell_mode:  'unit',
      unit_price: String(product.selling_price),
      tax_rate:   String(product.gst_rate || 18),
      qty_input:  '',
    })
    setQuickAddOpen(false)
    return true
  }

  // ── validation ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: typeof headerErrors = {}
    if (!header.invoice_number.trim()) errs.invoice_number = 'Required'
    if (paidAmt > grandTotal + 0.001)   errs.amount_paid  = 'Cannot exceed grand total'
    if (paidAmt < 0)                    errs.amount_paid  = 'Cannot be negative'

    setHeaderErrors(errs)
    if (Object.keys(errs).length > 0) return false

    if (validRows.length === 0) {
      toast.error('Add at least one product with a valid quantity')
      return false
    }

    for (const r of validRows) {
      if (num(r.unit_price) === 0) {
        toast.warning(`${r.product?.name} has price ₹0 — is this correct?`)
      }
    }
    return true
  }

  // ── build preview object (without saving) ────────────────────────────────────
  function buildPreviewSale(): SaleWithItems {
    const displayName = selectedCustomer?.name ?? (header.walkin_name.trim() || 'Walk-in Customer')
    const items: SaleItem[] = validRows.map(r => ({
      id:           r.id,
      sale_id:      '',
      product_id:   r.product!.id,
      product_name: r.product!.name,
      unit_name:    r.product!.unit_name,
      box_name:     r.product!.box_name,
      units_per_box:r.product!.units_per_box,
      sell_mode:    r.sell_mode,
      box_count:    r.sell_mode === 'box' ? num(r.qty_input) : null,
      quantity:     computeBaseUnits(r),
      unit_price:   num(r.unit_price),
      tax_rate:     num(r.tax_rate),
      line_total:   computeLineTotal(r),
    }))

    const fakePayment: PaymentRecord | undefined = paidAmt > 0 ? {
      id:               'preview',
      sale_id:          null,
      customer_id:      '',
      amount:           paidAmt,
      payment_method:   paymentMethod,
      reference_number: referenceNumber || null,
      payment_date:     today(),
      note:             null,
      created_at:       new Date().toISOString(),
    } : undefined

    return {
      id:             '',
      customer_id:    '',
      customer_name:  displayName,
      walkin_name:    !header.customer_id ? header.walkin_name.trim() || null : null,
      invoice_number: header.invoice_number,
      sale_date:      header.sale_date || today(),
      subtotal,
      tax_amount:     taxAmount,
      discount:       discountVal,
      grand_total:    grandTotal,
      amount_paid:    paidAmt,
      balance_due:    balanceDue,
      payment_status: paymentStatus as 'paid' | 'partial' | 'pending',
      due_date:       dueDate || null,
      notes:          header.notes || null,
      created_at:     new Date().toISOString(),
      items,
      payments:       fakePayment ? [fakePayment] : [],
    }
  }

  // ── preview invoice (without saving) ─────────────────────────────────────────
  function handlePreview() {
    if (validRows.length === 0) {
      toast.error('Add at least one product to preview the invoice')
      return
    }
    setPreviewSale(buildPreviewSale())
    setPreviewOpen(true)
  }

  // ── submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    // Resolve customer ID
    let customerId = header.customer_id
    const isWalkin = !customerId
    if (isWalkin) {
      const walkinId = await getOrCreateWalkinCustomer()
      if (!walkinId) {
        toast.error('Failed to resolve walk-in customer. Please try again.')
        setSaving(false)
        return
      }
      customerId = walkinId
    }

    const lineItemsPayload = validRows.map(r => ({
      product:    r.product!,
      sell_mode:  r.sell_mode,
      qty_input:  num(r.qty_input),
      unit_price: num(r.unit_price),
      tax_rate:   num(r.tax_rate),
      line_total: computeLineTotal(r),
      base_units: computeBaseUnits(r),
      box_count:  r.sell_mode === 'box' ? num(r.qty_input) : null,
    }))

    const saleId = await saveSale({
      invoiceNumber:   header.invoice_number,
      saleDate:        header.sale_date,
      customerId,
      walkinName:      header.walkin_name,
      isWalkin,
      lineItems:       lineItemsPayload,
      subtotal,
      taxAmount,
      discountVal,
      grandTotal,
      amountPaid:      paidAmt,
      balanceDue,
      paymentStatus,
      paymentMethod,
      referenceNumber,
      dueDate,
      notes:           header.notes,
    })

    if (saleId) {
      // Build preview for auto-open after save
      const preview = buildPreviewSale()
      setPreviewSale({ ...preview, id: saleId })
      setPreviewOpen(true)
      // Navigate back after modal closes — handled in onClose
    } else {
      setSaving(false)
      // Refresh bill number in case of duplicate
      const nextBn = await generateBillNumber()
      setHeader(h => ({ ...h, invoice_number: nextBn }))
    }
  }

  const statusCfg = STATUS_CONFIG[paymentStatus as 'paid' | 'partial' | 'pending']

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">

      {/* ── Scrollable body ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] p-4 space-y-4">

        {/* ── Section 1: Sale Header ─────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
            <User className="size-3.5 text-muted-foreground/60" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sale Details</p>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Row 1: Bill Number + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>Bill Number</FieldLabel>
                <Input
                  value={header.invoice_number}
                  onChange={e => {
                    setHeader(h => ({ ...h, invoice_number: e.target.value }))
                    setHeaderErrors(e2 => ({ ...e2, invoice_number: undefined }))
                  }}
                  placeholder="BILL-2024-001"
                  className={cn('font-mono', headerErrors.invoice_number && 'border-red-400')}
                />
                {headerErrors.invoice_number && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />{headerErrors.invoice_number}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3" />Date
                  </span>
                </FieldLabel>
                <Input
                  type="date"
                  value={header.sale_date}
                  onChange={e => setHeader(h => ({ ...h, sale_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 2: Customer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel>Customer</FieldLabel>
                <span className="text-xs text-muted-foreground">Leave blank for Walk-in</span>
              </div>
              <CustomerSearch
                value={selectedCustomer}
                options={customers}
                loading={optionsLoading}
                onSelect={c => {
                  setSelectedCustomer(c)
                  setHeader(h => ({ ...h, customer_id: c?.id ?? '' }))
                }}
              />
              {!selectedCustomer && (
                <div className="space-y-1.5 pt-1">
                  <FieldLabel>Customer Name <span className="text-muted-foreground font-normal normal-case">(optional — for invoice)</span></FieldLabel>
                  <Input
                    value={header.walkin_name}
                    onChange={e => setHeader(h => ({ ...h, walkin_name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma (or leave blank)"
                  />
                </div>
              )}
              {selectedCustomer && (
                <CustomerInfoPanel
                  customer={selectedCustomer}
                  outstanding={loadingOutstanding ? 0 : customerOutstanding}
                />
              )}
            </div>

            {/* Row 3: Notes */}
            <div className="space-y-1.5">
              <FieldLabel>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-3" />Notes
                </span>
              </FieldLabel>
              <textarea
                value={header.notes}
                onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                rows={2}
                placeholder="e.g. Delivered to shop, urgent order…"
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

        {/* ── Section 2: Line Items ──────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Package className="size-3.5 text-muted-foreground/60" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</p>
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

          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] caption-bottom border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="border-b border-border/60 hover:bg-transparent">
                  {['Product', 'Mode', 'Qty', 'Sell Price', 'Tax %', 'Total', ''].map((col, i) => (
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

        {/* ── Section 3: Totals ─────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-sm tabular-nums font-medium">{rupee(subtotal)}</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-muted-foreground">Tax (GST)</p>
              <p className="text-sm tabular-nums font-medium">{rupee(taxAmount)}</p>
            </div>
            {/* Discount */}
            <div className="flex items-center justify-between px-5 py-3 gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Discount</p>
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

        {/* ── Section 4: Payment ────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
            <CreditCard className="size-3.5 text-muted-foreground/60" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
          </div>
          <div className="px-4 py-4 space-y-4">

            {/* Method + Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel required>Payment Method</FieldLabel>
                <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showReference && (
                <div className="space-y-1.5">
                  <FieldLabel>Reference No.</FieldLabel>
                  <Input
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    placeholder={paymentMethod === 'upi' ? 'UPI transaction ID' : 'Reference number'}
                  />
                </div>
              )}

              {showDueDate && (
                <div className="space-y-1.5">
                  <FieldLabel>Due Date <span className="text-muted-foreground font-normal normal-case">(optional)</span></FieldLabel>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Amount paid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel required>Amount Paid</FieldLabel>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline font-medium"
                  onClick={() => setAmountPaid(grandTotal.toFixed(2))}
                >
                  Pay Full ({rupee(grandTotal)})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                <Input
                  type="number" min="0" step="0.01"
                  value={amountPaid}
                  onChange={e => {
                    setAmountPaid(e.target.value)
                    setHeaderErrors(e2 => ({ ...e2, amount_paid: undefined }))
                  }}
                  placeholder="0.00"
                  className={cn('pl-7 tabular-nums', headerErrors.amount_paid && 'border-red-400')}
                  disabled={paymentMethod === 'credit'}
                />
              </div>
              {headerErrors.amount_paid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />{headerErrors.amount_paid}
                </p>
              )}
            </div>

            {/* Balance due + Status */}
            <div className="rounded-xl bg-muted/40 border border-border/40 divide-y divide-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Balance Due</span>
                <span className={cn(
                  'text-sm tabular-nums font-bold',
                  balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
                )}>
                  {rupee(balanceDue)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t bg-card px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grand Total:</span>
          <span className="text-lg font-bold text-foreground tabular-nums">{rupee(grandTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="default"
            onClick={() => router.back()} disabled={saving}
            className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button type="button" variant="outline" size="default"
            onClick={handlePreview} disabled={saving}
            className="h-9 px-4 text-xs font-semibold gap-1.5">
            <Eye className="size-3.5" />Preview Invoice
          </Button>
          <Button type="submit" size="default" disabled={saving}
            className="h-9 px-5 text-xs font-semibold">
            {saving
              ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Saving…</>
              : 'Save & Generate'}
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

      {/* Invoice Preview (pre-save) */}
      <InvoiceModal
        open={previewOpen}
        sale={previewSale}
        onClose={() => {
          setPreviewOpen(false)
          // If sale was saved (has real id), navigate away
          if (previewSale?.id && previewSale.id !== '') {
            router.push('/features/sales')
          }
        }}
      />
    </form>
  )
}
