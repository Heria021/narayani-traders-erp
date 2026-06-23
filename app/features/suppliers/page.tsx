'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSuppliers } from './_components/useSuppliers'
import { SupplierList } from './_components/SupplierList'
import { SupplierDetail } from './_components/SupplierDetail'
import { SupplierForm } from './_components/SupplierForm'
import type { SupplierFormValues } from './_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function SuppliersPage() {
  const {
    suppliers, kpi, search, loading, kpiLoading,
    selectedId, selectedSupplier, purchases, supplierProducts, detailLoading,
    setSelectedId,
    handleSearchChange,
    addSupplier, updateSupplier, deleteSupplier,
  } = useSuppliers()

  const [formOpen, setFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  function openAdd() { setEditMode(false); setFormOpen(true) }
  function openEdit() { setEditMode(true); setFormOpen(true) }

  async function handleSubmit(values: SupplierFormValues) {
    if (editMode && selectedSupplier) return updateSupplier(selectedSupplier.id, values)
    return addSupplier(values)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border/60">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">Suppliers</h1>
          <p className="text-xs text-muted-foreground">Manage supplier master data and purchase history</p>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-0 border-b border-border/60 shrink-0 divide-x divide-border/60">
        {[
          { label: 'Total Suppliers', value: kpiLoading ? null : kpi.total_count, format: (n: number) => String(n) },
          { label: 'Total Purchases', value: kpiLoading ? null : kpi.total_purchased, format: rupee },
          { label: 'Amount Owed', value: kpiLoading ? null : kpi.amount_owed, format: rupee },
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
      <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr]">

        <SupplierList
          suppliers={suppliers}
          selectedId={selectedId}
          search={search}
          loading={loading}
          onSelect={setSelectedId}
          onSearch={handleSearchChange}
          onAdd={openAdd}
        />

        <SupplierDetail
          supplier={selectedSupplier ?? null}
          purchases={purchases}
          supplierProducts={supplierProducts}
          loading={detailLoading}
          onEdit={openEdit}
          onDelete={() => selectedSupplier && deleteSupplier(selectedSupplier)}
        />
      </div>

      {/* ── Add / Edit form ──────────────────────────────────────────────────── */}
      <SupplierForm
        open={formOpen}
        supplier={editMode ? (selectedSupplier ?? null) : null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
