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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertCircle, AlertTriangle, Loader2, Plus, Trash2, Package, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNewSale } from '@/app/features/sales/new/useNewSale'
import type { SaleDraftLineItem, SaleProduct, PaymentMethod } from '@/app/features/sales/_components/types'
import { PAYMENT_METHOD_LABELS } from '@/app/features/sales/_components/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const num = (v: string | number) => Number(v) || 0
const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)
const today = () => new Date().toISOString().slice(0, 10)
function localId() { return Math.random().toString(36).slice(2) }

function computeLineTotal(row: SaleDraftLineItem): number {
  return parseFloat((num(row.qty_input) * num(row.unit_price)).toFixed(2))
}

function computeBaseUnits(row: SaleDraftLineItem): number {
  const qty = num(row.qty_input)
  if (row.sell_mode === 'box' && row.product?.units_per_box) return qty * row.product.units_per_box
  return qty
}

function emptyRow(): SaleDraftLineItem {
  return { id: localId(), product: null, sell_mode: 'unit', qty_input: '', unit_price: '', tax_rate: '18', base_units: 0, line_total: 0 }
}

function normalized(value: string | null | undefined) {
  return (value ?? '').toLocaleLowerCase('en-IN')
}

// ─── StockIndicator ───────────────────────────────────────────────────────────

function StockIndicator({ product, requestedUnits }: { product: SaleProduct; requestedUnits: number }) {
  if (!product.track_inventory || requestedUnits <= 0) return null
  const stock = product.current_stock

  if (stock <= 0) {
    return (
      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-destructive">
        <AlertCircle className="size-3 shrink-0" />Out of stock
      </span>
    )
  }
  if (requestedUnits > stock) {
    return (
      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-3 shrink-0" />Only {stock} in stock
      </span>
    )
  }
  return null
}

// ─── ProductSearch ────────────────────────────────────────────────────────────

