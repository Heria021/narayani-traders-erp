'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox'
import {
  Plus, Trash2, AlertCircle, X,
  Package, Loader2, CalendarDays, FileText, Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
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

// ─── SupplierSearch ───────────────────────────────────────────────────────────

function SupplierSearch({
  value, options, onSelect, error,
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

  return (
    <Field data-invalid={!!error}>
      <Combobox
        value={value?.id ?? ''}
        onValueChange={(val) => {
          if (!val) {
            onSelect(null)
            setQuery('')
          } else {
            const found = options.find(o => o.id === val) || null
            onSelect(found)
            setQuery('')
          }
        }}
        open={open}
        onOpenChange={setOpen}
        inputValue={value ? value.name : query}
        onInputValueChange={(q) => {
          if (value) onSelect(null)
          setQuery(q)
        }}
      >
        <ComboboxInput
          placeholder="Search supplier by name..."
          showClear={!!value}
          showTrigger={!value}
          className="w-full"
          aria-invalid={!!error}
        />
        <ComboboxContent align="start" sideOffset={6} className="w-full min-w-80">
          <ComboboxList>
            {results.map((s) => (
              <ComboboxItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2 py-1">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                    {(s.phone || s.email) && (
                      <p className="truncate text-xs text-muted-foreground">{s.phone || s.email}</p>
                    )}
                  </div>
                </div>
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

// ─── ProductSearch ────────────────────────────────────────────────────────────

function ProductSearch({
  value, options, usedProductIds, onSelect, onQuickAdd,
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

  const showQuickAdd = query.trim().length > 1 && !hasExactProductName

  if (value) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/30 px-3">
        <Package className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-4 text-foreground">{value.name}</p>
          <p className="truncate text-[11px] leading-4 text-muted-foreground">
            {value.unit_name} · {rupee(value.purchase_price)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => { onSelect(null); setQuery('') }}
          className="shrink-0 text-muted-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <Combobox
      value=""
      onValueChange={(val) => {
        if (!val) {
          onSelect(null)
          setQuery('')
        } else {
          const found = options.find(o => o.id === val) || null
          onSelect(found)
          setQuery('')
        }
      }}
      open={open}
      onOpenChange={setOpen}
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxInput placeholder="Search product..." showClear={false} showTrigger className="w-full" />
      <ComboboxContent align="start" sideOffset={6} className="w-full min-w-80">
        <ComboboxList>
          {results.map((p) => {
            const alreadyUsed = usedProductIds.includes(p.id)
            return (
              <ComboboxItem key={p.id} value={p.id} disabled={alreadyUsed} className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2 py-1">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.sku ? `${p.sku} · ` : ''}{p.unit_name} · {rupee(p.purchase_price)}
                      {alreadyUsed && ' · already added'}
                    </p>
                  </div>
                </div>
                {alreadyUsed && <Badge variant="secondary" className="text-[10px]">Added</Badge>}
              </ComboboxItem>
            )
          })}
        </ComboboxList>
        {showQuickAdd && (
          <div className="border-t p-1 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); onQuickAdd(query.trim()); setQuery('') }}
              className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-muted"
            >
              <Plus className="size-3.5" />
              Add &quot;{query.trim()}&quot; as product
            </Button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
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
      product: p,
      buy_mode: 'unit',
      unit_price: String(p.purchase_price),
      tax_rate: String(p.gst_rate || 18),
      qty_input: '',
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
    <TableRow className="group">
      <TableCell className="min-w-[220px] align-middle">
        <ProductSearch
          value={row.product}
          options={products}
          loading={optionsLoading}
          usedProductIds={usedProductIds.filter(id => id !== row.product?.id)}
          onSelect={selectProduct}
          onQuickAdd={(name) => onQuickAdd(name, row.id)}
        />
      </TableCell>

      <TableCell className="w-[140px] align-middle">
        <ButtonGroup className="h-9">
          <Button
            type="button"
            variant={row.buy_mode === 'unit' ? 'default' : 'outline'}
            size="xs"
            onClick={() => toggleMode('unit')}
            className="h-full flex-1 px-3 text-xs font-medium"
          >
            Unit
          </Button>
          <Button
            type="button"
            variant={row.buy_mode === 'box' ? 'default' : 'outline'}
            size="xs"
            onClick={() => canBox && toggleMode('box')}
            disabled={!canBox}
            className="h-full flex-1 px-3 text-xs font-medium"
          >
            Box
          </Button>
        </ButtonGroup>
      </TableCell>

      <TableCell className="w-[90px] align-middle">
        <div>
          <Input
            type="number" min="0" step={row.buy_mode === 'box' ? '1' : '0.001'}
            value={row.qty_input}
            onChange={e => onUpdate(row.id, { qty_input: e.target.value })}
            placeholder="0"
            className="h-9 text-sm tabular-nums"
          />
          {row.buy_mode === 'box' && row.product?.units_per_box && num(row.qty_input) > 0 && (
            <FieldDescription className="mt-0.5 text-right text-[10px]">
              = {baseUnits} {row.product.unit_name}
            </FieldDescription>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[130px] align-middle">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>₹</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="number" min="0" step="0.01"
            value={row.unit_price}
            onChange={e => onUpdate(row.id, { unit_price: e.target.value })}
            placeholder="0"
          />
        </InputGroup>
      </TableCell>

      <TableCell className="w-[110px] align-middle">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>%</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type="number" min="0" max="100" step="0.01"
            value={row.tax_rate}
            onChange={e => onUpdate(row.id, { tax_rate: e.target.value })}
          />
        </InputGroup>
      </TableCell>

      <TableCell className="w-[120px] text-right align-middle">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {lineTotal > 0 ? rupee(lineTotal) : <span className="text-muted-foreground/40">—</span>}
        </span>
      </TableCell>

      <TableCell className="w-10 align-middle">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(row.id)}
          className="size-8 text-muted-foreground opacity-0 transition-all duration-150 hover:text-red-500 hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-950/30"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
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

  const [header, setHeader] = useState<PurchaseHeaderValues>({
    purchase_number: '',
    purchase_date: today(),
    supplier_id: '',
    notes: '',
  })
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [headerErrors, setHeaderErrors] = useState<Partial<Record<keyof PurchaseHeaderValues, string>>>({})

  useEffect(() => {
    setCustomTitle(header.purchase_number || 'New Purchase')
  }, [header.purchase_number, setCustomTitle])

  const [rows, setRows] = useState<LineItemDraft[]>([emptyRow()])

  const [discount, setDiscount] = useState('')
  const [discountMode, setDiscountMode] = useState<DiscountMode>('flat')

  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')
  const [quickAddRowId, setQuickAddRowId] = useState('')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    generatePurchaseNumber().then(pn => {
      setHeader(h => ({ ...h, purchase_number: pn }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      buy_mode: 'unit',
      unit_price: String(product.purchase_price),
      tax_rate: String(product.gst_rate || 18),
      qty_input: '',
    })
    setQuickAddOpen(false)
    return true
  }

  const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
  const subtotal = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
  const taxAmount = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
  const discountVal = discountMode === 'flat' ? num(discount) : subtotal * num(discount) / 100
  const grandTotal = subtotal + taxAmount - discountVal

  function validate(): boolean {
    const errs: typeof headerErrors = {}
    if (!header.purchase_number.trim()) errs.purchase_number = 'Required'
    if (!header.supplier_id) errs.supplier_id = 'Select a supplier'
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
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] p-4 space-y-4">

        {/* ── Purchase Details ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="size-3.5 text-muted-foreground/60" />
              Purchase Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={!!headerErrors.purchase_number}>
                  <FieldLabel htmlFor="purchase_number">Purchase Number </FieldLabel>
                  <Input
                    id="purchase_number"
                    value={header.purchase_number}
                    onChange={e => {
                      setHeader(h => ({ ...h, purchase_number: e.target.value }))
                      setHeaderErrors(e2 => ({ ...e2, purchase_number: undefined }))
                    }}
                    placeholder="PO-2025-001"
                    className="font-mono"
                    aria-invalid={!!headerErrors.purchase_number}
                  />
                  {headerErrors.purchase_number && (
                    <FieldError>{headerErrors.purchase_number}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="purchase_date">
                    <CalendarDays className="size-3" />Date 
                  </FieldLabel>
                  <DatePicker
                    value={header.purchase_date}
                    onChange={val => setHeader(h => ({ ...h, purchase_date: val }))}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Supplier </FieldLabel>
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
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">
                  <FileText className="size-3" />Notes
                </FieldLabel>
                <Textarea
                  id="notes"
                  value={header.notes}
                  onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Festival restock, urgent order…"
                  className="resize-none"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* ── Line Items ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Package className="size-3.5 text-muted-foreground/60" />
              Line Items
              {validRows.length > 0 && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                  {validRows.length}
                </Badge>
              )}
            </CardTitle>
            <CardFooter className="p-0">
              <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-7 px-2.5 text-xs">
                <Plus className="size-3" />Add Row
              </Button>
            </CardFooter>
          </CardHeader>

          <CardContent className="px-0">
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px] pl-4">Product</TableHead>
                    <TableHead className="w-[140px]">Mode</TableHead>
                    <TableHead className="w-[90px]">Qty</TableHead>
                    <TableHead className="w-[130px]">Unit Price</TableHead>
                    <TableHead className="w-[110px] text-right">Tax %</TableHead>
                    <TableHead className="w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-10 pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── Totals ─────────────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="divide-y p-0">
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-sm font-medium tabular-nums">{rupee(subtotal)}</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-muted-foreground">Tax (GST)</p>
              <p className="text-sm font-medium tabular-nums">{rupee(taxAmount)}</p>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Discount</p>
                <ButtonGroup className="h-6">
                  <Button
                    type="button"
                    variant={discountMode === 'flat' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setDiscountMode('flat')}
                    className="h-full px-2.5 text-xs font-semibold"
                  >
                    ₹
                  </Button>
                  <Button
                    type="button"
                    variant={discountMode === 'percent' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setDiscountMode('percent')}
                    className="h-full px-2.5 text-xs font-semibold"
                  >
                    %
                  </Button>
                </ButtonGroup>
              </div>
              <div className="flex items-center gap-3">
                <InputGroup className="h-8 w-28">
                  <InputGroupAddon>
                    <InputGroupText>{discountMode === 'flat' ? '₹' : '%'}</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number" min="0" step="0.01"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="0"
                  />
                </InputGroup>
                <p className="w-28 text-right text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  {discountVal > 0 ? `−${rupee(discountVal)}` : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-muted/30 px-5 py-4">
              <p className="text-sm font-bold text-foreground">Grand Total</p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {rupee(grandTotal)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="h-4" />
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-t bg-card px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grand Total:</span>
          <span className="text-lg font-bold tabular-nums text-foreground">{rupee(grandTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="h-9 px-5 text-xs font-semibold">
            {saving ? <><Loader2 className="size-3.5 animate-spin" />Saving…</> : 'Save Purchase'}
          </Button>
        </div>
      </div>

      <ProductQuickAdd
        open={quickAddOpen}
        initialName={quickAddName}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleQuickAddSave}
      />
    </form>
  )
}