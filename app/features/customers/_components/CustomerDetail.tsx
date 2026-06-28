'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Phone, Mail, MapPin, CreditCard, ArrowLeft,
  Pencil, Power, PowerOff, Trash2, MoreHorizontal,
} from 'lucide-react'
import type { CustomerWithStats, Sale, Payment, LedgerEntry } from './types'
import type { SaleWithItems } from '../../sales/_components/types'
import { InvoiceModal } from '../../sales/_components/InvoiceModal'
import { customerDisplayName, isWalkinCustomer } from './ledger'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })

const statusBadge = (status: Sale['payment_status']) => {
  const variant = status === 'paid' ? 'default' : status === 'partial' ? 'secondary' : 'destructive'
  return <Badge variant={variant} className="text-xs font-semibold capitalize">{status}</Badge>
}

interface Props {
  customer: CustomerWithStats | null
  sales: Sale[]
  payments: Payment[]
  loading: boolean
  ledger: LedgerEntry[]
  onEdit: () => void
  onPayment: () => void
  onToggle: () => void
  onDelete: () => void
  selectedInvoice: SaleWithItems | null
  invoiceLoading: boolean
  onViewInvoice: (saleId: string) => void
  onCloseInvoice: () => void
  onApplyAdvance: (payment: Payment) => void
}

