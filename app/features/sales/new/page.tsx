'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import { DatePicker } from '@/components/ui/date-picker'
import { ReceiptText, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ProductQuickAdd } from '../../purchases/_components/ProductQuickAdd'
import { InvoiceModal } from '../_components/InvoiceModal'
import { useNewSale } from './useNewSale'
import { useCustomers } from '../../customers/_components/useCustomers'
import { CustomerForm } from '../../customers/_components/CustomerForm'
import { useBreadcrumb } from '@/components/app-shell'
import type {
  SaleDraftLineItem, SaleHeaderValues, DiscountMode,
  Customer, QuickProductFormValues, PaymentMethod,
  SaleWithItems, SaleItem, PaymentRecord,
} from '../_components/types'
import { STATUS_CONFIG } from '../_components/types'
import { CustomerSearch } from './_components/CustomerSearch'
import { CustomerInfoPanel } from './_components/CustomerInfoPanel'
import { LineItemsSection } from './_components/LineItemsSection'
import { SaleCheckoutSidebar } from './_components/SaleCheckoutSidebar'
import {
  computeBaseUnits, computeLineTotal, emptyRow, num, rupee, today,
} from './_components/helpers'

export default function NewSalePage() {
  const router = useRouter()
  const {
    generateBillNumber, saveSale, customers, products,
    quickAddProduct, getOrCreateWalkinCustomer,
    refreshCustomers,
  } = useNewSale()
  const { addCustomer } = useCustomers()
  const { setCustomTitle } = useBreadcrumb()
  const supabase = useMemo(() => createClient(), [])

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
  const [customerFormOpen, setCustomerFormOpen] = useState(false)
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

  useEffect(() => {
    if (!selectedCustomer) { setCustomerOutstanding(0); return }
    setLoadingOutstanding(true)
    supabase
      .from('sales')
      .select('balance_due')
      .eq('customer_id', selectedCustomer.id)
      .neq('payment_status', 'paid')
      .then(({ data }) => {
        setCustomerOutstanding((data ?? []).reduce((s, r) => s + r.balance_due, 0))
        setLoadingOutstanding(false)
      })
  }, [selectedCustomer, supabase])

  const validRows = rows.filter(r => r.product && num(r.qty_input) > 0)
  const subtotal = validRows.reduce((s, r) => s + computeLineTotal(r), 0)
  const taxAmount = validRows.reduce((s, r) => s + computeLineTotal(r) * num(r.tax_rate) / 100, 0)
  const discountVal = discountMode === 'flat' ? num(discount) : subtotal * num(discount) / 100
  const grandTotal = subtotal + taxAmount - discountVal
  const paidAmt = num(amountPaid)
  const balanceDue = Math.max(0, grandTotal - paidAmt)
  const paymentStatus =
    paidAmt <= 0 ? 'pending' : balanceDue <= 0.001 ? 'paid' : 'partial'

  useEffect(() => {
    if (!amountPaid && grandTotal > 0) setAmountPaid(grandTotal.toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal])

  useEffect(() => {
    if (paymentMethod === 'credit') setAmountPaid('0')
  }, [paymentMethod])

  const usedProductIds = rows.map(r => r.product?.id ?? '').filter(Boolean)
  const statusCfg = STATUS_CONFIG[paymentStatus as 'paid' | 'partial' | 'pending']

  const updateRow = useCallback((id: string, patch: Partial<SaleDraftLineItem>) => {
    setRows(prev => prev.map(r => r.id !== id ? r : { ...r, ...patch }))
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.length === 1 ? [emptyRow()] : prev.filter(r => r.id !== id))
  }, [])

  const addRow = useCallback(() => {
    setRows(prev => [...prev, emptyRow()])
  }, [])

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
      setSaving(false)
      setPreviewSale({ ...buildPreviewSale(), id: saleId })
      setPreviewOpen(true)
    } else {
      setSaving(false)
      const nextBn = await generateBillNumber()
      setHeader(h => ({ ...h, invoice_number: nextBn }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20 dark:bg-background">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        <div className="mx-auto max-w-6xl space-y-6 p-4 pb-8 lg:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">New sales bill</p>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <ReceiptText className="size-6 text-violet-600 dark:text-violet-400" />
                Create Bill
              </h1>
            </div>
            <Badge variant="outline" className={cn('self-start font-semibold', statusCfg.color)}>
              {statusCfg.label}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">

            <div className="space-y-6 min-w-0">
              <Card>
                <CardHeader>
                  <CardDescription>Invoice details</CardDescription>
                  <CardTitle>{header.invoice_number || 'Generating…'}</CardTitle>
                  <CardAction>
                    <Badge variant="secondary" className="font-mono text-[10px]">Draft</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="gap-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field data-invalid={!!headerErrors.invoice_number}>
                        <FieldLabel htmlFor="invoice_number">Bill number</FieldLabel>
                        <Input
                          id="invoice_number"
                          value={header.invoice_number}
                          onChange={e => {
                            setHeader(h => ({ ...h, invoice_number: e.target.value }))
                            setHeaderErrors(e2 => ({ ...e2, invoice_number: undefined }))
                          }}
                          placeholder="BILL-2026-001"
                          className="font-mono"
                          aria-invalid={!!headerErrors.invoice_number}
                        />
                        {headerErrors.invoice_number && (
                          <FieldError>{headerErrors.invoice_number}</FieldError>
                        )}
                      </Field>
                      <Field>
                        <FieldLabel>Sale date</FieldLabel>
                        <DatePicker
                          value={header.sale_date}
                          onChange={val => setHeader(h => ({ ...h, sale_date: val }))}
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>Who is this bill for?</CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="size-4 text-muted-foreground" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="gap-4">
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel>Select customer</FieldLabel>
                        <span className="text-xs text-muted-foreground">Blank = walk-in</span>
                      </div>
                      <CustomerSearch
                        value={selectedCustomer}
                        options={customers}
                        onSelect={c => {
                          setSelectedCustomer(c)
                          setHeader(h => ({ ...h, customer_id: c?.id ?? '' }))
                        }}
                        onAddCustomerClick={() => setCustomerFormOpen(true)}
                      />
                    </Field>

                    {!selectedCustomer && (
                      <Field>
                        <FieldLabel htmlFor="walkin_name">
                          Walk-in name <span className="font-normal text-muted-foreground">(optional)</span>
                        </FieldLabel>
                        <Input
                          id="walkin_name"
                          value={header.walkin_name}
                          onChange={e => setHeader(h => ({ ...h, walkin_name: e.target.value }))}
                          placeholder="e.g. Rahul Sharma"
                        />
                      </Field>
                    )}

                    {selectedCustomer && (
                      <CustomerInfoPanel
                        customer={selectedCustomer}
                        outstanding={loadingOutstanding ? 0 : customerOutstanding}
                      />
                    )}

                    <Field>
                      <FieldLabel htmlFor="notes">Notes</FieldLabel>
                      <Textarea
                        id="notes"
                        value={header.notes}
                        onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                        rows={2}
                        placeholder="Delivery instructions, urgency, etc."
                        className="resize-none"
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <LineItemsSection
                rows={rows}
                products={products}
                validCount={validRows.length}
                subtotal={subtotal}
                usedProductIds={usedProductIds}
                onAddRow={addRow}
                onUpdateRow={updateRow}
                onRemoveRow={removeRow}
                onQuickAdd={openQuickAdd}
              />
            </div>

            <SaleCheckoutSidebar
              subtotal={subtotal}
              taxAmount={taxAmount}
              discount={discount}
              discountMode={discountMode}
              discountVal={discountVal}
              grandTotal={grandTotal}
              amountPaid={amountPaid}
              balanceDue={balanceDue}
              paymentStatus={paymentStatus as 'paid' | 'partial' | 'pending'}
              paymentMethod={paymentMethod}
              referenceNumber={referenceNumber}
              dueDate={dueDate}
              headerErrors={headerErrors}
              saving={saving}
              onDiscountChange={setDiscount}
              onDiscountModeChange={setDiscountMode}
              onAmountPaidChange={v => {
                setAmountPaid(v)
                setHeaderErrors(e2 => ({ ...e2, amount_paid: undefined }))
              }}
              onPaymentMethodChange={setPaymentMethod}
              onReferenceChange={setReferenceNumber}
              onDueDateChange={setDueDate}
              onPayFull={() => setAmountPaid(grandTotal.toFixed(2))}
              onPreview={handlePreview}
              onCancel={() => router.back()}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-card px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="text-lg font-bold tabular-nums">{rupee(grandTotal)}</p>
        </div>
        <Button type="submit" disabled={saving} size="sm">
          {saving ? 'Saving…' : 'Save bill'}
        </Button>
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
          if (previewSale?.id) router.push('/features/sales')
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
              setSelectedCustomer(data as Customer)
              setHeader(h => ({ ...h, customer_id: data.id }))
            }
          }
          return ok
        }}
      />
    </form>
  )
}
