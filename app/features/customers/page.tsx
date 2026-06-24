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
import { Input } from '@/components/ui/input'
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 gap-4">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer profiles, outstanding balances, and ledger history.</p>
        </div>
        <Button onClick={openAdd} size="default" className="w-full sm:w-auto px-4 shrink-0 font-medium">
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          Add Customer
        </Button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
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
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
              <span className="text-xs text-muted-foreground block font-medium">
                {desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, phone, or GSTIN…"
            className="pl-9 h-9 text-sm rounded-lg border-border/60"
          />
        </div>
        <Select value={filter} onValueChange={v => handleFilterChange(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm rounded-lg border-border/60">
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

      {/* ── Customers Master Table ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
        <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-2 border-b">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-[10%]" />
                </div>
              ))}
            </div>
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
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 pl-4">Customer</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3">Location</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3">GSTIN</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 text-right">Credit Limit</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 text-right">Outstanding</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 text-center">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground uppercase py-3 text-right pr-4">Actions</TableHead>
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
                      className="cursor-pointer hover:bg-muted/30 transition-colors group border-b border-border/40"
                    >
                      {/* Customer Name & contact */}
                      <TableCell className="py-3 pl-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground group-hover:text-black dark:group-hover:text-white transition-colors">
                            {c.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            {c.phone && (
                              <span className="flex items-center gap-1"><Phone className="size-2.5" /> {c.phone}</span>
                            )}
                            {c.email && (
                              <span className="flex items-center gap-1"><Mail className="size-2.5" /> {c.email}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="py-3">
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
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {c.gstin ? c.gstin : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>

                      {/* Credit Limit */}
                      <TableCell className="py-3 text-right tabular-nums text-xs font-medium">
                        {limit > 0 ? rupee(limit) : <span className="text-muted-foreground/50">No Limit</span>}
                      </TableCell>

                      {/* Outstanding Balance */}
                      <TableCell className="py-3 text-right tabular-nums font-semibold">
                        <span className={cn(
                          'text-sm font-semibold tabular-nums',
                          outstanding <= 0 ? 'text-emerald-600 dark:text-emerald-400' :
                          overLimit ? 'text-red-600 dark:text-red-400' :
                          nearLimit ? 'text-amber-600 dark:text-amber-400' :
                          'text-amber-600 dark:text-amber-400',
                        )}>
                          {outstanding > 0 ? rupee(outstanding) : '—'}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 text-center">
                        <Badge variant={c.is_active ? 'default' : 'secondary'} className="h-5 px-2 text-[10px] font-semibold uppercase tracking-wider">
                          {c.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right pr-4 action-trigger" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" className="size-8 rounded-lg">
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
