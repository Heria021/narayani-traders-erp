'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { createClient } from '@/lib/supabase/client'
import { DatePicker } from '@/components/ui/date-picker'
import { ProductQuickAdd } from '../_components/ProductQuickAdd'
import { useNewPurchase } from './useNewPurchase'
import { useBreadcrumb } from '@/components/app-shell'
import { EntityBalanceNote } from '@/components/EntityBalanceNote'
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
        onInputValueChange={(q, details) => {
          if (details.reason === 'input-change') {
            if (value) onSelect(null)
            setQuery(q)
          } else if (details.reason === 'input-clear' || details.reason === 'clear-press') {
            onSelect(null)
            setQuery('')
          }
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
      <div className="flex h-9 items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-1">
        <span className="truncate text-sm font-medium text-foreground">{value.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => { onSelect(null); setQuery('') }}
          className="shrink-0 text-muted-foreground size-6"
        >
          <X className="size-3" />
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
      <TableCell className="min-w-[220px] pl-4 align-middle">
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

      <TableCell className="w-10 pr-4 align-middle">
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
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <NewPurchaseForm />
    </Suspense>
  )
}

function NewPurchaseForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSupplierId = searchParams.get('supplier_id')
  const preProductId = searchParams.get('product_id')

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

  // Pre-populate supplier
  useEffect(() => {
    if (preSupplierId && suppliers.length > 0) {
      const found = suppliers.find(s => s.id === preSupplierId)
      if (found) {
        setSelectedSupplier(found)
        setHeader(h => ({ ...h, supplier_id: found.id }))
      }
    }
  }, [preSupplierId, suppliers])

  // Pre-populate product row
  useEffect(() => {
    if (preProductId && products.length > 0 && rows.length === 1 && !rows[0].product) {
      const found = products.find(p => p.id === preProductId)
      if (found) {
        setRows([
          {
            id: localId(),
            product: found,
            buy_mode: 'unit',
            qty_input: '',
            unit_price: String(found.purchase_price),
            tax_rate: String(found.gst_rate || 18),
            base_units: 0,
            line_total: 0,
          }
        ])
      }
    }
  }, [preProductId, products, rows])

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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden h-full">
      <div className="flex-1 min-h-0 p-4 md:p-6 flex flex-col overflow-hidden">
        <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch flex-1 min-h-0">
          
          {/* Left Column: Line Items (takes 2 cols on desktop) */}
          <div className="space-y-6 lg:col-span-2 order-2 lg:order-1 flex flex-col lg:h-full lg:min-h-0">
            <Card className="overflow-hidden shadow-sm flex flex-col lg:h-full lg:min-h-0">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-semibold text-foreground">Line Items</CardTitle>
                      {validRows.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold">
                          {validRows.length} {validRows.length === 1 ? 'item' : 'items'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Select products, quantities, and unit prices.</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 px-3 text-xs font-semibold">
                  <Plus className="size-3.5 mr-1" />Add Row
                </Button>
              </CardHeader>

              <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin]">
                <div className="overflow-x-auto [scrollbar-width:thin] w-full">
                  <Table className="min-w-[760px] w-full">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-xs">
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
          </div>

          {/* Right Column: Details & Summary (takes 1 col on desktop) */}
          <div className="space-y-6 lg:col-span-1 order-1 lg:order-2 flex flex-col lg:h-full lg:min-h-0 justify-between">
            {/* Purchase Details Card */}
            <Card className="shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">Purchase Details</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Supplier, date, and reference settings.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 min-h-0 overflow-y-auto pb-6">
                <FieldGroup className="gap-4 h-full flex flex-col">
                  <div className="grid grid-cols-2 gap-4 shrink-0">
                    <Field data-invalid={!!headerErrors.purchase_number}>
                      <FieldLabel htmlFor="purchase_number">Purchase Number</FieldLabel>
                      <Input
                        id="purchase_number"
                        value={header.purchase_number}
                        onChange={e => {
                          setHeader(h => ({ ...h, purchase_number: e.target.value }))
                          setHeaderErrors(e2 => ({ ...e2, purchase_number: undefined }))
                        }}
                        placeholder="PO-2025-001"
                        className="font-mono text-sm"
                        aria-invalid={!!headerErrors.purchase_number}
                      />
                      {headerErrors.purchase_number && (
                        <FieldError>{headerErrors.purchase_number}</FieldError>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="purchase_date">Date</FieldLabel>
                      <DatePicker
                        value={header.purchase_date}
                        onChange={val => setHeader(h => ({ ...h, purchase_date: val }))}
                      />
                    </Field>
                  </div>

                  <Field className="shrink-0">
                    <FieldLabel>Supplier</FieldLabel>
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
                    <EntityBalanceNote entityType="supplier" entityId={selectedSupplier?.id ?? null} />
                  </Field>

                  <Field className="flex-1 flex flex-col min-h-[140px]">
                    <FieldLabel htmlFor="notes">Notes</FieldLabel>
                    <div className="flex-1 flex flex-col min-h-0">
                      <Textarea
                        id="notes"
                        value={header.notes}
                        onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                        placeholder="Optional remarks, terms, or conditions..."
                        className="resize-none flex-1 min-h-0 text-sm h-full"
                      />
                    </div>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Totals & Summary Card */}
            <Card className="overflow-hidden shadow-sm shrink-0 border border-border">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold text-foreground">Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="divide-y p-0">
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-medium tabular-nums text-foreground">{rupee(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-muted-foreground font-medium">Tax (GST)</span>
                  <span className="font-medium tabular-nums text-foreground">{rupee(taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Discount</span>
                    <ButtonGroup className="h-6 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setDiscountMode('flat')}
                        className={cn(
                          "h-full px-2 text-[10px] font-semibold border-r-0 rounded-r-none",
                          discountMode === 'flat' ? 'bg-accent text-accent-foreground border-primary font-bold' : 'text-muted-foreground'
                        )}
                      >
                        ₹
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setDiscountMode('percent')}
                        className={cn(
                          "h-full px-2 text-[10px] font-semibold rounded-l-none",
                          discountMode === 'percent' ? 'bg-accent text-accent-foreground border-primary font-bold' : 'text-muted-foreground'
                        )}
                      >
                        %
                      </Button>
                    </ButtonGroup>
                  </div>
                  <div className="flex items-center gap-3">
                    <InputGroup className="w-24 shrink-0">
                      <InputGroupAddon>
                        <InputGroupText className="text-xs">{discountMode === 'flat' ? '₹' : '%'}</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number" min="0" step="0.01"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                        placeholder="0"
                        className="text-xs"
                      />
                    </InputGroup>
                    <span className="w-24 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {discountVal > 0 ? `−${rupee(discountVal)}` : rupee(0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-muted/20 px-5 py-4 border-t">
                  <span className="text-lg font-bold text-foreground">Grand Total</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {rupee(grandTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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