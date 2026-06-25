'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomers } from './_components/useCustomers'
import { CustomerForm }   from './_components/CustomerForm'
import { PaymentModal }   from './_components/PaymentModal'
import type { CustomerFormValues } from './_components/types'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Phone, Mail, MapPin, IndianRupee,
  Users, CreditCard, MoreHorizontal, Pencil, Power,
  PowerOff, Trash2, UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function CustomersPage() {
  const router = useRouter()
  const {
    customers, kpi, filter, search, loading, kpiLoading,
    selectedCustomer, sales, recordPayment,
    setSelectedId,
    handleSearchChange, handleFilterChange,
    addCustomer, updateCustomer, toggleActive, deleteCustomer,
  } = useCustomers()

  // ── local UI state ─────────────────────────────────────────────────────────
  const [formOpen,    setFormOpen]    = useState(false)
  const [editMode,    setEditMode]    = useState(false)   // false = add, true = edit
  const [paymentOpen, setPaymentOpen] = useState(false)

  // ── handlers ───────────────────────────────────────────────────────────────
  function openAdd()  { setEditMode(false); setFormOpen(true) }
  
  function openEdit(customerId: string) {
    setSelectedId(customerId)
    setEditMode(true)
    setFormOpen(true)
  }

  function openPayment(customerId: string) {
    setSelectedId(customerId)
    setPaymentOpen(true)
  }

  async function handleSubmit(values: CustomerFormValues) {
    if (editMode && selectedCustomer) {
      return updateCustomer(selectedCustomer.id, values)
    }
    return addCustomer(values)
  }

  const unpaidSales = sales.filter(s => s.payment_status !== 'paid')

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 bg-background">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 shrink-0">
        {/* Title and Main Action */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Customers
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Manage customer profiles, outstanding balances, and ledger history.
            </p>
          </div>
          <Button onClick={openAdd} size="default" className="px-4 shrink-0 font-medium">
            <Plus className="size-4 mr-1.5 stroke-[2.5]" />
            Add Customer
          </Button>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Active Customers',
              value: kpiLoading ? null : kpi.total_active,
              format: (n: number) => String(n),
              desc: 'Currently transacting',
              icon: <UserCheck className="size-4" />,
              cardCls: 'border bg-card'
            },
            {
              label: 'Total Outstanding',
              value: kpiLoading ? null : kpi.total_outstanding,
              format: rupee,
              desc: 'Outstanding ledger balance',
              icon: <IndianRupee className="size-4" />,
              cardCls: 'border border-amber-100 dark:border-amber-950/40 bg-amber-50/10 dark:bg-amber-950/5'
            },
            {
              label: 'Total Collected (ever)',
              value: kpiLoading ? null : kpi.total_collected,
              format: rupee,
              desc: 'Lifetime revenue collected',
              icon: <CreditCard className="size-4" />,
              cardCls: 'border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/5'
            },
          ].map(({ label, value, format, desc, icon, cardCls }) => (
            <div key={label} className={cn("rounded-xl p-4 space-y-2 relative overflow-hidden", cardCls)}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {label}
                </span>
                <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  {icon}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {value === null ? <Skeleton className="h-8 w-24" /> : format(value)}
                </div>
                <span className="text-[10px] text-muted-foreground block font-medium">
                  {desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Customers Master Table Card ────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        {/* Toolbar: Search + Filter inside the card */}
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b px-4 py-2.5">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-0 shrink-0 sm:w-[min(320px,40vw)]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search by name, phone, or GSTIN..."
                className={cn(
                  'w-full h-8 rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm',
                  'placeholder:text-muted-foreground/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring/40',
                  'transition-colors',
                )}
              />
            </div>
            <Select value={filter} onValueChange={v => handleFilterChange(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs rounded-lg border-input bg-transparent shadow-none">
                <SelectValue placeholder="Filter Customers" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="outstanding">With Outstanding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scrollable Table Viewport */}
        <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain [scrollbar-width:thin] [&_[data-slot=table-container]]:overflow-visible">
          {loading ? (
            <Table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
              <TableHeader className="bg-card shrink-0 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Customer</TableHead>
                  <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Location</TableHead>
                  <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">GSTIN</TableHead>
                  <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Credit Limit</TableHead>
                  <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Outstanding</TableHead>
                  <TableHead className="px-3 py-2 text-center font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Status</TableHead>
                  <TableHead className="w-10 pl-3 pr-4 py-2 text-right border-b border-border/40 bg-card sticky top-0 z-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent border-b border-border/40">
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-lg shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4 w-36" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="px-3 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                    <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                    <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-5 w-12 rounded-full" /></TableCell>
                    <TableCell className="py-3 pl-3 pr-4"><Skeleton className="size-7 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
              <Users className="size-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                {search || filter !== 'all' ? 'No customers match your search.' : 'No customers yet.'}
              </p>
              {!search && filter === 'all' && (
                <p className="text-xs text-muted-foreground/70">
                  Add your first customer to start recording sales.
                </p>
              )}
            </div>
          ) : (
            <Table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
              <TableHeader className="bg-card shrink-0 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Customer</TableHead>
                  <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Location</TableHead>
                  <TableHead className="px-3 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">GSTIN</TableHead>
                  <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Credit Limit</TableHead>
                  <TableHead className="px-3 py-2 text-right font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Outstanding</TableHead>
                  <TableHead className="px-3 py-2 text-center font-semibold text-xs text-muted-foreground border-b border-border/40 bg-card sticky top-0 z-10">Status</TableHead>
                  <TableHead className="w-10 pl-3 pr-4 py-2 text-right border-b border-border/40 bg-card sticky top-0 z-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(c => {
                  const limit = c.credit_limit ?? 0
                  const outstanding = c.total_outstanding
                  const overLimit = limit > 0 && outstanding >= limit
                  const nearLimit = limit > 0 && outstanding >= limit * 0.8
                  const location = [c.city, c.state].filter(Boolean).join(', ')

                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => router.push(`/features/customers/${c.id}`)}
                      className="cursor-pointer hover:bg-muted/40 transition-colors group border-b border-border/40"
                    >
                      {/* Customer Name & contact */}
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                            {getInitials(c.name)}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground text-sm leading-tight transition-colors group-hover:text-black dark:group-hover:text-white">
                              {c.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground leading-none mt-0.5">
                              {c.phone && (
                                <span className="flex items-center gap-1"><Phone className="size-2.5" /> {c.phone}</span>
                              )}
                              {c.phone && c.email && (
                                <span className="text-muted-foreground/30">•</span>
                              )}
                              {c.email && (
                                <span className="flex items-center gap-1"><Mail className="size-2.5" /> {c.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="px-3 py-3 align-middle">
                        {location ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-2.5 text-muted-foreground/50 shrink-0" />
                            <span className="truncate">{location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* GSTIN */}
                      <TableCell className="px-3 py-3 align-middle font-mono text-xs text-muted-foreground">
                        {c.gstin ? (
                          <span className="bg-muted/60 px-1 rounded font-medium">{c.gstin}</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Credit Limit */}
                      <TableCell className="px-3 py-3 text-right align-middle tabular-nums text-xs font-semibold text-foreground">
                        {limit > 0 ? rupee(limit) : <span className="text-muted-foreground/50">No Limit</span>}
                      </TableCell>

                      {/* Outstanding Balance */}
                      <TableCell className="px-3 py-3 text-right align-middle tabular-nums font-semibold">
                        <span className={cn(
                          'text-xs font-bold tabular-nums',
                          outstanding <= 0 ? 'text-emerald-600 dark:text-emerald-400' :
                          overLimit ? 'text-red-600 dark:text-red-400' :
                          'text-amber-600 dark:text-amber-400',
                        )}>
                          {outstanding > 0 ? rupee(outstanding) : '—'}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-3 py-3 text-center align-middle">
                        <Badge variant={c.is_active ? 'default' : 'secondary'} className="h-5 px-2 text-[10px] font-semibold uppercase tracking-wider">
                          {c.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right pr-4 align-middle action-trigger" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" className="size-7 opacity-0 transition-opacity group-hover:opacity-100 ml-auto">
                              <MoreHorizontal className="size-4 text-muted-foreground" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => router.push(`/features/customers/${c.id}`)}>
                              <Users className="size-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPayment(c.id)}>
                              <CreditCard className="size-4 mr-2" /> Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(c.id)}>
                              <Pencil className="size-4 mr-2" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(c)}>
                              {c.is_active ? (
                                <><PowerOff className="size-4 mr-2" /> Deactivate</>
                              ) : (
                                <><Power className="size-4 mr-2" /> Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => deleteCustomer(c)}>
                              <Trash2 className="size-4 mr-2" /> Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Add / Edit Form Sheet ── */}
      <CustomerForm
        open={formOpen}
        customer={editMode ? (selectedCustomer ?? null) : null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* ── Record Payment Modal ── */}
      <PaymentModal
        open={paymentOpen}
        customer={selectedCustomer ?? null}
        unpaidSales={unpaidSales}
        onClose={() => setPaymentOpen(false)}
        onSubmit={values => recordPayment(selectedCustomer!, values)}
      />
    </div>
  )
}

