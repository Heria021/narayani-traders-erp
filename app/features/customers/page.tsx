'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomers } from './_components/useCustomers'
import { CustomerList }   from './_components/CustomerList'
import { CustomerDetail } from './_components/CustomerDetail'
import { CustomerForm }   from './_components/CustomerForm'
import { PaymentModal }   from './_components/PaymentModal'
import type { CustomerFormValues } from './_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function CustomersPage() {
  const {
    customers, kpi, filter, search, loading, kpiLoading,
    selectedId, selectedCustomer, sales, payments, detailLoading,
    setSelectedId,
    handleSearchChange, handleFilterChange,
    buildLedger,
    addCustomer, updateCustomer, toggleActive, deleteCustomer, recordPayment,
  } = useCustomers()

  // ── local UI state ─────────────────────────────────────────────────────────
  const [formOpen,    setFormOpen]    = useState(false)
  const [editMode,    setEditMode]    = useState(false)   // false = add, true = edit
  const [paymentOpen, setPaymentOpen] = useState(false)

  // ── handlers ───────────────────────────────────────────────────────────────
  function openAdd()  { setEditMode(false); setFormOpen(true) }
  function openEdit() { setEditMode(true);  setFormOpen(true) }

  async function handleSubmit(values: CustomerFormValues) {
    if (editMode && selectedCustomer) return updateCustomer(selectedCustomer.id, values)
    return addCustomer(values)
  }

  const ledger = selectedCustomer ? buildLedger(selectedCustomer) : []
  const unpaidSales = sales.filter(s => s.payment_status !== 'paid')

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border/60">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">Customers</h1>
          <p className="text-xs text-muted-foreground">Manage customer master data, ledger and payment history</p>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-0 border-b border-border/60 shrink-0 divide-x divide-border/60">
        {[
          { label: 'Total Active Customers', value: kpiLoading ? null : kpi.total_active, format: (n: number) => String(n) },
          { label: 'Total Outstanding',      value: kpiLoading ? null : kpi.total_outstanding, format: rupee },
          { label: 'Total Collected (ever)', value: kpiLoading ? null : kpi.total_collected,   format: rupee },
        ].map(({ label, value, format }) => (
          <div key={label} className="px-6 py-3 flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            {value === null
              ? <Skeleton className="h-6 w-24 mt-0.5" />
              : <p className="text-xl font-bold tabular-nums text-black dark:text-white">{format(value)}</p>}
          </div>
        ))}
      </div>

      {/* ── Split panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-[320px_1fr]">

        {/* Left — customer list */}
        <CustomerList
          customers={customers}
          selectedId={selectedId}
          search={search}
          filter={filter}
          loading={loading}
          onSelect={setSelectedId}
          onSearch={handleSearchChange}
          onFilter={handleFilterChange}
          onAdd={openAdd}
        />

        {/* Right — customer detail */}
        <CustomerDetail
          customer={selectedCustomer ?? null}
          sales={sales}
          payments={payments}
          loading={detailLoading}
          ledger={ledger}
          onEdit={openEdit}
          onPayment={() => setPaymentOpen(true)}
          onToggle={() => selectedCustomer && toggleActive(selectedCustomer)}
          onDelete={() => selectedCustomer && deleteCustomer(selectedCustomer)}
        />
      </div>

      {/* ── Add / Edit form ──────────────────────────────────────────────────── */}
      <CustomerForm
        open={formOpen}
        customer={editMode ? (selectedCustomer ?? null) : null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* ── Record Payment modal ─────────────────────────────────────────────── */}
      <PaymentModal
        open={paymentOpen}
        customer={selectedCustomer ?? null}
        unpaidSales={unpaidSales}
        onClose={() => setPaymentOpen(false)}
        onSubmit={values => recordPayment(selectedCustomer!, values)}
      />
    </div>
  )
}