function ProductSearch({
  value, options, usedProductIds, onSelect,
}: {
  value: SaleProduct | null
  options: SaleProduct[]
  loading: boolean
  usedProductIds: string[]
  onSelect: (p: SaleProduct | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

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

  if (value) {
    return (
      <div className="flex h-9 items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">{value.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {value.unit_name} · {rupee(value.selling_price)}
          </p>
        </div>
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
                <div className="min-w-0 flex-1 py-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.sku ? `${p.sku} · ` : ''}{p.unit_name} · {rupee(p.selling_price)}
                    {alreadyUsed && ' · already added'}
                  </p>
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
  row: SaleDraftLineItem
  products: SaleProduct[]
  optionsLoading: boolean
  usedProductIds: string[]
  onUpdate: (id: string, patch: Partial<SaleDraftLineItem>) => void
  onRemove: (id: string) => void
}) {
  const lineTotal = computeLineTotal(row)
  const baseUnits = computeBaseUnits(row)

  function selectProduct(p: SaleProduct | null) {
    if (!p) { onUpdate(row.id, { product: null, unit_price: '', sell_mode: 'unit', qty_input: '' }); return }
    onUpdate(row.id, {
      product: p,
      sell_mode: 'unit',
      unit_price: String(p.selling_price),
      tax_rate: String(p.gst_rate || 18),
      qty_input: '',
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
    <TableRow className="group">
      <TableCell className="min-w-[200px] align-middle py-2">
        <div>
          <ProductSearch
            value={row.product}
            options={products}
            loading={optionsLoading}
            usedProductIds={usedProductIds.filter(id => id !== row.product?.id)}
            onSelect={selectProduct}
          />
          {row.product && (
            <StockIndicator product={row.product} requestedUnits={baseUnits} />
          )}
        </div>
      </TableCell>

      <TableCell className="w-[120px] align-middle py-2">
        <ButtonGroup className="h-8 w-full">
          <Button
            type="button"
            variant={row.sell_mode === 'unit' ? 'default' : 'outline'}
            size="xs"
            onClick={() => toggleMode('unit')}
            className="h-full flex-1 px-2 text-[11px] font-medium"
          >
            {row.product?.unit_name ?? 'Unit'}
          </Button>
          <Button
            type="button"
            variant={row.sell_mode === 'box' ? 'default' : 'outline'}
            size="xs"
            onClick={() => canBox && toggleMode('box')}
            disabled={!canBox}
            className="h-full flex-1 px-2 text-[11px] font-medium"
          >
            {row.product?.box_name ?? 'Box'}
          </Button>
        </ButtonGroup>
      </TableCell>

      <TableCell className="w-[85px] align-middle py-2">
        <div>
          <Input
            type="number" min="0" step={row.sell_mode === 'box' ? '1' : '0.001'}
            value={row.qty_input}
            onChange={e => onUpdate(row.id, { qty_input: e.target.value })}
            placeholder="0"
            className="h-8 text-xs tabular-nums"
          />
          {row.sell_mode === 'box' && row.product?.units_per_box && num(row.qty_input) > 0 && (
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

export function SaleNavSlide({ onSuccess }: Props) {
  const {
    customers, products, optionsLoading,
    generateBillNumber, saveSale, getOrCreateWalkinCustomer,
  } = useNewSale()

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [saleDate,      setSaleDate]      = useState(today())
  const [customerId,    setCustomerId]    = useState('')
  const [notes,         setNotes]         = useState('')
  const [rows,           setRows]           = useState<SaleDraftLineItem[]>([emptyRow()])
  const [discount,       setDiscount]       = useState('')

  const [amountPaid,      setAmountPaid]      = useState('')
  const [paymentMethod,   setPaymentMethod]   = useState<PaymentMethod>('cash')
  const [referenceNumber, setReferenceNumber] = useState('')

  const [saving,    setSaving]    = useState(false)
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    generateBillNumber().then(n => setInvoiceNumber(n))
  }, [generateBillNumber])

  const totals = useMemo(() => {
    const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
    const subtotal = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
    const taxAmount = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
    const discountVal = num(discount)
    const grandTotal  = subtotal + taxAmount - discountVal
    const paid        = num(amountPaid) > grandTotal ? grandTotal : num(amountPaid)
    const balanceDue  = Math.max(0, grandTotal - paid)
    const paymentStatus: 'paid' | 'partial' | 'pending' =
      paid >= grandTotal ? 'paid' : paid > 0 ? 'partial' : 'pending'
    return { subtotal, taxAmount, discountVal, grandTotal, paid, balanceDue, paymentStatus }
  }, [rows, discount, amountPaid])

  const updateRow = useCallback((id: string, patch: Partial<SaleDraftLineItem>) => {
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
    const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
    if (validRows.length === 0) errs.items = 'Add at least one product with quantity'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)

    let resolvedCustomerId = customerId
    if (!resolvedCustomerId) {
      const wid = await getOrCreateWalkinCustomer()
      if (!wid) { setSaving(false); return }
      resolvedCustomerId = wid
    }

    const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
    const lineItems = validRows.map(r => {
      const product = r.product!
      const isBox = r.sell_mode === 'box'
      const baseUnits = isBox
        ? num(r.qty_input) * (product.units_per_box ?? 1)
        : num(r.qty_input)
      return {
        product,
        sell_mode: r.sell_mode as 'unit' | 'box',
        qty_input: num(r.qty_input),
        unit_price: num(r.unit_price),
        tax_rate: num(r.tax_rate),
        line_total: parseFloat((num(r.qty_input) * num(r.unit_price)).toFixed(2)),
        base_units: baseUnits,
        box_count: isBox ? num(r.qty_input) : null,
      }
    })

    const saleId = await saveSale({
      invoiceNumber,
      saleDate,
      customerId: resolvedCustomerId,
      walkinName: '',
      isWalkin: !customerId,
      lineItems,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountVal: totals.discountVal,
      grandTotal: totals.grandTotal,
      amountPaid: totals.paid,
      balanceDue: totals.balanceDue,
      paymentStatus: totals.paymentStatus,
      paymentMethod,
      referenceNumber,
      dueDate: '',
      notes,
    })

    setSaving(false)
    if (saleId) {
      setSubmitted(true)
      setRows([emptyRow()])
      setCustomerId('')
      setNotes('')
      setDiscount('')
      setAmountPaid('')
      setReferenceNumber('')
      setSaleDate(today())
      setErrors({})
      generateBillNumber().then(n => setInvoiceNumber(n))
      setTimeout(() => setSubmitted(false), 2500)
      onSuccess?.()
    }
  }

  const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'upi', 'card', 'bank_transfer', 'credit']

  return (
    <form onSubmit={handleSubmit} id="instant-sale-form" className="flex flex-col gap-6">
      {submitted && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          Sale invoice saved & stock decremented! Ready for next bill.
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Sale Details</h3>
          <p className="text-xs text-muted-foreground">Select a customer (optional for walk-in) and set the bill header.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="is-invoice" className="text-xs font-semibold text-foreground/80">Bill Number</label>
            <Input
              id="is-invoice"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="font-mono text-xs h-9"
              placeholder="BILL-2025-001"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="is-date" className="text-xs font-semibold text-foreground/80">Sale Date</label>
            <Input
              id="is-date"
              type="date"
              value={saleDate}
              onChange={e => setSaleDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground/80">Customer <span className="font-normal text-muted-foreground">(leave blank for walk-in)</span></label>
            <Select
              value={customerId}
              onValueChange={v => { setCustomerId(v === '__walkin__' || v == null ? '' : v); setErrors(e => ({ ...e, customer: '' })) }}
              disabled={optionsLoading}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder={optionsLoading ? 'Loading…' : 'Walk-in / select customer'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__walkin__" className="text-xs">Walk-in Customer</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                    {c.phone && <span className="text-muted-foreground ml-2 text-[10px]">{c.phone}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Line Items ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Items</h3>
            <p className="text-xs text-muted-foreground">Products being sold.</p>
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

      {/* ── Payment + Totals ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Payment */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Payment</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/80">Method</label>
            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m} value={m} className="text-xs">{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="is-amount-paid" className="text-xs font-semibold text-foreground/80">Amount Received (₹)</label>
            <Input
              id="is-amount-paid"
              type="number" min="0" step="0.01"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              placeholder="0.00 = full credit"
              className="font-mono text-xs h-9"
            />
            {totals.grandTotal > 0 && (
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left font-medium"
                onClick={() => setAmountPaid(String(totals.grandTotal.toFixed(2)))}
              >
                Collect full: {rupee(totals.grandTotal)}
              </button>
            )}
          </div>
          {paymentMethod !== 'cash' && paymentMethod !== 'credit' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="is-ref" className="text-xs font-semibold text-foreground/80">Reference / UTR No.</label>
              <Input
                id="is-ref"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="Optional ref number"
                className="font-mono text-xs h-9"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="is-notes" className="text-xs font-semibold text-foreground/80">Notes</label>
            <Textarea
              id="is-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Remarks..."
              className="resize-none text-xs"
            />
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground/80">Discount (₹)</label>
            <Input
              type="number" min="0" step="0.01"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="h-8 w-28 text-xs text-right font-mono"
              placeholder="0.00"
            />
          </div>
          <div className="rounded-lg border bg-muted/10 p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span><span className="font-mono">{rupee(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>GST</span><span className="font-mono">{rupee(totals.taxAmount)}</span>
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
            {totals.paid > 0 && (
              <>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Received</span>
                  <span className="font-mono">{rupee(totals.paid)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span>Balance Due</span>
                  <span className={cn('font-mono', totals.balanceDue > 0 ? 'text-destructive' : 'text-foreground')}>
                    {rupee(totals.balanceDue)}
                  </span>
                </div>
                <div className="mt-1 pt-1 border-t">
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground'
                  )}>
                    {totals.paymentStatus === 'paid' ? 'Fully Paid' :
                     totals.paymentStatus === 'partial' ? 'Partial Payment' : 'Pending'}
                  </span>
                </div>
              </>
            )}
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
            <><Loader2 className="size-4 animate-spin mr-2" />Saving Sale…</>
          ) : (
            `Save ${invoiceNumber || 'Invoice'}`
          )}
        </Button>
      </div>
    </form>
  )
}
