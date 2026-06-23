'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

import { useProducts } from '../../../lib/services/useProducts'

import { ProductTable } from './_components/ProductTable'
import { ProductForm } from './_components/ProductForm'
import type { Product } from './_components/types'

export default function ProductsPage() {
  const {
    products, total, page, sortField, sortDir,
    filters, categories, loading,
    handleSearchChange, handleCategoryChange,
    handleSort, handlePageChange,
    addProduct, updateProduct, toggleActive, deleteProduct,
  } = useProducts()

  // ── sheet state ────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  // ── handlers ───────────────────────────────────────────────────────────────
  function openAdd() { setEditProduct(null); setFormOpen(true) }

  function openEdit(p: Product) {
    setEditProduct(p)
    setFormOpen(true)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4">

      {/* ── Page Header ── shrink-0: never steals table height */}
      <div className="flex flex-col gap-4 shrink-0">
        {/* Title and Main Action */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Products
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Manage your building material inventory, tracking physical stock counts and baseline pricing metrics.
            </p>
          </div>
          <Button
            onClick={openAdd}
            size="default"
            className="px-4"
          >
            <Plus className="size-4 mr-1.5 stroke-[2.5]" />
            Add Product
          </Button>
        </div>

        {/* Minimalist KPI Dashboard Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Total SKUs
            </span>
            <div className="text-xl font-semibold tracking-tight">
              {total}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Across all categories
            </span>
          </div>

          {/* Card 2 */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Out of Stock
            </span>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <div className="text-xl font-semibold tracking-tight">
                {products.filter(p => p.track_inventory && p.current_stock <= 0).length}
              </div>
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Requires immediate reorder
            </span>
          </div>

          {/* Card 3 */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Active Categories
            </span>
            <div className="text-xl font-semibold tracking-tight">
              {categories.length}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Live structural types
            </span>
          </div>

          {/* Card 4 */}
          <div className="border rounded-lg p-4 space-y-1">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              Low Stock
            </span>
            <div className="text-xl font-semibold tracking-tight">
              {products.filter(p => p.track_inventory && p.current_stock > 0 && p.current_stock <= p.minimum_stock).length}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              Below minimum threshold
            </span>
          </div>
        </div>
      </div>

      {/* ── Table: flex-1 min-h-0 — gets exactly the leftover height ───────── */}
      <div className="flex-1 min-h-0">
        <ProductTable
          products={products}
          total={total}
          page={page}
          sortField={sortField}
          sortDir={sortDir}
          loading={loading}
          filters={filters}
          categories={categories}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onEdit={openEdit}
          onViewDetail={() => { /* detail drawer — no-op */ }}
          onToggleActive={toggleActive}
          onDelete={deleteProduct}
        />
      </div>

      {/* ── Add / Edit form ─────────────────────────────────────────────────── */}
      <ProductForm
        open={formOpen}
        product={editProduct}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSubmit={editProduct
          ? values => updateProduct(editProduct.id, values)
          : addProduct}
      />
    </div>
  )
}
