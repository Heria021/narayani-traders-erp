'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
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
import { DatePicker } from '@/components/ui/date-picker'
import { useCustomers } from '../../customers/_components/useCustomers'
import { CustomerForm } from '../../customers/_components/CustomerForm'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Trash2, AlertCircle, X,
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

// ─── CustomerSearch ───────────────────────────────────────────────────────────

function CustomerSearch({
  value, options, onSelect, onAddCustomerClick,
}: {
  value: Customer | null
  options: Customer[]
  loading: boolean
  onSelect: (c: Customer | null) => void
  onAddCustomerClick: () => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

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

  return (
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
        placeholder="Search customer by name or phone…"
        showClear={!!value}
        showTrigger={!value}
        className="w-full"
      />
      <ComboboxContent align="start" sideOffset={6} className="w-full min-w-80">
        <ComboboxList>
          {results.map((c) => (
            <ComboboxItem key={c.id} value={c.id}>
              <div className="flex items-center gap-2 py-1">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
                </div>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>

        <div className="border-t p-1 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false)
              onAddCustomerClick()
            }}
            className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-muted"
          >
            <Plus className="size-3.5" />
            Add New Customer
          </Button>
        </div>
      </ComboboxContent>
    </Combobox>
  )
}

// ─── CustomerInfoPanel ────────────────────────────────────────────────────────

function CustomerInfoPanel({
  customer, outstanding,
}: { customer: Customer; outstanding: number }) {
  const creditLimit = customer.credit_limit
  const openingBal = customer.opening_balance
  const totalOwed = outstanding + Math.max(0, openingBal)
  const hasAdvance = openingBal < 0

  const noLimit = creditLimit <= 0
  const usageRatio = noLimit ? 0 : totalOwed / creditLimit
  const nearLimit = !noLimit && usageRatio >= 0.8 && usageRatio < 1
  const atLimit = !noLimit && usageRatio >= 1

  return (
    <Card className="bg-muted/30 border-border/60 shadow-none">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg border bg-background text-xs font-bold text-foreground">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-foreground">{customer.name}</p>
              {customer.phone && (
                <FieldDescription>{customer.phone}</FieldDescription>
              )}
            </div>
          </div>
          <div className="space-y-0.5 text-right text-xs">
            <p className="text-muted-foreground">Outstanding</p>
            <p className={cn('font-bold tabular-nums', outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
              {rupee(outstanding)}
            </p>
          </div>
        </div>

        {!noLimit && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Credit Limit: {rupee(creditLimit)}</span>
            <span>Available: {rupee(Math.max(0, creditLimit - totalOwed))}</span>
          </div>
        )}

        {hasAdvance && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400 [&>svg]:text-blue-700 dark:[&>svg]:text-blue-400">
            <Info className="size-3.5" />
            <AlertDescription>
              {customer.name} has {rupee(Math.abs(openingBal))} advance credit
            </AlertDescription>
          </Alert>
        )}

        {nearLimit && !atLimit && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400 [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
            <AlertTriangle className="size-3.5" />
            <AlertDescription>
              {customer.name} is nearing their credit limit ({rupee(totalOwed)} of {rupee(creditLimit)} used)
            </AlertDescription>
          </Alert>
        )}

        {atLimit && (
          <Alert variant="destructive">
            <AlertCircle className="size-3.5" />
            <AlertDescription>
              Credit limit reached. {rupee(totalOwed)} outstanding.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// ─── ProductSearch ────────────────────────────────────────────────────────────

function ProductSearch({
  value, options, usedProductIds, onSelect, onQuickAdd,
}: {
  value: SaleProduct | null
  options: SaleProduct[]
  loading: boolean
  usedProductIds: string[]
  onSelect: (p: SaleProduct | null) => void
  onQuickAdd: (name: string) => void
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

  const hasExactName = useMemo(() => {
    const q = normalized(query.trim())
    return q.length > 0 && options.some(p => normalized(p.name) === q)
  }, [options, query])

  const showQuickAdd = query.trim().length > 1 && !hasExactName

  if (value) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/30 px-3">
        <Package className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-4 text-foreground">{value.name}</p>
          <p className="truncate text-[11px] leading-4 text-muted-foreground">
            {value.unit_name} · {rupee(value.selling_price)}
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
      <ComboboxInput placeholder="Search product…" showClear={false} showTrigger className="w-full" />
      <ComboboxContent align="start" sideOffset={6} className="w-full min-w-80">
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
        {showQuickAdd && (
          <div className="border-t p-1 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false)
                onQuickAdd(query.trim())
                setQuery('')
              }}
              className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-muted"
            >
              <Plus className="size-3.5" />
              Quick Add &quot;{query.trim()}&quot;
            </Button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
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
      <FieldError className="mt-0.5 flex items-center gap-1 text-[10px]">
        <AlertCircle className="size-3" />Out of stock
      </FieldError>
    )
  }
  if (requestedUnits > stock) {
    return (
      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
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
  const lineTotal = computeLineTotal(row)
  const baseUnits = computeBaseUnits(row)

  function selectProduct(p: SaleProduct | null) {
    if (!p) {
      onUpdate(row.id, { product: null, unit_price: '', sell_mode: 'unit', qty_input: '' })
      return
    }
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
      <TableCell className="min-w-[140px] align-top">
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
      </TableCell>

      <TableCell className="w-[140px] align-middle">
        <ButtonGroup className="h-8">
          <Button
            type="button"
            variant={row.sell_mode === 'unit' ? 'default' : 'outline'}
            size="xs"
            onClick={() => toggleMode('unit')}
            className="h-full px-3 text-xs font-semibold"
          >
            {row.product?.unit_name ?? 'Unit'}
          </Button>
          <Button
            type="button"
            variant={row.sell_mode === 'box' ? 'default' : 'outline'}
            size="xs"
            onClick={() => canBox && toggleMode('box')}
            disabled={!canBox}
            title={!canBox ? 'Product has no box configuration' : undefined}
            className="h-full px-3 text-xs font-semibold"
          >
            {row.product?.box_name ?? 'Box'}
          </Button>
        </ButtonGroup>
      </TableCell>

      <TableCell className="w-[100px] align-middle">
        <div>
          <Input
            min="0"
            value={row.qty_input}
            onChange={e => onUpdate(row.id, { qty_input: e.target.value })}
            placeholder="0"
            className="h-9 text-sm tabular-nums"
          />
          {row.sell_mode === 'box' && row.product?.units_per_box && num(row.qty_input) > 0 && (
            <FieldDescription className="mt-0.5 text-right text-[10px]">
              = {baseUnits} {row.product.unit_name}
            </FieldDescription>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[160px] align-middle">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>₹</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            value={row.unit_price}
            onChange={e => onUpdate(row.id, { unit_price: e.target.value })}
            placeholder="0"
          />
        </InputGroup>
      </TableCell>

      <TableCell className="w-[120px] align-middle">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>%</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            value={row.tax_rate}
            onChange={e => onUpdate(row.id, { tax_rate: e.target.value })}
          />
        </InputGroup>
      </TableCell>

      <TableCell className="w-[135px] text-right align-middle">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {lineTotal > 0 ? rupee(lineTotal) : <span className="text-muted-foreground/40">—</span>}
        </span>
      </TableCell>

      <TableCell className="w-10 align-middle" onClick={e => e.stopPropagation()}>
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

export default function NewSalePage() {
  const router = useRouter()
  const {
    generateBillNumber, saveSale, customers, products,
    optionsLoading, quickAddProduct, getOrCreateWalkinCustomer,
    refreshCustomers
  } = useNewSale()
  const { addCustomer } = useCustomers()
  const [customerFormOpen, setCustomerFormOpen] = useState(false)
  const { setCustomTitle } = useBreadcrumb()

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

  const [rows, setRows] = useState<SaleDraftLineItem[]>([emptyRow()])

  const [discount, setDiscount] = useState('')
  const [discountMode, setDiscountMode] = useState<DiscountMode>('flat')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')
  const [quickAddRowId, setQuickAddRowId] = useState('')

  const [saving, setSaving] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSale, setPreviewSale] = useState<SaleWithItems | null>(null)

  useEffect(() => {
    setCustomTitle(header.invoice_number || 'New Sale')
  }, [header.invoice_number, setCustomTitle])

  useEffect(() => {
    generateBillNumber().then(bn => setHeader(h => ({ ...h, invoice_number: bn })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
  const subtotal = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
  const taxAmount = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
  const discountVal = discountMode === 'flat' ? num(discount) : subtotal * num(discount) / 100
  const grandTotal = subtotal + taxAmount - discountVal

  useEffect(() => {
    if (!amountPaid && grandTotal > 0) {
      setAmountPaid(grandTotal.toFixed(2))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal])

  const paidAmt = num(amountPaid)
  const balanceDue = Math.max(0, grandTotal - paidAmt)

  const paymentStatus =
    paidAmt <= 0 ? 'pending'
      : balanceDue <= 0.001 ? 'paid'
        : 'partial'

  useEffect(() => {
    if (paymentMethod === 'credit') setAmountPaid('0')
  }, [paymentMethod])

  const showReference = REFERENCE_METHODS.includes(paymentMethod)
  const showDueDate = paymentMethod === 'credit'

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
      sell_mode: 'unit',
      unit_price: String(product.selling_price),
      tax_rate: String(product.gst_rate || 18),
      qty_input: '',
    })
    setQuickAddOpen(false)
    return true
  }

  function validate(): boolean {
    const errs: typeof headerErrors = {}
    if (!header.invoice_number.trim()) errs.invoice_number = 'Required'
    if (paidAmt > grandTotal + 0.001) errs.amount_paid = 'Cannot exceed grand total'
    if (paidAmt < 0) errs.amount_paid = 'Cannot be negative'

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

  function buildPreviewSale(): SaleWithItems {
    const displayName = selectedCustomer?.name ?? (header.walkin_name.trim() || 'Walk-in Customer')
    const items: SaleItem[] = validRows.map(r => ({
      id: r.id,
      sale_id: '',
      product_id: r.product!.id,
      product_name: r.product!.name,
      unit_name: r.product!.unit_name,
      box_name: r.product!.box_name,
      units_per_box: r.product!.units_per_box,
      sell_mode: r.sell_mode,
      box_count: r.sell_mode === 'box' ? num(r.qty_input) : null,
      quantity: computeBaseUnits(r),
      unit_price: num(r.unit_price),
      tax_rate: num(r.tax_rate),
      line_total: computeLineTotal(r),
    }))

    const fakePayment: PaymentRecord | undefined = paidAmt > 0 ? {
      id: 'preview',
      sale_id: null,
      customer_id: '',
      amount: paidAmt,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      payment_date: today(),
      note: null,
      created_at: new Date().toISOString(),
    } : undefined

    return {
      id: '',
      customer_id: '',
      customer_name: displayName,
      walkin_name: !header.customer_id ? header.walkin_name.trim() || null : null,
      invoice_number: header.invoice_number,
      sale_date: header.sale_date || today(),
      subtotal,
      tax_amount: taxAmount,
      discount: discountVal,
      grand_total: grandTotal,
      amount_paid: paidAmt,
      balance_due: balanceDue,
      payment_status: paymentStatus as 'paid' | 'partial' | 'pending',
      due_date: dueDate || null,
      notes: header.notes || null,
      created_at: new Date().toISOString(),
      items,
      payments: fakePayment ? [fakePayment] : [],
    }
  }

  function handlePreview() {
    if (validRows.length === 0) {
      toast.error('Add at least one product to preview the invoice')
      return
    }
    setPreviewSale(buildPreviewSale())
    setPreviewOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

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
      product: r.product!,
      sell_mode: r.sell_mode,
      qty_input: num(r.qty_input),
      unit_price: num(r.unit_price),
      tax_rate: num(r.tax_rate),
      line_total: computeLineTotal(r),
      base_units: computeBaseUnits(r),
      box_count: r.sell_mode === 'box' ? num(r.qty_input) : null,
    }))

    const saleId = await saveSale({
      invoiceNumber: header.invoice_number,
      saleDate: header.sale_date,
      customerId,
      walkinName: header.walkin_name,
      isWalkin,
      lineItems: lineItemsPayload,
      subtotal,
      taxAmount,
      discountVal,
      grandTotal,
      amountPaid: paidAmt,
      balanceDue,
      paymentStatus,
      paymentMethod,
      referenceNumber,
      dueDate,
      notes: header.notes,
    })

    if (saleId) {
      const preview = buildPreviewSale()
      setPreviewSale({ ...preview, id: saleId })
      setPreviewOpen(true)
    } else {
      setSaving(false)
      const nextBn = await generateBillNumber()
      setHeader(h => ({ ...h, invoice_number: nextBn }))
    }
  }

  const statusCfg = STATUS_CONFIG[paymentStatus as 'paid' | 'partial' | 'pending']

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] p-4 space-y-4">

        {/* ── Sale Details ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="size-3.5 text-muted-foreground/60" />
              Sale Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={!!headerErrors.invoice_number}>
                  <FieldLabel htmlFor="invoice_number">Bill Number *</FieldLabel>
                  <Input
                    id="invoice_number"
                    value={header.invoice_number}
                    onChange={e => {
                      setHeader(h => ({ ...h, invoice_number: e.target.value }))
                      setHeaderErrors(e2 => ({ ...e2, invoice_number: undefined }))
                    }}
                    placeholder="BILL-2024-001"
                    className="font-mono"
                    aria-invalid={!!headerErrors.invoice_number}
                  />
                  {headerErrors.invoice_number && (
                    <FieldError>{headerErrors.invoice_number}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="sale_date">
                    <CalendarDays className="size-3" />Date *
                  </FieldLabel>
                  <DatePicker
                    value={header.sale_date}
                    onChange={val => setHeader(h => ({ ...h, sale_date: val }))}
                  />
                </Field>
              </div>

              <Field>
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
                  onAddCustomerClick={() => setCustomerFormOpen(true)}
                />
                {!selectedCustomer && (
                  <Field className="pt-1">
                    <FieldLabel htmlFor="walkin_name">
                      Customer Name <span className="font-normal normal-case text-muted-foreground">(optional — for invoice)</span>
                    </FieldLabel>
                    <Input
                      id="walkin_name"
                      value={header.walkin_name}
                      onChange={e => setHeader(h => ({ ...h, walkin_name: e.target.value }))}
                      placeholder="e.g. Rahul Sharma (or leave blank)"
                    />
                  </Field>
                )}
                {selectedCustomer && (
                  <CustomerInfoPanel
                    customer={selectedCustomer}
                    outstanding={loadingOutstanding ? 0 : customerOutstanding}
                  />
                )}
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
                  placeholder="e.g. Delivered to shop, urgent order…"
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
                    <TableHead className="min-w-[180px] pl-4">Product</TableHead>
                    <TableHead className="w-[125px]">Mode</TableHead>
                    <TableHead className="w-[100px]">Qty</TableHead>
                    <TableHead className="w-[125px]">Sell Price</TableHead>
                    <TableHead className="w-[90px] text-right">Tax %</TableHead>
                    <TableHead className="w-[135px] text-right">Total</TableHead>
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
                    type="number"
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

        {/* ── Payment ────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CreditCard className="size-3.5 text-muted-foreground/60" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="payment_method">Payment Method *</FieldLabel>
                  <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger id="payment_method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {showReference && (
                  <Field>
                    <FieldLabel htmlFor="reference_number">Reference No.</FieldLabel>
                    <Input
                      id="reference_number"
                      value={referenceNumber}
                      onChange={e => setReferenceNumber(e.target.value)}
                      placeholder={paymentMethod === 'upi' ? 'UPI transaction ID' : 'Reference number'}
                    />
                  </Field>
                )}

                {showDueDate && (
                  <Field>
                    <FieldLabel htmlFor="due_date">
                      Due Date <span className="font-normal normal-case text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <DatePicker value={dueDate} onChange={setDueDate} />
                  </Field>
                )}
              </div>

              <Field data-invalid={!!headerErrors.amount_paid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="amount_paid">Amount Paid *</FieldLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    onClick={() => setAmountPaid(grandTotal.toFixed(2))}
                    className="h-auto p-0 text-xs font-semibold text-primary hover:underline"
                  >
                    Pay Full ({rupee(grandTotal)})
                  </Button>
                </div>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>₹</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="amount_paid"
                    type="number"
                    value={amountPaid}
                    onChange={e => {
                      setAmountPaid(e.target.value)
                      setHeaderErrors(e2 => ({ ...e2, amount_paid: undefined }))
                    }}
                    placeholder="0.00"
                    className="tabular-nums"
                    disabled={paymentMethod === 'credit'}
                    aria-invalid={!!headerErrors.amount_paid}
                  />
                </InputGroup>
                {headerErrors.amount_paid && <FieldError>{headerErrors.amount_paid}</FieldError>}
              </Field>

              <Card className="bg-muted/40 shadow-none">
                <CardContent className="divide-y p-0">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Balance Due</span>
                    <span className={cn(
                      'text-sm font-bold tabular-nums',
                      balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
                    )}>
                      {rupee(balanceDue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className={cn('font-semibold', statusCfg.color)}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </FieldGroup>
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
          <Button type="button" variant="outline" onClick={handlePreview} disabled={saving} className="h-9 px-4 text-xs font-semibold">
            <Eye className="size-3.5" />Preview Invoice
          </Button>
          <Button type="submit" disabled={saving} className="h-9 px-5 text-xs font-semibold">
            {saving
              ? <><Loader2 className="size-3.5 animate-spin" />Saving…</>
              : 'Save & Generate'}
          </Button>
        </div>
      </div>

      <ProductQuickAdd
        open={quickAddOpen}
        initialName={quickAddName}
        onClose={() => setQuickAddOpen(false)}
        onSave={handleQuickAddSave}
      />

      <InvoiceModal
        open={previewOpen}
        sale={previewSale}
        onClose={() => {
          setPreviewOpen(false)
          if (previewSale?.id && previewSale.id !== '') {
            router.push('/features/sales')
          }
        }}
      />

      <CustomerForm
        open={customerFormOpen}
        customer={null}
        onClose={() => setCustomerFormOpen(false)}
        onSubmit={async (values) => {
          const ok = await addCustomer(values)
          if (ok) {
            await refreshCustomers()
            const { data } = await supabase
              .from('customers')
              .select('id, name, phone, email, address, city, credit_limit, opening_balance, is_active')
              .eq('phone', values.phone.trim())
              .single()
            if (data) {
              setSelectedCustomer(data as any)
              setHeader(h => ({ ...h, customer_id: data.id }))
            }
          }
          return ok
        }}
      />
    </form>
  )
}