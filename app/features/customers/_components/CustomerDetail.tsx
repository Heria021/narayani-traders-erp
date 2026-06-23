'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Phone, Mail, MapPin, FileText, CreditCard,
  Pencil, Power, PowerOff, Trash2, MoreHorizontal, Plus,
} from 'lucide-react'
import type { CustomerWithStats, Sale, Payment, LedgerEntry } from './types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })

const statusBadge = (status: Sale['payment_status']) => {
  const map = {
    paid:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    partial: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    pending: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  }
  return <Badge className={cn('border-0 font-semibold capitalize text-xs', map[status])}>{status}</Badge>
}

interface Props {
  customer:      CustomerWithStats | null
  sales:         Sale[]
  payments:      Payment[]
  loading:       boolean
  ledger:        LedgerEntry[]
  onEdit:        () => void
  onPayment:     () => void
  onToggle:      () => void
  onDelete:      () => void
}

export function CustomerDetail({
  customer, sales, payments, loading, ledger,
  onEdit, onPayment, onToggle, onDelete,
}: Props) {

  // ── empty state ──────────────────────────────────────────────────────────────
  if (!customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center gap-3 text-muted-foreground">
        <FileText className="size-10 opacity-20" />
        <p className="text-sm font-medium">Select a customer to view their ledger</p>
      </div>
    )
  }

  const limit       = customer.credit_limit ?? 0
  const netOwed     = customer.opening_balance + customer.total_billed - customer.total_paid
  const creditUsedPct = limit > 0 ? Math.min(100, (netOwed / limit) * 100) : 0

  const creditBarCls =
    creditUsedPct >= 90 ? 'bg-red-500' :
    creditUsedPct >= 70 ? 'bg-amber-500' :
    'bg-emerald-500'

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-border/60">
        {/* Name + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-black dark:text-white truncate">{customer.name}</h2>
              <Badge className={cn('border-0 font-semibold text-xs shrink-0',
                customer.is_active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-neutral-100 text-neutral-500',
              )}>
                {customer.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Contact line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1">
              {customer.phone && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="size-3" /> {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="size-3" /> {customer.email}
                </div>
              )}
              {(customer.city || customer.state) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3" />
                  {[customer.city, customer.state].filter(Boolean).join(', ')}
                </div>
              )}
              {customer.gstin && (
                <div className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                  GSTIN: {customer.gstin}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={onPayment}
              className="h-8 rounded-lg bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black text-xs px-3">
              <CreditCard className="size-3 mr-1.5" /> Record Payment
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit} className="h-8 rounded-lg text-xs">
              <Pencil className="size-3 mr-1" /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon-sm" className="size-8 rounded-lg">
                  <MoreHorizontal className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={onToggle}>
                  {customer.is_active
                    ? <><PowerOff className="size-4 mr-2" /> Deactivate</>
                    : <><Power className="size-4 mr-2" /> Activate</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4 mr-2" /> Delete Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Balance summary */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Opening Balance', value: customer.opening_balance, cls: '' },
            { label: 'Total Billed',    value: customer.total_billed,    cls: '' },
            { label: 'Total Paid',      value: customer.total_paid,      cls: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Net Owed',        value: netOwed,                  cls: netOwed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-muted/40 rounded-xl px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-base font-bold tabular-nums mt-0.5', cls)}>{rupee(value)}</p>
            </div>
          ))}
        </div>

        {/* Credit limit bar */}
        {limit > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Credit Limit: {rupee(limit)}</span>
              <span>{Math.round(creditUsedPct)}% used · Free: {rupee(Math.max(0, limit - netOwed))}</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', creditBarCls)}
                style={{ width: `${creditUsedPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="ledger" className="h-full flex flex-col">
          <div className="px-6 pt-3 shrink-0 border-b border-border/60">
            <TabsList className="h-8 gap-1 bg-transparent p-0">
              {[
                { value: 'ledger',   label: 'Ledger' },
                { value: 'invoices', label: `Invoices (${sales.length})` },
                { value: 'payments', label: `Payments (${payments.length})` },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}
                  className="h-8 rounded-lg px-3 text-xs font-medium data-active:bg-black data-active:text-white dark:data-active:bg-white dark:data-active:text-black">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Ledger */}
          <TabsContent value="ledger" className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] px-6 py-4">
            {loading ? (
              <LedgerSkeleton />
            ) : ledger.length === 0 ? (
              <EmptyState message="No transactions yet for this customer." />
            ) : (
              <LedgerTable entries={ledger} customer={customer} />
            )}
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] px-6 py-4">
            {loading ? (
              <LedgerSkeleton />
            ) : sales.length === 0 ? (
              <EmptyState message="No invoices yet for this customer." />
            ) : (
              <InvoicesTable sales={sales} />
            )}
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] px-6 py-4">
            {loading ? (
              <LedgerSkeleton />
            ) : payments.length === 0 ? (
              <EmptyState message="No payments recorded for this customer." />
            ) : (
              <PaymentsTable payments={payments} sales={sales} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
      <p className="text-sm">{message}</p>
    </div>
  )
}

function LedgerSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-border/30">
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

function LedgerTable({ entries, customer }: { entries: LedgerEntry[]; customer: CustomerWithStats }) {
  // Calculate running balance (iterate newest-first, balance built newest-to-oldest)
  const netOwed = customer.opening_balance + customer.total_billed - customer.total_paid
  let runningBalance = netOwed

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const balance = runningBalance
            if (entry.kind === 'invoice') runningBalance -= entry.amount
            else if (entry.kind === 'payment') runningBalance += entry.amount
            // opening: don't adjust (it's the starting point)

            return (
              <tr key={i} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2.5 text-muted-foreground text-xs">{fmtDate(entry.date)}</td>
                <td className="px-3 py-2.5">
                  {entry.kind === 'invoice' && (
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-0 text-[10px] font-semibold">Invoice</Badge>
                  )}
                  {entry.kind === 'payment' && (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] font-semibold">Payment</Badge>
                  )}
                  {entry.kind === 'opening' && (
                    <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-semibold">Opening</Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                  {entry.kind === 'invoice'  && (entry.sale.bill_number ?? `#${entry.sale.id.slice(0,6)}`)}
                  {entry.kind === 'payment'  && (entry.payment.reference_number ?? `${entry.payment.payment_method.toUpperCase()}`)}
                  {entry.kind === 'opening'  && '—'}
                </td>
                <td className={cn(
                  'px-3 py-2.5 text-right font-semibold tabular-nums text-sm',
                  entry.kind === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
                )}>
                  {entry.kind === 'payment' ? '−' : '+'}{rupee(entry.amount)}
                </td>
                <td className={cn(
                  'px-3 py-2.5 text-right font-bold tabular-nums text-sm',
                  balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
                )}>
                  {rupee(Math.abs(balance))} {balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function InvoicesTable({ sales }: { sales: Sale[] }) {
  const [statusFilter, setStatusFilter] = useState<'all'|'paid'|'partial'|'pending'>('all')
  const filtered = statusFilter === 'all' ? sales : sales.filter(s => s.payment_status === statusFilter)

  return (
    <div className="flex flex-col gap-3">
      {/* Filter chips */}
      <div className="flex gap-2">
        {(['all', 'paid', 'partial', 'pending'] as const).map(s => (
          <button key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
              statusFilter === s
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bill No.</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t border-border/30 hover:bg-muted/20">
                <td className="px-3 py-2.5 font-mono text-xs font-medium">{s.bill_number ?? `#${s.id.slice(0,6)}`}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(s.sale_date)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium">{rupee(s.grand_total)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{rupee(s.amount_paid)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                  {s.balance_due > 0 ? rupee(s.balance_due) : '—'}
                </td>
                <td className="px-3 py-2.5 text-center">{statusBadge(s.payment_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6">No invoices with this status.</p>
        )}
      </div>
    </div>
  )
}

function PaymentsTable({ payments, sales }: { payments: Payment[]; sales: Sale[] }) {
  const billMap = new Map(sales.map(s => [s.id, s.bill_number ?? `#${s.id.slice(0,6)}`]))
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
            <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Against Bill</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id} className="border-t border-border/30 hover:bg-muted/20">
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(p.payment_date)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{rupee(p.amount)}</td>
              <td className="px-3 py-2.5 text-xs font-medium capitalize">{p.payment_method.replace('_', ' ')}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.reference_number ?? '—'}</td>
              <td className="px-3 py-2.5 text-xs font-mono">{p.sale_id ? billMap.get(p.sale_id) ?? '—' : '—'}</td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.note ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