export function CustomerDetail({
  customer, sales, payments, loading, ledger,
  onEdit, onPayment, onToggle, onDelete,
  selectedInvoice, invoiceLoading, onViewInvoice, onCloseInvoice, onApplyAdvance,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ledger' | 'invoices' | 'payments'>('ledger')

  if (!customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground p-16">
        <MapPin className="size-10 opacity-20" />
        <p className="text-sm font-medium">Select a customer to view their ledger</p>
      </div>
    )
  }

  const limit = customer.credit_limit ?? 0
  const netOwed = customer.amount_owed
  const creditUsedPct = limit > 0 ? Math.min(100, (Math.max(0, netOwed) / limit) * 100) : 0

  const creditBarColor =
    creditUsedPct >= 90 ? 'bg-red-500' :
    creditUsedPct >= 70 ? 'bg-amber-500' :
    'bg-emerald-500'

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-4 pt-6 bg-background">
      
      {/* ── Page Header (Sticky) ── */}
      <div className="flex flex-col gap-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight flex items-center flex-wrap gap-2">
                {customerDisplayName(customer.name)}
                <Badge variant={customer.is_active ? 'default' : 'secondary'} className="text-[10px] font-semibold uppercase tracking-wider">
                  {customer.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </h1>
            </div>
            
            {/* Contact details row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {customer.phone && (
                <span className="flex items-center gap-1"><Phone className="size-3.5 text-muted-foreground/50" />{customer.phone}</span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1"><Mail className="size-3.5 text-muted-foreground/50" />{customer.email}</span>
              )}
              {(customer.city || customer.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground/50" />
                  {[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}
                </span>
              )}
              {customer.gstin && (
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground font-medium">GSTIN: {customer.gstin}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={onPayment} className="h-9 px-4 text-sm font-medium">
              <CreditCard className="size-4 mr-2" /> Record Payment
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit} disabled={isWalkinCustomer(customer.name)} className="h-9 px-4 text-sm font-medium">
              <Pencil className="size-4 mr-2" /> Edit Profile
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" size="icon" className="size-9 rounded-lg">
                  <MoreHorizontal className="size-4 text-muted-foreground" />
                </Button>
              } />
              <DropdownMenuContent className="w-[200px]" align="end">
                {!isWalkinCustomer(customer.name) && (
                  <DropdownMenuItem onClick={onToggle}>
                    {customer.is_active
                      ? <><PowerOff className="size-4 mr-2" /> Deactivate</>
                      : <><Power className="size-4 mr-2" /> Activate</>}
                  </DropdownMenuItem>
                )}
                {!isWalkinCustomer(customer.name) && <DropdownMenuSeparator />}
                {!isWalkinCustomer(customer.name) && (
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 className="size-4 mr-2" /> Delete Customer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Metric KPIs Dashboard Row ── */}
      <div className={cn(
        'grid grid-cols-1 gap-4 shrink-0',
        customer.unapplied_advance > 0 ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4',
      )}>
        {[
          { label: 'Opening Balance', value: customer.opening_balance, desc: 'Balance at account setup', cls: '' },
          { label: 'Total Billed', value: customer.total_billed, desc: 'Sum of all sales invoices', cls: '' },
          {
            label: 'Total Paid',
            value: customer.total_paid,
            desc: customer.unapplied_advance > 0
              ? `Includes ${rupee(customer.unapplied_advance)} unapplied advance`
              : 'Sum of all collected payments',
            cls: 'text-emerald-600 dark:text-emerald-400',
          },
          ...(customer.unapplied_advance > 0 ? [{
            label: 'Unapplied Advance',
            value: customer.unapplied_advance,
            desc: 'Payments not yet linked to an invoice',
            cls: 'text-sky-600 dark:text-sky-400',
          }] : []),
          { label: 'Amount Owed', value: netOwed, desc: 'Current outstanding balance', cls: netOwed > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold' },
        ].map(({ label, value, desc, cls }) => (
          <div key={label} className="border rounded-lg p-4 space-y-1 bg-card">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase block">
              {label}
            </span>
            <div className={cn("text-xl font-bold tracking-tight tabular-nums", cls)}>
              {rupee(value)}
            </div>
            <span className="text-xs text-muted-foreground block font-medium">
              {desc}
            </span>
          </div>
        ))}
      </div>

      {/* ── Credit Limit Banner ── */}
      {limit > 0 && (
        <div className="border rounded-lg p-4 bg-card shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Credit Limit: <strong className="text-foreground">{rupee(limit)}</strong></span>
            <span>{Math.round(creditUsedPct)}% used · Free Credit: <strong className="text-emerald-600">{rupee(Math.max(0, limit - netOwed))}</strong></span>
          </div>
          <Progress value={creditUsedPct} className="w-full">
            <ProgressTrack className="h-2">
              <ProgressIndicator className={creditBarColor} style={{ width: `${creditUsedPct}%` }} />
            </ProgressTrack>
          </Progress>
        </div>
      )}

      {/* ── Bottom Section: Ledger & Tables Card ── */}
      <div className="flex-1 min-h-0 border rounded-lg bg-card flex flex-col overflow-hidden">
        {/* Custom Tab selectors */}
        <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3 shrink-0 bg-muted/20">
          <Button
            variant={activeTab === 'ledger' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('ledger')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            Ledger
          </Button>
          <Button
            variant={activeTab === 'invoices' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('invoices')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            Invoices ({sales.length})
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('payments')}
            className="h-8 px-3 text-xs font-medium shadow-none rounded-lg"
          >
            Payments ({payments.length})
          </Button>
        </div>

        {/* Tables area with internal scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] p-4">
          {activeTab === 'ledger' && (
            loading ? <LedgerSkeleton /> : ledger.length === 0 ? <EmptyState message="No transactions yet for this customer." /> : (
              <LedgerTable entries={ledger} customer={customer} onViewInvoice={onViewInvoice} />
            )
          )}
          {activeTab === 'invoices' && (
            loading ? <LedgerSkeleton /> : sales.length === 0 ? <EmptyState message="No invoices yet for this customer." /> : (
              <InvoicesTable sales={sales} onViewInvoice={onViewInvoice} />
            )
          )}
          {activeTab === 'payments' && (
            loading ? <LedgerSkeleton /> : payments.length === 0 ? <EmptyState message="No payments recorded for this customer." /> : (
              <PaymentsTable
                payments={payments}
                sales={sales}
                onApplyAdvance={onApplyAdvance}
              />
            )
          )}
        </div>
      </div>

      {/* Dynamic Invoice Sheet View */}
      <InvoiceModal
        open={!!selectedInvoice}
        sale={selectedInvoice}
        onClose={onCloseInvoice}
      />
    </div>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  )
}

function LedgerSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b py-2">
          <div className="flex gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

function LedgerTable({
  entries, customer, onViewInvoice,
}: { entries: LedgerEntry[]; customer: CustomerWithStats; onViewInvoice: (saleId: string) => void }) {
  const netOwed = customer.amount_owed
  let runningBalance = netOwed

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, i) => {
          const balance = runningBalance
          if (entry.kind === 'invoice') runningBalance -= entry.amount
          else if (entry.kind === 'payment') runningBalance += entry.amount
          else if (entry.kind === 'opening') runningBalance -= entry.amount

          const isInvoice = entry.kind === 'invoice'

          return (
            <TableRow
              key={i}
              className={cn(isInvoice && 'cursor-pointer hover:bg-muted/30')}
              onClick={() => {
                if (isInvoice) {
                  onViewInvoice(entry.sale.id)
                }
              }}
            >
              <TableCell className="text-xs text-muted-foreground">{fmtDate(entry.date)}</TableCell>
              <TableCell>
                {entry.kind === 'invoice' && <Badge className="text-[10px] font-semibold">Invoice</Badge>}
                {entry.kind === 'payment' && <Badge variant="secondary" className="text-[10px] font-semibold">Payment</Badge>}
                {entry.kind === 'opening' && <Badge variant="outline" className="text-[10px] font-semibold">Opening</Badge>}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {entry.kind === 'invoice' && entry.sale.invoice_number}
                {entry.kind === 'payment' && (entry.payment.reference_number ?? `${entry.payment.payment_method.toUpperCase()}`)}
                {entry.kind === 'opening' && '—'}
              </TableCell>
              <TableCell className={cn(
                'text-right font-semibold tabular-nums text-xs',
                entry.kind === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
              )}>
                {entry.kind === 'payment' ? '−' : '+'}{rupee(entry.amount)}
              </TableCell>
              <TableCell className={cn(
                'text-right font-bold tabular-nums text-xs',
                balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
              )}>
                {rupee(Math.abs(balance))} {balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : ''}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function InvoicesTable({
  sales, onViewInvoice,
}: { sales: Sale[]; onViewInvoice: (saleId: string) => void }) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all')
  
  const getStatusCount = (status: 'all' | 'paid' | 'partial' | 'pending') => {
    if (status === 'all') return sales.length
    return sales.filter(s => s.payment_status === status).length
  }

  const filtered = statusFilter === 'all' ? sales : sales.filter(s => s.payment_status === statusFilter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'paid', 'partial', 'pending'] as const).map(s => (
          <Button
            key={s}
            type="button"
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="text-xs font-medium shadow-none rounded-lg"
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} ({getStatusCount(s)})
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(s => (
            <TableRow
              key={s.id}
              className="cursor-pointer hover:bg-muted/30"
              onClick={() => onViewInvoice(s.id)}
            >
              <TableCell className="font-mono text-xs font-medium">{s.invoice_number}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{fmtDate(s.sale_date)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums text-xs">{rupee(s.grand_total)}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400 text-xs">{rupee(s.amount_paid)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums text-amber-600 dark:text-amber-400 text-xs">
                {s.balance_due > 0 ? rupee(s.balance_due) : '—'}
              </TableCell>
              <TableCell className="text-center">{statusBadge(s.payment_status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">No invoices with this status.</p>
      )}
    </div>
  )
}

function PaymentsTable({
  payments, sales, onApplyAdvance,
}: {
  payments: Payment[]
  sales: Sale[]
  onApplyAdvance: (payment: Payment) => void
}) {
  const invoiceMap = new Map(sales.map(s => [s.id, s.invoice_number]))
  const hasOpenInvoices = sales.some(s => s.balance_due > 0)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Against Bill</TableHead>
          <TableHead>Note</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(p => (
          <TableRow key={p.id}>
            <TableCell className="text-xs text-muted-foreground">{fmtDate(p.payment_date)}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 text-xs">{rupee(p.amount)}</TableCell>
            <TableCell className="text-xs font-medium capitalize">{p.payment_method.replace('_', ' ')}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{p.reference_number ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">{p.sale_id ? invoiceMap.get(p.sale_id) ?? '—' : 'Advance'}</TableCell>
            <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{p.note ?? '—'}</TableCell>
            <TableCell className="text-right">
              {!p.sale_id && hasOpenInvoices && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium"
                  onClick={() => onApplyAdvance(p)}
                >
                  Apply to Invoice
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}