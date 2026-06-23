'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ShoppingCart, TrendingUp, IndianRupee, Boxes } from 'lucide-react'

import { usePurchases } from './_components/usePurchases'
import { PurchaseTable }   from './_components/PurchaseTable'
import { PurchaseDetail }  from './_components/PurchaseDetail'
import { NewPurchaseForm } from './_components/NewPurchaseForm'
import type { Purchase } from './_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function PurchasesPage() {
  const {
    purchases, total, page, sortField, sortDir, filters, loading,
    kpi, kpiLoading,
    selectedId, detailData, detailLoading,
    setSelectedId,
    handleSearchChange, handleDateRangeChange, handleSort, handlePageChange,
    generatePurchaseNumber,
    savePurchase, deletePurchase, quickAddProduct,
    searchSuppliers, searchProducts,
  } = usePurchases()

  // ── sheet state ────────────────────────────────────────────────────────────
  const [formOpen,         setFormOpen]         = useState(false)
  const [detailOpen,       setDetailOpen]       = useState(false)
  const [purchaseNumber,   setPurchaseNumber]   = useState('')

  // ── handlers ───────────────────────────────────────────────────────────────
  async function openNewPurchase() {
    const pn = await generatePurchaseNumber()
    setPurchaseNumber(pn)
    setFormOpen(true)
  }

  function openDetail(p: Purchase) {
    setSelectedId(p.id)
    setDetailOpen(true)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border/60">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">Purchases</h1>
          <p className="text-xs text-muted-foreground">Record supplier purchases and track stock automatically</p>
        </div>
        <Button
          onClick={openNewPurchase}
          className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-lg px-4"
        >
          <Plus className="size-4 mr-1.5" /> New Purchase
        </Button>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-0 border-b border-border/60 shrink-0 divide-x divide-border/60">
        {[
          {
            label: 'Total Purchases',
            icon:  <ShoppingCart className="size-4 text-muted-foreground" />,
            value: kpiLoading ? null : kpi.total_count,
            fmt:   (n: number) => String(n),
          },
          {
            label: 'This Month',
            icon:  <TrendingUp className="size-4 text-muted-foreground" />,
            value: kpiLoading ? null : kpi.this_month,
            fmt:   (n: number) => String(n),
          },
          {
            label: 'Total Spent',
            icon:  <IndianRupee className="size-4 text-muted-foreground" />,
            value: kpiLoading ? null : kpi.total_spent,
            fmt:   rupee,
          },
          {
            label: 'Items Bought',
            icon:  <Boxes className="size-4 text-muted-foreground" />,
            value: kpiLoading ? null : kpi.total_items_bought,
            fmt:   (n: number) => n.toLocaleString('en-IN'),
          },
        ].map(({ label, icon, value, fmt }) => (
          <div key={label} className="px-6 py-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              {icon}
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
            {value === null
              ? <Skeleton className="h-7 w-24 mt-0.5" />
              : <p className="text-xl font-bold tabular-nums text-black dark:text-white">{fmt(value)}</p>}
          </div>
        ))}
      </div>

      {/* ── Purchases table ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
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

      {/* ── New purchase form ────────────────────────────────────────────────── */}
      <NewPurchaseForm
        open={formOpen}
        initialPurchaseNumber={purchaseNumber}
        onClose={() => setFormOpen(false)}
        onSubmit={savePurchase}
        onSearchSuppliers={searchSuppliers}
        onSearchProducts={searchProducts}
        onQuickAddProduct={quickAddProduct}
      />
    </div>
  )
}
