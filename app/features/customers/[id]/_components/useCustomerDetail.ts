'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  CustomerWithStats,
  Sale,
  Payment,
  LedgerEntry,
  CustomerFormValues,
  PaymentFormValues,
} from '../../_components/types'
import { mapBalanceRow, type CustomerBalanceRow } from '../../_components/balances'
import { isWalkinCustomer } from '../../_components/ledger'
import type { SaleWithItems, SaleItem, PaymentRecord } from '../../../sales/_components/types'

// ─── helpers ──────────────────────────────────────────────────────────────────
const num = (v: string | number) => Number(v) || 0
const today = () => new Date().toISOString().slice(0, 10)

export function useCustomerDetail(id: string) {
  const supabase = createClient()

  const [customer,        setCustomer]        = useState<CustomerWithStats | null>(null)
  const [sales,           setSales]           = useState<Sale[]>([])
  const [payments,        setPayments]        = useState<Payment[]>([])
  const [loading,          setLoading]          = useState(true)
  const [notFound,         setNotFound]         = useState(false)

  // ── invoice detail state ──────────────────────────────────────────────────
  const [selectedInvoice, setSelectedInvoice] = useState<SaleWithItems | null>(null)
  const [invoiceLoading,  setInvoiceLoading]  = useState(false)

  // ── fetch sale detail ─────────────────────────────────────────────────────
  const fetchInvoiceDetail = useCallback(async (saleId: string) => {
    setInvoiceLoading(true)
    const [
      { data: sale },
      { data: items },
      { data: paymentsData },
    ] = await Promise.all([
      supabase
        .from('sales')
        .select('*, customers(name, phone)')
        .eq('id', saleId)
        .single(),
      supabase
        .from('sale_items')
        .select('*, products(name, unit_name, box_name, units_per_box)')
        .eq('sale_id', saleId)
        .order('id'),
      supabase
        .from('payments')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at'),
    ])

    if (!sale) {
      setInvoiceLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedItems: SaleItem[] = (items ?? []).map((i: any) => ({
      id:                 i.id,
      sale_id:            i.sale_id,
      product_id:         i.product_id,
      product_name:       i.products?.name ?? '—',
      unit_name:          i.products?.unit_name ?? 'unit',
      box_name:           i.products?.box_name ?? null,
      units_per_box:      i.products?.units_per_box ?? null,
      sell_mode:          i.sell_mode,
      box_count:          i.box_count,
      quantity:           i.quantity,
      unit_price:         i.unit_price,
      cost_price_at_sale: i.cost_price_at_sale,
      tax_rate:           i.tax_rate,
      line_total:         i.line_total,
      line_profit:        i.quantity * (i.unit_price - i.cost_price_at_sale),
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedPayments: PaymentRecord[] = (paymentsData ?? []).map((p: any) => ({
      id:               p.id,
      sale_id:          p.sale_id,
      customer_id:      p.customer_id,
      amount:           p.amount,
      payment_method:   p.payment_method,
      reference_number: p.reference_number,
      payment_date:     p.payment_date,
      note:             p.note,
      created_at:       p.created_at,
    }))

    setSelectedInvoice({
      ...sale,
      customer_name:  sale.customers?.name ?? 'Unknown',
      customer_phone: sale.customers?.phone ?? undefined,
      items:          enrichedItems,
      payments:       enrichedPayments,
    })
    setInvoiceLoading(false)
  }, [supabase])

  // ── fetch everything ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)

    const [
      { data: bal, error: balError },
      { data: extra, error: extraError },
    ] = await Promise.all([
      supabase.from('customer_balances').select('*').eq('id', id).single(),
      supabase.from('customers').select('is_active, credit_limit').eq('id', id).single(),
    ])

    if (balError || extraError || !bal || !extra) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setCustomer(mapBalanceRow(bal as CustomerBalanceRow, extra))

    // Fetch sales
    const { data: salesData } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_id', id)
      .order('sale_date', { ascending: false })

    // 3. Fetch payments
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', id)
      .order('payment_date', { ascending: false })

    const salesList = (salesData ?? []) as Sale[]
    const paymentsList = (paymentsData ?? []) as Payment[]

    setSales(salesList)
    setPayments(paymentsList)
    setLoading(false)
  }, [supabase, id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── build ledger ────────────────────────────────────────────────────────────
  const buildLedger = useCallback((): LedgerEntry[] => {
    if (!customer) return []
    const entries: LedgerEntry[] = []

    // Opening balance (oldest)
    if (customer.opening_balance !== 0) {
      entries.push({
        kind: 'opening',
        date: customer.created_at.slice(0, 10),
        amount: customer.opening_balance,
      })
    }

    // Sales → invoices
    for (const s of sales) {
      entries.push({ kind: 'invoice', date: s.sale_date, amount: s.grand_total, sale: s })
    }

    // Payments
    const invoiceMap = new Map(sales.map(s => [s.id, s.invoice_number]))
    for (const p of payments) {
      entries.push({
        kind: 'payment',
        date: p.payment_date,
        amount: p.amount,
        payment: p,
        invoice_number: p.sale_id ? invoiceMap.get(p.sale_id) : undefined,
      })
    }

    // Sort by date descending (newest first)
    entries.sort((a, b) => b.date.localeCompare(a.date))
    return entries
  }, [customer, sales, payments])

  // ── update ───────────────────────────────────────────────────────────────────
  const updateCustomer = useCallback(async (values: CustomerFormValues): Promise<boolean> => {
    if (customer && isWalkinCustomer(customer.name)) {
      toast.error('The walk-in account cannot be edited.')
      return false
    }
    const { error } = await supabase
      .from('customers')
      .update({
        name:        values.name.trim(),
        phone:       values.phone.trim(),
        email:       values.email.trim() || null,
        gstin:       values.gstin.trim() || null,
        address:     values.address.trim() || null,
        city:        values.city.trim() || null,
        state:       values.state.trim() || null,
        postal_code: values.postal_code.trim() || null,
        credit_limit: num(values.credit_limit) || null,
        is_active:   values.is_active,
      })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return false
    }
    toast.success(`${values.name} updated`)
    await fetchAll()
    return true
  }, [supabase, id, fetchAll])

  // ── toggle active ────────────────────────────────────────────────────────────
  const toggleActive = useCallback(async () => {
    if (!customer) return
    if (isWalkinCustomer(customer.name)) {
      toast.error('The walk-in account cannot be deactivated.')
      return
    }
    const next = !customer.is_active
    const { error } = await supabase
      .from('customers')
      .update({ is_active: next })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${customer.name} ${next ? 'activated' : 'deactivated'}`)
    await fetchAll()
  }, [supabase, id, customer, fetchAll])

  // ── delete ───────────────────────────────────────────────────────────────────
  const deleteCustomer = useCallback(async (): Promise<boolean> => {
    if (customer && isWalkinCustomer(customer.name)) {
      toast.error('The walk-in account cannot be deleted.')
      return false
    }
    const [{ count: sCount }, { count: pCount }] = await Promise.all([
      supabase.from('sales').select('id', { count: 'exact', head: true }).eq('customer_id', id),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('customer_id', id),
    ])

    if ((sCount ?? 0) > 0 || (pCount ?? 0) > 0) {
      toast.error('Customer has transaction history. Deactivate instead.')
      return false
    }

    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return false
    }
    toast.success('Customer deleted')
    return true
  }, [supabase, id])

  // ── record payment ───────────────────────────────────────────────────────────
  const recordPayment = useCallback(async (values: PaymentFormValues): Promise<boolean> => {
    if (!customer) return false
    const amount = num(values.amount)
    if (amount <= 0) {
      toast.error('Amount must be > 0')
      return false
    }

    // Insert payment
    const { error: pErr } = await supabase.from('payments').insert({
      customer_id:      customer.id,
      sale_id:          values.sale_id || null,
      amount,
      payment_method:   values.payment_method,
      reference_number: values.reference_number.trim() || null,
      payment_date:     values.payment_date || today(),
      note:             values.note.trim() || null,
    })
    if (pErr) {
      toast.error(pErr.message)
      return false
    }

    // Update linked sale if provided
    if (values.sale_id) {
      const linkedSale = sales.find(s => s.id === values.sale_id)
      if (linkedSale) {
        const newPaid    = linkedSale.amount_paid + amount
        const newBalance = Math.max(0, linkedSale.grand_total - newPaid)
        const newStatus  = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending'
        await supabase
          .from('sales')
          .update({
            amount_paid:    newPaid,
            balance_due:    newBalance,
            payment_status: newStatus,
          })
          .eq('id', values.sale_id)
      }
    }

    toast.success(`₹${amount.toFixed(2)} recorded for ${customer.name}`)
    await fetchAll()
    return true
  }, [supabase, customer, sales, fetchAll])

  return {
    customer,
    sales,
    payments,
    loading,
    notFound,
    selectedInvoice,
    invoiceLoading,
    fetchInvoiceDetail,
    setSelectedInvoice,
    buildLedger,
    updateCustomer,
    toggleActive,
    deleteCustomer,
    recordPayment,
    refresh: fetchAll,
  }
}
