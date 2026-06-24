'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import { useSupplierDetail } from './_components/useSupplierDetail'
import { SupplierDetail } from '../_components/SupplierDetail'
import { SupplierForm } from '../_components/SupplierForm'
import type { SupplierFormValues } from '../_components/types'
import { useBreadcrumb } from '@/components/app-shell'

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const {
    supplier,
    purchases,
    supplierProducts,
    loading,
    notFound,
    updateSupplier,
    deleteSupplier,
  } = useSupplierDetail(id)

  const [formOpen, setFormOpen] = useState(false)
  const { setCustomTitle } = useBreadcrumb()

  // Set the custom breadcrumb title when the supplier data load is complete
  useEffect(() => {
    if (supplier?.name) {
      setCustomTitle(supplier.name)
    }
  }, [supplier, setCustomTitle])

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full gap-4 p-6 text-center">
        <p className="text-lg font-semibold">Supplier Not Found</p>
        <p className="text-sm text-muted-foreground">The supplier you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/features/suppliers')}>
          <ArrowLeft className="size-4 mr-2" /> Back to Suppliers
        </Button>
      </div>
    )
  }

  async function handleSubmit(values: SupplierFormValues) {
    return updateSupplier(values)
  }

  async function handleDelete() {
    if (!supplier) return
    const success = await deleteSupplier()
    if (success) {
      router.push('/features/suppliers')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* ── Back Header ── */}
      <div className="flex items-center gap-4 border-b border-border/60 px-6 py-4 shrink-0 bg-muted/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/features/suppliers')}
          className="size-8"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight">Supplier Profile</h1>
          <p className="text-xs text-muted-foreground">View details, order history, and pricing metrics</p>
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <SupplierDetail
          supplier={supplier}
          purchases={purchases}
          supplierProducts={supplierProducts}
          loading={loading}
          onEdit={() => setFormOpen(true)}
          onDelete={handleDelete}
        />
      </div>

      {/* ── Edit form ── */}
      <SupplierForm
        open={formOpen}
        supplier={supplier}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

