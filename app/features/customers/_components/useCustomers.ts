'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  type Customer, type CustomerWithStats, type Sale, type Payment,
  type LedgerEntry, type CustomerKpi, type CustomerFormValues,
  type PaymentFormValues, type CustomerFilter, EMPTY_CUSTOMER_FORM,
} from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────
const num = (v: string | number) => Number(v) || 0
const today = () => new Date().toISOString().slice(0, 10)

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useCustomers() {
  const supabase = createClient()

  // ── list state ──────────────────────────────────────────────────────────────
  const [customers,    setCustomers]    = useState<CustomerWithStats[]>([])
  const [kpi,          setKpi]          = useState<CustomerKpi>({ total_active: 0, total_outstanding: 0, total_collected: 0 })
  const [filter,       setFilter]       = useState<CustomerFilter>('all')
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [kpiLoading,   setKpiLoading]   = useState(true)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── detail state ─────────────────────────────────────────────────────────────
  const [selectedId,      setSelectedId]      = useState<string | null>(null)
  const [sales,           setSales]           = useState<Sale[]>([])
  const [payments,        setPayments]        = useState<Payment[]>([])
  const [detailLoading,   setDetailLoading]   = useState(false)

  // ── derived: selected customer ───────────────────────────────────────────────
  const selectedCustomer = customers.find(c => c.id === selectedId) ?? null

  // ── fetch KPIs ───────────────────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    setKpiLoading(true)
    const [
      { data: custs },
      { data: salesData },
      { data: paymentsData },
    ] = await Promise.all([
      supabase.from('customers').select('is_active'),
      supabase.from('sales').select('balance_due, payment_status'),
      supabase.from('payments').select('amount'),
    ])

    setKpi({
      total_active:      (custs ?? []).filter(c => c.is_active).length,
      total_outstanding: (salesData ?? [])
        .filter(s => s.payment_status !== 'paid')
        .reduce((sum, s) => sum + s.balance_due, 0),
      total_collected:   (paymentsData ?? []).reduce((sum, p) => sum + p.amount, 0),
    })
    setKpiLoading(false)
  }, [supabase])

  // ── fetch customer list with live outstanding ────────────────────────────────
  const fetchCustomers = useCallback(async (
    s: string = search,
    f: CustomerFilter = filter,
  ) => {
    setLoading(true)

    // Fetch all customers + their sales aggregates
    const { data: custs, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')

    if (error || !custs) { console.error(error); setLoading(false); return }

    // Aggregate outstanding per customer from sales table
    const { data: salesAgg } = await supabase
      .from('sales')
      .select('customer_id, grand_total, amount_paid, balance_due, payment_status')

    // Aggregate total payments per customer
    const { data: payAgg } = await supabase
      .from('payments')
      .select('customer_id, amount')

    const salesMap = new Map<string, { billed: number; outstanding: number }>()
    for (const s of salesAgg ?? []) {
      const cur = salesMap.get(s.customer_id) ?? { billed: 0, outstanding: 0 }
      cur.billed += s.grand_total
      if (s.payment_status !== 'paid') cur.outstanding += s.balance_due
      salesMap.set(s.customer_id, cur)
    }

    const payMap = new Map<string, number>()
    for (const p of payAgg ?? []) {
      payMap.set(p.customer_id, (payMap.get(p.customer_id) ?? 0) + p.amount)
    }

    let enriched: CustomerWithStats[] = custs.map(c => ({
      ...c,
      total_outstanding: salesMap.get(c.id)?.outstanding ?? 0,
      total_billed:      salesMap.get(c.id)?.billed      ?? 0,
      total_paid:        payMap.get(c.id)                ?? 0,
    }))

    // Apply search
    if (s.trim()) {
      const q = s.toLowerCase()
      enriched = enriched.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q) ||
        (c.gstin ?? '').toLowerCase().includes(q)
      )
    }

    // Apply filter
    if (f === 'active')      enriched = enriched.filter(c => c.is_active)
    if (f === 'inactive')    enriched = enriched.filter(c => !c.is_active)
    if (f === 'outstanding') enriched = enriched.filter(c => c.total_outstanding > 0)

    setCustomers(enriched)
    setLoading(false)
  }, [supabase, search, filter])

  // ── fetch customer detail (sales + payments) ─────────────────────────────────
  const fetchDetail = useCallback(async (customerId: string) => {
    setDetailLoading(true)
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('sales')
        .select('*')
        .eq('customer_id', customerId)
        .order('sale_date', { ascending: false }),
      supabase.from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false }),
    ])
    setSales((s ?? []) as Sale[])
    setPayments((p ?? []) as Payment[])
    setDetailLoading(false)
  }, [supabase])

  // ── initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchKpi()
    fetchCustomers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── re-fetch detail when selection changes ────────────────────────────────────
  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
    else { setSales([]); setPayments([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── filter / search handlers ──────────────────────────────────────────────────
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchCustomers(v, filter), 300)
  }, [filter, fetchCustomers])

  const handleFilterChange = useCallback((f: CustomerFilter) => {
    setFilter(f)
    fetchCustomers(search, f)
  }, [search, fetchCustomers])

  // ── build ledger from sales + payments ───────────────────────────────────────
  function buildLedger(customer: CustomerWithStats): LedgerEntry[] {
    const entries: LedgerEntry[] = []

    // Opening balance (oldest, shown last in the reversed list)
    if (customer.opening_balance !== 0) {
      entries.push({ kind: 'opening', date: customer.created_at.slice(0, 10), amount: customer.opening_balance })
    }

    // Sales → invoices
    for (const s of sales) {
      entries.push({ kind: 'invoice', date: s.sale_date, amount: s.grand_total, sale: s })
    }

    // Payments
    const billMap = new Map(sales.map(s => [s.id, s.bill_number ?? undefined]))
    for (const p of payments) {
      entries.push({
        kind: 'payment', date: p.payment_date, amount: p.amount, payment: p,
        bill_number: p.sale_id ? billMap.get(p.sale_id) : undefined,
      })
    }

    // Sort by date descending (newest first)
    entries.sort((a, b) => b.date.localeCompare(a.date))

    return entries
  }

  // ── mutations ─────────────────────────────────────────────────────────────────
  const addCustomer = useCallback(async (values: CustomerFormValues): Promise<boolean> => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name:            values.name.trim(),
        phone:           values.phone.trim(),
        email:           values.email.trim() || null,
        gstin:           values.gstin.trim() || null,
        address:         values.address.trim() || null,
        city:            values.city.trim() || null,
        state:           values.state.trim() || null,
        postal_code:     values.postal_code.trim() || null,
        credit_limit:    num(values.credit_limit) || null,
        opening_balance: num(values.opening_balance),
        is_active:       values.is_active,
      })
      .select()
      .single()

    if (error) { toast.error(error.message); return false }
    toast.success(`${values.name} added`)
    await Promise.all([fetchCustomers(), fetchKpi()])
    if (data) setSelectedId(data.id)
    return true
  }, [supabase, fetchCustomers, fetchKpi])

  const updateCustomer = useCallback(async (id: string, values: CustomerFormValues): Promise<boolean> => {
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

    if (error) { toast.error(error.message); return false }
    toast.success(`${values.name} updated`)
    await fetchCustomers()
    return true
  }, [supabase, fetchCustomers])

  const toggleActive = useCallback(async (customer: CustomerWithStats) => {
    const next = !customer.is_active
    const { error } = await supabase
      .from('customers')
      .update({ is_active: next })
      .eq('id', customer.id)
    if (error) { toast.error(error.message); return }
    toast.success(`${customer.name} ${next ? 'activated' : 'deactivated'}`)
    await Promise.all([fetchCustomers(), fetchKpi()])
  }, [supabase, fetchCustomers, fetchKpi])

  const deleteCustomer = useCallback(async (customer: CustomerWithStats): Promise<boolean> => {
    const [{ count: sCount }, { count: pCount }] = await Promise.all([
      supabase.from('sales').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('customer_id', customer.id),
    ])
    if ((sCount ?? 0) > 0 || (pCount ?? 0) > 0) {
      toast.error('Customer has transaction history. Deactivate instead.')
      return false
    }
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (error) { toast.error(error.message); return false }
    toast.success(`${customer.name} deleted`)
    if (selectedId === customer.id) setSelectedId(null)
    await Promise.all([fetchCustomers(), fetchKpi()])
    return true
  }, [supabase, fetchCustomers, fetchKpi, selectedId])

  const recordPayment = useCallback(async (
    customer: CustomerWithStats,
    values: PaymentFormValues,
  ): Promise<boolean> => {
    const amount = num(values.amount)
    if (amount <= 0) { toast.error('Amount must be > 0'); return false }

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
    if (pErr) { toast.error(pErr.message); return false }

    // If linked to a bill, update sale's amount_paid / balance_due / payment_status
    if (values.sale_id) {
      const linkedSale = sales.find(s => s.id === values.sale_id)
      if (linkedSale) {
        const newPaid    = linkedSale.amount_paid + amount
        const newBalance = Math.max(0, linkedSale.grand_total - newPaid)
        const newStatus  = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending'
        await supabase.from('sales').update({
          amount_paid:    newPaid,
          balance_due:    newBalance,
          payment_status: newStatus,
        }).eq('id', values.sale_id)
      }
    }

    toast.success(`₹${amount.toFixed(2)} recorded for ${customer.name}`)
    await Promise.all([fetchCustomers(), fetchKpi(), fetchDetail(customer.id)])
    return true
  }, [supabase, sales, fetchCustomers, fetchKpi, fetchDetail])

  return {
    // state
    customers, kpi, filter, search, loading, kpiLoading,
    selectedId, selectedCustomer, sales, payments, detailLoading,
    // actions
    setSelectedId,
    handleSearchChange, handleFilterChange,
    buildLedger,
    addCustomer, updateCustomer, toggleActive, deleteCustomer, recordPayment,
  }
}
