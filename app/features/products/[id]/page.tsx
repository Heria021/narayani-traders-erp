'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useProductDetail } from './_components/useProductDetail'
import { ProductDetail } from '../_components/ProductDetail'
import { ProductForm } from '../_components/ProductForm'
import { useBreadcrumb } from '@/components/app-shell'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const {
    product,
    suppliers,
    movements,
    loading,
    notFound,
    updateProduct,
  } = useProductDetail(id)

  const [formOpen, setFormOpen] = useState(false)
  const { setCustomTitle } = useBreadcrumb()

  useEffect(() => {
    if (product?.name) setCustomTitle(product.name)
  }, [product, setCustomTitle])

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full gap-4 p-6 text-center">
        <p className="text-lg font-semibold">Product Not Found</p>
        <p className="text-sm text-muted-foreground">This product does not exist or has been removed.</p>
        <Button onClick={() => router.push('/features/products')}>
          <ArrowLeft className="size-4 mr-2" /> Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ProductDetail
          product={product}
          suppliers={suppliers}
          movements={movements}
          loading={loading}
          onEdit={() => setFormOpen(true)}
          onReorder={() => router.push(`/features/purchases/new?product_id=${id}`)}
        />
      </div>

      <ProductForm
        open={formOpen}
        product={product}
        categories={product?.category ? [product.category] : []}
        onClose={() => setFormOpen(false)}
        onSubmit={updateProduct}
      />
    </div>
  )
}
