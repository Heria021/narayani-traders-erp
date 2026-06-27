'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, IndianRupee, TrendingUp, AlertTriangle, CheckCircle2, BadgeDollarSign } from 'lucide-react'

import { useSales } from './_components/useSales'
import { SalesTable } from './_components/SalesTable'
import { InvoiceModal } from './_components/InvoiceModal'
import { RecordPaymentModal } from './_components/RecordPaymentModal'
import type { Sale, PaymentMethod } from './_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function SalesPage() {
  const router = useRouter()
  const {
    sales, total, page, sortField, sortDir, filters, loading,
    kpi, kpiLoading,
    selectedId, detailData, detailLoading,
    setSelectedId,
    handleSearchChange, handleStatusChange, handleDateRangeChange,
    handleSort, handlePageChange,
    deleteSale, recordPayment,
  } = useSales()

  const [invoiceOpen,  setInvoiceOpen]  = useState(false)
  const [paymentOpen,  setPaymentOpen]  = useState(false)
  const [paymentSale,  setPaymentSale]  = useState<Sale | null>(null)

  function openInvoice(s: Sale) {
    setSelectedId(s.id)
    setInvoiceOpen(true)
  }

  function openRecordPayment(s: Sale) {
    setPaymentSale(s)
    setPaymentOpen(true)
  }

  async function handleRecordPayment(
    sale: Sale, amount: number, method: PaymentMethod, referenceNumber: string,
  ) {
    return recordPayment(sale, amount, method, referenceNumber)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 shrink-0">

        {/* Title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sales</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Record sales bills, track payments, and manage outstanding balances.
            </p>
          </div>
          <Button
            onClick={() => router.push('/features/sales/new')}
            size="default"
            className="w-full sm:w-auto px-4 shrink-0 font-medium"
          >
            <Plus className="size-4 mr-1.5 stroke-[2.5]" />
            New Sale
          </Button>
        </div>

        {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

          {/* Card 1 — Today's Sales (primary) */}
          <div className="rounded-xl border border-violet-100 dark:border-violet-950/40 bg-violet-50/30 dark:bg-violet-950/10 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-violet-700/80 dark:text-violet-400/80 uppercase">
                Today's Sales
              </span>
              <div className="size-7 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <IndianRupee className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-violet-900 dark:text-violet-200">
                {kpiLoading ? <Skeleton className="h-8 w-28" /> : rupee(kpi.today_sales)}
              </div>
              <span className="text-xs text-violet-600/70 dark:text-violet-400/60 block font-medium">
                Bills raised today
              </span>
            </div>
          </div>

          {/* Card 2 — This Month */}
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
                {kpiLoading ? <Skeleton className="h-8 w-24" /> : rupee(kpi.this_month)}
              </div>
              <span className="text-xs text-muted-foreground block font-medium">
                Revenue this month
              </span>
            </div>
          </div>

          {/* Card 3 — Total Outstanding */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Outstanding
              </span>
              <div className="size-7 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kpiLoading ? <Skeleton className="h-8 w-24" /> : rupee(kpi.total_outstanding)}
              </div>
              <span className="text-xs text-muted-foreground block font-medium">
                Unpaid balance due
              </span>
            </div>
          </div>

          {/* Card 4 — Total Collected */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Total Collected
              </span>
              <div className="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kpiLoading ? <Skeleton className="h-8 w-24" /> : rupee(kpi.total_collected)}
              </div>
              <span className="text-xs text-muted-foreground block font-medium">
                All payments received
              </span>
            </div>
          </div>

          {/* Card 5 — Gross Profit (new) */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/30 dark:bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-emerald-700/80 dark:text-emerald-400/80 uppercase">
                Gross Profit
              </span>
              <div className="size-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <BadgeDollarSign className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
                {kpiLoading ? <Skeleton className="h-8 w-24" /> : rupee(kpi.gross_profit)}
              </div>
              <span className="text-xs text-emerald-600/70 dark:text-emerald-400/60 block font-medium">
                {kpiLoading
                  ? <Skeleton className="h-3 w-16 inline-block" />
                  : `${kpi.profit_margin_pct.toFixed(1)}% margin · all-time`
                }
              </span>
            </div>
          </div>

        </div>
      </div>


      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <SalesTable
          sales={sales}
          total={total}
          page={page}
          sortField={sortField}
          sortDir={sortDir}
          filters={filters}
          loading={loading}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onSearch={handleSearchChange}
          onStatusChange={handleStatusChange}
          onDateRange={handleDateRangeChange}
          onViewInvoice={openInvoice}
          onRecordPayment={openRecordPayment}
          onDelete={deleteSale}
        />
      </div>

      {/* ── Invoice Modal ────────────────────────────────────────────────────── */}
      <InvoiceModal
        open={invoiceOpen && !!detailData && !detailLoading && selectedId === detailData?.id}
        sale={detailData}
        onClose={() => { setInvoiceOpen(false); setSelectedId(null) }}
      />

      {/* ── Record Payment Modal ─────────────────────────────────────────────── */}
      <RecordPaymentModal
        open={paymentOpen}
        sale={paymentSale}
        onClose={() => { setPaymentOpen(false); setPaymentSale(null) }}
        onRecord={handleRecordPayment}
      />

    </div>
  )
}
