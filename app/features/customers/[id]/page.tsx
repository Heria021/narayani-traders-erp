'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useCustomerDetail } from './_components/useCustomerDetail'
import { CustomerDetail } from '../_components/CustomerDetail'
import { CustomerForm } from '../_components/CustomerForm'
import { PaymentModal } from '../_components/PaymentModal'
import { useBreadcrumb } from '@/components/app-shell'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const {
    customer,
    sales,
    payments,
    loading,
    notFound,
    selectedInvoice,
    invoiceLoading,
    fetchInvoiceDetail,
    setSelectedInvoice,
    buildLedger,
    updateCustomer,
    toggleActive,
    deleteCustomer,
    recordPayment,
  } = useCustomerDetail(id)

  const [formOpen, setFormOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const { setCustomTitle } = useBreadcrumb()

  // Set the custom breadcrumb title to customer's name when loaded
  useEffect(() => {
    if (customer?.name) {
      setCustomTitle(customer.name)
    }
  }, [customer, setCustomTitle])

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full gap-4 p-6 text-center">
        <p className="text-lg font-semibold">Customer Not Found</p>
        <p className="text-sm text-muted-foreground">The customer you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/features/customers')}>
          <ArrowLeft className="size-4 mr-2" /> Back to Customers
        </Button>
      </div>
    )
  }

  async function handleDelete() {
    if (!customer) return
    const success = await deleteCustomer()
    if (success) {
      router.push('/features/customers')
    }
  }

  const ledger = customer ? buildLedger() : []
  const unpaidSales = sales.filter(s => s.payment_status !== 'paid')

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* ── Detail Panel ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <CustomerDetail
          customer={customer}
          sales={sales}
          payments={payments}
          loading={loading}
          ledger={ledger}
          onEdit={() => setFormOpen(true)}
          onPayment={() => setPaymentOpen(true)}
          onToggle={toggleActive}
          onDelete={handleDelete}
          selectedInvoice={selectedInvoice}
          invoiceLoading={invoiceLoading}
          onViewInvoice={fetchInvoiceDetail}
          onCloseInvoice={() => setSelectedInvoice(null)}
        />
      </div>

      {/* ── Edit form ── */}
      <CustomerForm
        open={formOpen}
        customer={customer}
        onClose={() => setFormOpen(false)}
        onSubmit={updateCustomer}
      />

      {/* ── Record Payment modal ── */}
      <PaymentModal
        open={paymentOpen}
        customer={customer}
        unpaidSales={unpaidSales}
        onClose={() => setPaymentOpen(false)}
        onSubmit={recordPayment}
      />
    </div>
  )
}
