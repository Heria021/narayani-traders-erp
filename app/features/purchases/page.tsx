'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ShoppingCart, TrendingUp, IndianRupee, AlertCircle } from 'lucide-react'

import { usePurchases } from './_components/usePurchases'
import { PurchaseTable }  from './_components/PurchaseTable'
import { PurchaseDetail } from './_components/PurchaseDetail'
import { SupplierPaymentSheet } from '../suppliers/_components/SupplierPaymentSheet'
import type { Purchase } from './_components/types'
import type { Purchase as SupplierPurchase } from '../suppliers/_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function PurchasesPage() {
  const router = useRouter()
  const {
    purchases, total, page, sortField, sortDir, filters, loading,
    kpi, kpiLoading,
    selectedId, detailData, detailLoading,
    paymentSupplier, paymentPrefill,
    setSelectedId,
    handleSearchChange, handleDateRangeChange, handlePaymentStatusChange, handleSort, handlePageChange,
    deletePurchase,
    prepareRecordPayment, recordPayment, clearPaymentContext,
  } = usePurchases()

  const [detailOpen, setDetailOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  function openDetail(p: Purchase) {
    setSelectedId(p.id)
    setDetailOpen(true)
  }

  function closeDetail() {
    setDetailOpen(false)
    setSelectedId(null)
  }

  async function handleRecordPayment() {
    if (!detailData) return
    const ok = await prepareRecordPayment(detailData)
    if (ok) setPaymentOpen(true)
  }

  function closePayment() {
    setPaymentOpen(false)
    clearPaymentContext()
  }

  const paymentPurchases: SupplierPurchase[] = detailData ? [{
    id:              detailData.id,
    supplier_id:     detailData.supplier_id,
    purchase_number: detailData.purchase_number,
    purchase_date:   detailData.purchase_date,
    grand_total:     detailData.grand_total,
    amount_paid:     detailData.amount_paid,
    balance_due:     detailData.balance_due,
    payment_status:  detailData.payment_status,
    notes:           detailData.notes,
    created_at:      detailData.created_at,
  }] : []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">

      {/* ── Page Header ── shrink-0: never steals table height ─────────────── */}
      <div className="flex flex-col gap-4 shrink-0">

        {/* Title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Purchases</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Record supplier purchases, track inbound stock, and monitor spending over time.
            </p>
          </div>
          <Button onClick={() => router.push('/features/purchases/new')} size="default" className="w-full sm:w-auto px-4 shrink-0 font-medium">
            <Plus className="size-4 mr-1.5 stroke-[2.5]" />
            New Purchase
          </Button>
        </div>

        {/* KPI cards — hierarchy with highlight on primary metric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1 — Total Spent (Primary Metric) */}
          <div className="rounded-xl border border-violet-100 dark:border-violet-950/40 bg-violet-50/30 dark:bg-violet-950/10 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-violet-700/80 dark:text-violet-400/80 uppercase">
                Total Spent
              </span>
              <div className="size-7 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <IndianRupee className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-violet-900 dark:text-violet-200">
                {kpiLoading ? <Skeleton className="h-8 w-28" /> : rupee(kpi.total_spent)}
              </div>
              <span className="text-xs text-violet-600/70 dark:text-violet-400/60 block font-medium">
                Across all recorded orders
              </span>
            </div>
          </div>

          {/* Card 2 — Total Purchases */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Total Purchases
              </span>
              <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <ShoppingCart className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kpiLoading ? <Skeleton className="h-8 w-14" /> : kpi.total_count}
              </div>
              <span className="text-xs text-muted-foreground block font-medium">
                Lifetime PO count
              </span>
            </div>
          </div>

          {/* Card 3 — This Month */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                This Month
              </span>
              <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kpiLoading ? <Skeleton className="h-8 w-14" /> : kpi.this_month}
              </div>
              <span className="text-xs text-muted-foreground block font-medium">
                Created in current month
              </span>
            </div>
          </div>

          {/* Card 4 — Pending Amount */}
          <div className="rounded-xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-amber-700/80 dark:text-amber-400/80 uppercase">
                Pending Amount
              </span>
              <div className="size-7 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-300">
                {kpiLoading ? <Skeleton className="h-8 w-28" /> : rupee(kpi.pending_amount)}
              </div>
              <span className="text-xs text-amber-700/70 dark:text-amber-400/60 block font-medium">
                {kpiLoading
                  ? '…'
                  : `${kpi.pending_count} unpaid PO${kpi.pending_count === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Table: flex-1 min-h-0 — gets exactly the leftover height ─────────── */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <PurchaseTable
          purchases={purchases}
          total={total}
          page={page}
          sortField={sortField}
          sortDir={sortDir}
          filters={filters}
          loading={loading}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onSearch={handleSearchChange}
          onDateRange={handleDateRangeChange}
          onPaymentStatus={handlePaymentStatusChange}
          onView={openDetail}
          onDelete={deletePurchase}
        />
      </div>

      {/* ── Purchase detail drawer ───────────────────────────────────────────── */}
      <PurchaseDetail
        open={detailOpen}
        purchase={detailData}
        loading={detailLoading}
        onClose={closeDetail}
        onRecordPayment={handleRecordPayment}
      />

      {/* ── Record payment (reuses supplier payment sheet) ─────────────────────── */}
      <SupplierPaymentSheet
        open={paymentOpen}
        supplier={paymentSupplier}
        purchases={paymentPurchases}
        lockedPurchaseId={paymentPrefill?.purchaseId ?? null}
        initialAmount={paymentPrefill?.amount}
        hidePurchaseSelector
        onClose={closePayment}
        onSubmit={recordPayment}
      />

    </div>
  )
}
