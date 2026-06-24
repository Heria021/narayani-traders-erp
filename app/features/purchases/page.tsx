'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ShoppingCart, TrendingUp, IndianRupee, Boxes } from 'lucide-react'

import { usePurchases } from './_components/usePurchases'
import { PurchaseTable }  from './_components/PurchaseTable'
import { PurchaseDetail } from './_components/PurchaseDetail'
import type { Purchase } from './_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function PurchasesPage() {
  const router = useRouter()
  const {
    purchases, total, page, sortField, sortDir, filters, loading,
    kpi, kpiLoading,
    selectedId, detailData, detailLoading,
    setSelectedId,
    handleSearchChange, handleDateRangeChange, handleSort, handlePageChange,
    deletePurchase,
  } = usePurchases()

  const [detailOpen, setDetailOpen] = useState(false)

  function openDetail(p: Purchase) {
    setSelectedId(p.id)
    setDetailOpen(true)
  }

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

          {/* Card 4 — Items Bought */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Items Bought
              </span>
              <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Boxes className="size-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kpiLoading ? <Skeleton className="h-8 w-24" /> : kpi.total_items_bought.toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-muted-foreground block font-medium">
                Total product units received
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
          onView={openDetail}
          onDelete={deletePurchase}
        />
      </div>

      {/* ── Purchase detail drawer ───────────────────────────────────────────── */}
      <PurchaseDetail
        open={detailOpen}
        purchase={detailData}
        loading={detailLoading}
        onClose={() => { setDetailOpen(false); setSelectedId(null) }}
      />

    </div>
  )
}
