'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
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
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertCircle, AlertTriangle, Loader2, Plus, Trash2, Package, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNewPurchase } from '@/app/features/purchases/new/useNewPurchase'
import type { LineItemDraft, Product, Supplier } from '@/app/features/purchases/_components/types'

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

// ─── ProductSearch ────────────────────────────────────────────────────────────

function ProductSearch({
  value, options, usedProductIds, onSelect,
}: {
  value: Product | null
  options: Product[]
  loading: boolean
  usedProductIds: string[]
  onSelect: (p: Product | null) => void
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

  if (value) {
    return (
      <div className="flex h-9 items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-1">
        <span className="truncate text-sm font-medium text-foreground">{value.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => { onSelect(null); setQuery('') }}
          className="shrink-0 text-muted-foreground size-6 hover:bg-muted"
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
      <ComboboxInput placeholder="Search product..." showClear={false} showTrigger className="w-full text-xs h-8" />
      <ComboboxContent align="start" sideOffset={6} className="w-full min-w-80 max-h-60 overflow-y-auto">
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
      </ComboboxContent>
    </Combobox>
  )
}

// ─── LineItemRow ────────────────────────────────────────────────────────────

function LineItemRow({
  row, products, optionsLoading, usedProductIds, onUpdate, onRemove,
}: {
  row: LineItemDraft
  products: Product[]
  optionsLoading: boolean
  usedProductIds: string[]
  onUpdate: (id: string, patch: Partial<LineItemDraft>) => void
  onRemove: (id: string) => void
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
      <TableCell className="min-w-[200px] align-middle py-2">
        <ProductSearch
          value={row.product}
          options={products}
          loading={optionsLoading}
          usedProductIds={usedProductIds.filter(id => id !== row.product?.id)}
          onSelect={selectProduct}
        />
      </TableCell>

      <TableCell className="w-[120px] align-middle py-2">
        <ButtonGroup className="h-8 w-full">
          <Button
            type="button"
            variant={row.buy_mode === 'unit' ? 'default' : 'outline'}
            size="xs"
            onClick={() => toggleMode('unit')}
            className="h-full flex-1 px-2 text-[11px] font-medium"
          >
            Unit
          </Button>
          <Button
            type="button"
            variant={row.buy_mode === 'box' ? 'default' : 'outline'}
            size="xs"
            onClick={() => canBox && toggleMode('box')}
            disabled={!canBox}
            className="h-full flex-1 px-2 text-[11px] font-medium"
          >
            Box
          </Button>
        </ButtonGroup>
      </TableCell>

      <TableCell className="w-[85px] align-middle py-2">
        <div>
          <Input
            type="number" min="0" step={row.buy_mode === 'box' ? '1' : '0.001'}
            value={row.qty_input}
            onChange={e => onUpdate(row.id, { qty_input: e.target.value })}
            placeholder="0"
            className="h-8 text-xs tabular-nums"
          />
          {row.buy_mode === 'box' && row.product?.units_per_box && num(row.qty_input) > 0 && (
            <span className="block mt-0.5 text-right text-[9px] text-muted-foreground">
              = {baseUnits} {row.product.unit_name}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[120px] align-middle py-2">
        <InputGroup>
          <InputGroupAddon className="h-8 px-1.5"><InputGroupText className="text-[10px]">₹</InputGroupText></InputGroupAddon>
          <InputGroupInput
            type="number" min="0" step="0.01"
            value={row.unit_price}
            onChange={e => onUpdate(row.id, { unit_price: e.target.value })}
            placeholder="0"
            className="h-8 text-xs font-mono"
          />
        </InputGroup>
      </TableCell>

      <TableCell className="w-[100px] align-middle py-2">
        <InputGroup>
          <InputGroupAddon className="h-8 px-1.5"><InputGroupText className="text-[10px]">%</InputGroupText></InputGroupAddon>
          <InputGroupInput
            type="number" min="0" max="100" step="0.01"
            value={row.tax_rate}
            onChange={e => onUpdate(row.id, { tax_rate: e.target.value })}
            className="h-8 text-xs font-mono"
          />
        </InputGroup>
      </TableCell>

      <TableCell className="w-[100px] text-right align-middle py-2 font-mono text-xs font-semibold">
        {lineTotal > 0 ? rupee(lineTotal) : <span className="text-muted-foreground/30">—</span>}
      </TableCell>

      <TableCell className="w-9 align-middle py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(row.id)}
          className="size-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

// ─── Main Form Slide Component ───────────────────────────────────────────────

interface Props {
  onSuccess?: () => void
}

export function PurchaseFormSlide({ onSuccess }: Props) {
  const {
    suppliers, products, optionsLoading,
    generatePurchaseNumber, savePurchase,
  } = useNewPurchase()

  const [purchaseNumber, setPurchaseNumber] = useState('')
  const [purchaseDate,   setPurchaseDate]   = useState(today())
  const [supplierId,     setSupplierId]     = useState('')
  const [notes,          setNotes]          = useState('')
  const [rows,           setRows]           = useState<LineItemDraft[]>([emptyRow()])
  const [discount,       setDiscount]       = useState('')

  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    generatePurchaseNumber().then(n => setPurchaseNumber(n))
  }, [generatePurchaseNumber])

  const totals = useMemo(() => {
    const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
    const subtotal = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
    const taxAmount = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
    const discountVal = num(discount)
    const grandTotal = subtotal + taxAmount - discountVal
    return { subtotal, taxAmount, discountVal, grandTotal }
  }, [rows, discount])

  const updateRow = useCallback((id: string, patch: Partial<LineItemDraft>) => {
    setRows(prev => prev.map(r => r.id !== id ? r : { ...r, ...patch }))
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.length === 1 ? [emptyRow()] : prev.filter(r => r.id !== id))
  }, [])

  const addRow = useCallback(() => {
    setRows(prev => [...prev, emptyRow()])
  }, [])

  const usedProductIds = useMemo(() => rows.map(r => r.product?.id ?? '').filter(Boolean), [rows])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!supplierId) errs.supplier = 'Select a supplier'
    const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
    if (validRows.length === 0) errs.items = 'Add at least one product with quantity'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await savePurchase(
      { purchase_number: purchaseNumber, purchase_date: purchaseDate, supplier_id: supplierId, notes },
      rows,
      discount,
      'flat',
    )
    setSaving(false)
    if (ok) {
      setSubmitted(true)
      setRows([emptyRow()])
      setSupplierId('')
      setNotes('')
      setDiscount('')
      setPurchaseDate(today())
      setErrors({})
      generatePurchaseNumber().then(n => setPurchaseNumber(n))
      setTimeout(() => setSubmitted(false), 2500)
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} id="instant-purchase-form" className="flex flex-col gap-6">
      {submitted && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          Purchase saved & stock updated! Ready for next entry.
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Purchase Details</h3>
          <p className="text-xs text-muted-foreground">Select a supplier and fill in the purchase header.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ip-po-number" className="text-xs font-semibold text-foreground/80">PO Number</label>
            <Input
              id="ip-po-number"
              value={purchaseNumber}
              onChange={e => setPurchaseNumber(e.target.value)}
              className="font-mono text-xs h-9"
              placeholder="PO-2025-001"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ip-date" className="text-xs font-semibold text-foreground/80">Purchase Date</label>
            <Input
              id="ip-date"
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground/80">Supplier <span className="text-destructive">*</span></label>
            <Select
              value={supplierId}
              onValueChange={v => { setSupplierId(v ?? ''); setErrors(e => ({ ...e, supplier: '' })) }}
              disabled={optionsLoading}
            >
              <SelectTrigger className={cn('w-full h-9 text-xs', errors.supplier && 'border-destructive')}>
                <SelectValue placeholder={optionsLoading ? 'Loading suppliers…' : 'Select supplier'} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name}
                    {s.phone && <span className="text-muted-foreground ml-2 text-[10px]">{s.phone}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplier && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle className="size-3" />{errors.supplier}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Line Items ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Items</h3>
            <p className="text-xs text-muted-foreground">Add products being purchased.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 gap-1 px-3 text-xs font-semibold">
            <Plus className="size-3.5" />Add Row
          </Button>
        </div>

        {errors.items && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="size-3" />{errors.items}
          </p>
        )}

        <div className="border rounded-lg overflow-hidden bg-background">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs pl-4 font-semibold">Product</TableHead>
                <TableHead className="text-xs w-[120px] font-semibold">Mode</TableHead>
                <TableHead className="text-xs w-[85px] font-semibold">Qty</TableHead>
                <TableHead className="text-xs w-[120px] font-semibold">Unit Price</TableHead>
                <TableHead className="text-xs w-[100px] font-semibold">Tax %</TableHead>
                <TableHead className="text-xs w-[100px] text-right font-semibold">Total</TableHead>
                <TableHead className="w-9" />
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
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* ── Totals + Notes ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ip-notes" className="text-xs font-semibold text-foreground/80">Notes</label>
          <Textarea
            id="ip-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Invoice number, delivery details, etc."
            className="resize-none text-xs"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground/80">Discount (₹)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="h-8 w-28 text-xs text-right font-mono"
              placeholder="0.00"
            />
          </div>
          <div className="rounded-lg border bg-muted/10 p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{rupee(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>GST</span>
              <span className="font-mono">{rupee(totals.taxAmount)}</span>
            </div>
            {totals.discountVal > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Discount</span>
                <span className="font-mono text-destructive">−{rupee(totals.discountVal)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-sm font-bold">
              <span>Grand Total</span>
              <span className="font-mono">{rupee(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={saving || optionsLoading}
          className="w-full h-11 text-sm font-semibold"
        >
          {saving ? (
            <><Loader2 className="size-4 animate-spin mr-2" />Saving Purchase…</>
          ) : (
            `Save ${purchaseNumber || 'Purchase'}`
          )}
        </Button>
      </div>
    </form>
  )
}
