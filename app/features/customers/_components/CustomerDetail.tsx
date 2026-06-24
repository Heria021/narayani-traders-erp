'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Phone, Mail, MapPin, FileText, CreditCard,
  Pencil, Power, PowerOff, Trash2, MoreHorizontal,
} from 'lucide-react'
import type { CustomerWithStats, Sale, Payment, LedgerEntry } from './types'

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
}

export function CustomerDetail({
  customer, sales, payments, loading, ledger,
  onEdit, onPayment, onToggle, onDelete,
}: Props) {

  if (!customer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <FileText className="size-10 opacity-20" />
        <p className="text-sm font-medium">Select a customer to view their ledger</p>
      </div>
    )
  }

  const limit = customer.credit_limit ?? 0
  const netOwed = customer.opening_balance + customer.total_billed - customer.total_paid
  const creditUsedPct = limit > 0 ? Math.min(100, (netOwed / limit) * 100) : 0

  const creditBarColor =
    creditUsedPct >= 90 ? 'bg-red-500' :
    creditUsedPct >= 70 ? 'bg-amber-500' :
    'bg-emerald-500'

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <Card className="shrink-0 gap-4 rounded-none border-x-0 border-t-0">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            {customer.name}
            <Badge variant={customer.is_active ? 'default' : 'secondary'} className="text-xs font-semibold">
              {customer.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
            {customer.phone && (
              <span className="flex items-center gap-1"><Phone className="size-3" />{customer.phone}</span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1"><Mail className="size-3" />{customer.email}</span>
            )}
            {(customer.city || customer.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {[customer.city, customer.state].filter(Boolean).join(', ')}
              </span>
            )}
            {customer.gstin && (
              <span className="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs">GSTIN: {customer.gstin}</span>
            )}
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button size="sm" onClick={onPayment} className="h-8 px-3 text-xs">
              <CreditCard className="size-3" /> Record Payment
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit} className="h-8 text-xs">
              <Pencil className="size-3" /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="size-8" />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggle}>
                  {customer.is_active
                    ? <><PowerOff className="size-4" /> Deactivate</>
                    : <><Power className="size-4" /> Activate</>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4" /> Delete Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Balance summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Opening Balance', value: customer.opening_balance, cls: '' },
              { label: 'Total Billed', value: customer.total_billed, cls: '' },
              { label: 'Total Paid', value: customer.total_paid, cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Net Owed', value: netOwed, cls: netOwed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
            ].map(({ label, value, cls }) => (
              <Card key={label} className="gap-1 bg-muted/40 px-3 py-2.5 shadow-none">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-base font-bold tabular-nums', cls)}>{rupee(value)}</p>
              </Card>
            ))}
          </div>

          {/* Credit limit bar */}
          {limit > 0 && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Credit Limit: {rupee(limit)}</span>
                <span>{Math.round(creditUsedPct)}% used · Free: {rupee(Math.max(0, limit - netOwed))}</span>
              </div>
              <Progress value={creditUsedPct} className="w-full">
                <ProgressTrack className="h-2">
                  <ProgressIndicator className={creditBarColor} style={{ width: `${creditUsedPct}%` }} />
                </ProgressTrack>
              </Progress>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <Tabs defaultValue="ledger" className="flex h-full flex-col">
          <div className="shrink-0 border-b px-6 pt-3">
            <TabsList className="h-8 gap-1 bg-transparent p-0">
              {[
                { value: 'ledger', label: 'Ledger' },
                { value: 'invoices', label: `Invoices (${sales.length})` },
                { value: 'payments', label: `Payments (${payments.length})` },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="h-8 rounded-lg px-3 text-xs font-medium">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="ledger" className="min-h-0 flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]">
            {loading ? (
              <LedgerSkeleton />
            ) : ledger.length === 0 ? (
              <EmptyState message="No transactions yet for this customer." />
            ) : (
              <LedgerTable entries={ledger} customer={customer} />
            )}
          </TabsContent>

          <TabsContent value="invoices" className="min-h-0 flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]">
            {loading ? (
              <LedgerSkeleton />
            ) : sales.length === 0 ? (
              <EmptyState message="No invoices yet for this customer." />
            ) : (
              <InvoicesTable sales={sales} />
            )}
          </TabsContent>

          <TabsContent value="payments" className="min-h-0 flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]">
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

function LedgerTable({ entries, customer }: { entries: LedgerEntry[]; customer: CustomerWithStats }) {
  const netOwed = customer.opening_balance + customer.total_billed - customer.total_paid
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

          return (
            <TableRow key={i}>
              <TableCell className="text-xs text-muted-foreground">{fmtDate(entry.date)}</TableCell>
              <TableCell>
                {entry.kind === 'invoice' && <Badge className="text-[10px] font-semibold">Invoice</Badge>}
                {entry.kind === 'payment' && <Badge variant="secondary" className="text-[10px] font-semibold">Payment</Badge>}
                {entry.kind === 'opening' && <Badge variant="outline" className="text-[10px] font-semibold">Opening</Badge>}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {entry.kind === 'invoice' && (entry.sale.bill_number ?? `#${entry.sale.id.slice(0, 6)}`)}
                {entry.kind === 'payment' && (entry.payment.reference_number ?? `${entry.payment.payment_method.toUpperCase()}`)}
                {entry.kind === 'opening' && '—'}
              </TableCell>
              <TableCell className={cn(
                'text-right font-semibold tabular-nums',
                entry.kind === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
              )}>
                {entry.kind === 'payment' ? '−' : '+'}{rupee(entry.amount)}
              </TableCell>
              <TableCell className={cn(
                'text-right font-bold tabular-nums',
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

function InvoicesTable({ sales }: { sales: Sale[] }) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all')
  const filtered = statusFilter === 'all' ? sales : sales.filter(s => s.payment_status === statusFilter)

  return (
    <div className="flex flex-col gap-3">
      <ButtonGroup>
        {(['all', 'paid', 'partial', 'pending'] as const).map(s => (
          <Button
            key={s}
            type="button"
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="text-xs font-medium"
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </ButtonGroup>

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
            <TableRow key={s.id}>
              <TableCell className="font-mono text-xs font-medium">{s.bill_number ?? `#${s.id.slice(0, 6)}`}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{fmtDate(s.sale_date)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{rupee(s.grand_total)}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">{rupee(s.amount_paid)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums text-amber-600 dark:text-amber-400">
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

function PaymentsTable({ payments, sales }: { payments: Payment[]; sales: Sale[] }) {
  const billMap = new Map(sales.map(s => [s.id, s.bill_number ?? `#${s.id.slice(0, 6)}`]))
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map(p => (
          <TableRow key={p.id}>
            <TableCell className="text-xs text-muted-foreground">{fmtDate(p.payment_date)}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{rupee(p.amount)}</TableCell>
            <TableCell className="text-xs font-medium capitalize">{p.payment_method.replace('_', ' ')}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{p.reference_number ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">{p.sale_id ? billMap.get(p.sale_id) ?? '—' : '—'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{p.note ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}