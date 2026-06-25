'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolio } from '../../_components/usePortfolio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  IndianRupee,
  Calendar,
  Layers,
  Sparkles,
  FileText,
  UserCheck,
  ChevronRight,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Client, ProjectWithClient } from '../../_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  inquiry: { label: 'Inquiry', className: 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-0' },
  quoted: { label: 'Quoted', className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-0' },
  active: { label: 'Active', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-0' },
  on_hold: { label: 'On Hold', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0' },
}

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  interior: 'Interior',
  visualization_only: '3D Render',
  renovation: 'Renovation',
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.2">{children}</div>
}

function Label({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold text-foreground/85">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

interface ClientWithStats extends Client {
  projectCount: number
  activeCount: number
  totalAgreed: number
  projectsList: ProjectWithClient[]
}

export default function ClientsManagerPage() {
  const router = useRouter()
  const { clients, projects, loading, createClientRecord } = usePortfolio()

  // ── States ──
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
  // Sheet toggles
  const [addOpen, setAddOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // ── Add Client Form States ──
  const [cName, setCName] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cGstin, setCGstin] = useState('')
  const [cAddress, setCAddress] = useState('')
  const [cCity, setCCity] = useState('')
  const [cState, setCState] = useState('Rajasthan')
  const [cNotes, setCNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Aggregated Client list with stats ──
  const clientStats: ClientWithStats[] = useMemo(() => {
    return clients.map((client: Client) => {
      const clientProjects = projects.filter((p: ProjectWithClient) => p.client_id === client.id)
      const activeProjects = clientProjects.filter((p: ProjectWithClient) => ['active', 'quoted', 'inquiry', 'on_hold'].includes(p.status))
      const totalAgreed = clientProjects.reduce((sum: number, p: ProjectWithClient) => sum + (p.agreed_fee || 0), 0)

      return {
        ...client,
        projectCount: clientProjects.length,
        activeCount: activeProjects.length,
        totalAgreed,
        projectsList: clientProjects
      }
    })
  }, [clients, projects])

  // Filtered client list based on search
  const filteredClients = useMemo(() => {
    return clientStats.filter((c: ClientWithStats) => {
      const query = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.city && c.city.toLowerCase().includes(query))
      )
    })
  }, [clientStats, search])

  // Global KPIs summary
  const summaryKpis = useMemo(() => {
    const totalClients = clients.length
    const totalProjects = projects.length
    const totalEngagement = projects.reduce((sum: number, p: ProjectWithClient) => sum + (p.agreed_fee || 0), 0)
    const averageEngagement = totalClients > 0 ? Math.round(totalEngagement / totalClients) : 0

    return {
      totalClients,
      totalProjects,
      totalEngagement,
      averageEngagement
    }
  }, [clients, projects])

  // Handle Add Client Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cName.trim() || !cPhone.trim()) {
      toast.error('Client name and phone number are required')
      return
    }

    setSubmitting(true)
    const success = await createClientRecord({
      name: cName.trim(),
      phone: cPhone.trim(),
      email: cEmail.trim(),
      address: cAddress.trim(),
      city: cCity.trim(),
      state: cState.trim(),
      gstin: cGstin.trim(),
      notes: cNotes.trim()
    })
    setSubmitting(false)

    if (success) {
      setAddOpen(false)
      // reset form
      setCName('')
      setCPhone('')
      setCEmail('')
      setCGstin('')
      setCAddress('')
      setCCity('')
      setCNotes('')
    }
  }

  // Find currently selected client detailed stats
  const activeDetailClient = useMemo(() => {
    if (!selectedClient) return null
    return clientStats.find((c: ClientWithStats) => c.id === selectedClient.id) || null
  }, [selectedClient, clientStats])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:thin] bg-background">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Studio Clients
          </h1>
          <p className="text-xs text-muted-foreground">
            View details, contract metrics, and navigate to linked client designs and render pipelines.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto px-4 font-medium shrink-0 shadow-xs">
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          Add Client
        </Button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* Total Clients */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Total Clients
            </span>
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Users className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? <Skeleton className="h-8 w-12" /> : summaryKpis.totalClients}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Registered directories
            </span>
          </div>
        </div>

        {/* Linked Projects */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Total Client Projects
            </span>
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? <Skeleton className="h-8 w-12" /> : summaryKpis.totalProjects}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Active & historical design stages
            </span>
          </div>
        </div>

        {/* Total Engagement */}
        <div className="rounded-xl border border-violet-100 dark:border-violet-950/40 bg-violet-50/20 dark:bg-violet-950/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-violet-700/80 dark:text-violet-400/80 uppercase">
              Studio Contract Value
            </span>
            <div className="size-7 rounded-lg bg-violet-100 dark:bg-violet-950/55 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-violet-950 dark:text-violet-200">
              {loading ? <Skeleton className="h-8 w-24" /> : rupee(summaryKpis.totalEngagement)}
            </div>
            <span className="text-[10px] text-violet-700/70 dark:text-violet-400/60 block font-medium">
              Agreed client fee pipeline
            </span>
          </div>
        </div>

        {/* Avg Client value */}
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-emerald-800/80 dark:text-emerald-400/80 uppercase">
              Average Engagement
            </span>
            <div className="size-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/55 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-200">
              {loading ? <Skeleton className="h-8 w-24" /> : rupee(summaryKpis.averageEngagement)}
            </div>
            <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/60 block font-medium">
              Average fee volume per account
            </span>
          </div>
        </div>

      </div>

      {/* ── Filter Strip ── */}
      <div className="flex items-center justify-between gap-4 py-1.5 border-b pb-3.5 shrink-0">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/45" />
          <Input
            type="text"
            placeholder="Search name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-full rounded-lg shadow-none"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Showing {filteredClients.length} of {clients.length} clients
        </div>
      </div>

      {/* ── Main Clients Table ── */}
      <div className="flex-1 min-h-0 border rounded-xl overflow-y-auto [scrollbar-width:thin] bg-card">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full animate-pulse" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full animate-pulse" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-1.5">
            <Users className="size-8 opacity-25" />
            <p className="text-sm font-medium">No client records found.</p>
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-muted/40 sticky top-0 backdrop-blur-xs z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 py-2.5 text-xs font-semibold w-[25%]">Client Name</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold w-[25%]">Contact Info</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold">Location / Address</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-center">Projects Count</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-right">Contract Pipeline</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-right pr-4">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((c: ClientWithStats) => (
                <TableRow
                  key={c.id}
                  onClick={() => {
                    setSelectedClient(c)
                    setDetailOpen(true)
                  }}
                  className="cursor-pointer hover:bg-muted/30 transition-colors group"
                >
                  {/* Name */}
                  <TableCell className="pl-4 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                        {c.name.slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                          {c.name}
                        </span>
                        {c.gstin && (
                          <span className="text-[9px] font-mono bg-muted/60 border px-1 py-0.5 rounded w-fit mt-1 text-muted-foreground font-bold">
                            GSTIN: {c.gstin}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell className="py-3 align-middle">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground/50 shrink-0" />
                        {c.phone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1 truncate max-w-[190px]">
                          <Mail className="size-3 text-muted-foreground/50 shrink-0" />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="py-3 align-middle">
                    {c.city || c.state ? (
                      <div className="flex items-start gap-1 text-xs text-foreground/80 leading-normal">
                        <MapPin className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                        <span>
                          {c.city}
                          {c.city && c.state && ', '}
                          {c.state}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </TableCell>

                  {/* Active / Total Projects */}
                  <TableCell className="py-3 align-middle text-center">
                    <div className="flex flex-col items-center">
                      <Badge variant="secondary" className="font-bold text-xs">
                        {c.projectCount}
                      </Badge>
                      {c.activeCount > 0 && (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          {c.activeCount} active
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Project Pipeline */}
                  <TableCell className="py-3 align-middle text-right font-bold text-xs tabular-nums text-foreground/90">
                    {c.totalAgreed > 0 ? rupee(c.totalAgreed) : <span className="text-muted-foreground font-medium italic">—</span>}
                  </TableCell>

                  {/* Redirection link symbol */}
                  <TableCell className="py-3 align-middle text-right pr-4">
                    <div className="size-6 rounded-full hover:bg-muted inline-flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <ChevronRight className="size-4" />
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-none lg:w-[500px] lg:max-w-[500px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl bg-card"
        >
          <SheetHeader className="px-8 py-5 border-b border-border/60 shrink-0">
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-lg">Add Client</SheetTitle>
              <SheetDescription>
                Register a new client master account in your studio directory.
              </SheetDescription>
            </div>
          </SheetHeader>
          
          <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-6 px-8 py-4">

              {/* Basic Info Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
                  <p className="text-xs text-muted-foreground">General details and contact channels.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <Label required>Client Full Name</Label>
                    <Input
                      placeholder="e.g. Narendra Modi"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      className="rounded-lg shadow-none"
                      required
                    />
                  </Field>

                  <Field>
                    <Label required>Phone Number</Label>
                    <Input
                      placeholder="e.g. 9876543210"
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      className="rounded-lg shadow-none"
                      maxLength={10}
                      required
                    />
                  </Field>

                  <Field>
                    <Label>Email Address</Label>
                    <Input
                      placeholder="e.g. name@clientmail.com"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                      type="email"
                      className="rounded-lg shadow-none"
                    />
                  </Field>

                  <Field>
                    <Label>GSTIN</Label>
                    <Input
                      placeholder="e.g. 08AAAAA1111A1Z1"
                      value={cGstin}
                      onChange={(e) => setCGstin(e.target.value)}
                      className="rounded-lg shadow-none font-mono uppercase"
                      maxLength={15}
                    />
                  </Field>
                </div>
              </div>

              <Separator />

              {/* Address & Location Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Address & Location</h3>
                  <p className="text-xs text-muted-foreground">Billing address and project site location.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Field>
                    <Label>Billing / Site Address</Label>
                    <Input
                      placeholder="Street details, layout, area"
                      value={cAddress}
                      onChange={(e) => setCAddress(e.target.value)}
                      className="rounded-lg shadow-none"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <Label>City</Label>
                    <Input
                      placeholder="e.g. Jaipur"
                      value={cCity}
                      onChange={(e) => setCCity(e.target.value)}
                      className="rounded-lg shadow-none"
                    />
                  </Field>

                  <Field>
                    <Label>State</Label>
                    <Input
                      placeholder="e.g. Rajasthan"
                      value={cState}
                      onChange={(e) => setCState(e.target.value)}
                      className="rounded-lg shadow-none"
                    />
                  </Field>
                </div>
              </div>

              <Separator />

              {/* Notes Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Preferences & Referral</h3>
                  <p className="text-xs text-muted-foreground">Style preferences and referral notes.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Field>
                    <Label>Notes & Specifications</Label>
                    <Textarea
                      placeholder="Mention referral sources, design style notes, personal choices..."
                      value={cNotes}
                      onChange={(e) => setCNotes(e.target.value)}
                      className="rounded-lg min-h-[90px] [scrollbar-width:thin]"
                    />
                  </Field>
                </div>
              </div>

            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-8 py-4 border-t border-border/60 shrink-0 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              onClick={handleAddSubmit}
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold"
            >
              {submitting ? 'Saving…' : 'Add Client'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Drawer 2: Client Profile details sheet ── */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-none lg:w-[500px] lg:max-w-[500px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl bg-card"
        >
          
          {activeDetailClient && (
            <>
              <SheetHeader className="px-6 py-5 border-b shrink-0 bg-muted/20 flex flex-row items-center gap-3">
                <div className="size-10 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-bold flex items-center justify-center uppercase shrink-0">
                  {activeDetailClient.name.slice(0, 2)}
                </div>
                <div className="space-y-0.5">
                  <SheetTitle className="text-base font-bold">{activeDetailClient.name}</SheetTitle>
                  <span className="text-[10px] text-muted-foreground block">Client Directory Record</span>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto [scrollbar-width:thin] p-6 space-y-6">
                
                {/* Contact Attributes Card */}
                <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contact Profile</h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 text-muted-foreground/60" />
                      <span className="text-foreground/90 font-medium">{activeDetailClient.phone}</span>
                    </div>

                    {activeDetailClient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground/60" />
                        <span className="text-foreground/80">{activeDetailClient.email}</span>
                      </div>
                    )}

                    {(activeDetailClient.address || activeDetailClient.city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="size-3.5 text-muted-foreground/60 mt-0.5" />
                        <span className="text-foreground/80 leading-normal">
                          {activeDetailClient.address && `${activeDetailClient.address}, `}
                          {activeDetailClient.city}
                          {activeDetailClient.city && activeDetailClient.state && ', '}
                          {activeDetailClient.state}
                        </span>
                      </div>
                    )}

                    {activeDetailClient.gstin && (
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <FileText className="size-3.5 text-muted-foreground/60" />
                        <span className="font-mono font-bold text-[10px] uppercase text-foreground bg-muted border px-1.5 py-0.5 rounded">
                          GSTIN: {activeDetailClient.gstin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Engagement Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-xl p-3 bg-card space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Project Volume</span>
                    <p className="text-xl font-bold font-mono">{activeDetailClient.projectCount} Contracts</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-card space-y-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Total Pipeline</span>
                    <p className="text-xl font-bold font-mono text-violet-600 dark:text-violet-400">{rupee(activeDetailClient.totalAgreed)}</p>
                  </div>
                </div>

                {/* Private Notes block */}
                {activeDetailClient.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Client Notes & Preferences</h4>
                    <p className="text-xs text-foreground/80 bg-muted/40 p-3 rounded-lg border leading-relaxed whitespace-pre-wrap">
                      {activeDetailClient.notes}
                    </p>
                  </div>
                )}

                {/* Connected Projects list */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Linked Studio Projects ({activeDetailClient.projectCount})</h4>

                  {activeDetailClient.projectCount === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl gap-3 bg-muted/10">
                      <p className="text-xs text-muted-foreground italic text-center">
                        No design contracts registered for this client.
                      </p>
                      <Button
                        onClick={() => {
                          setDetailOpen(false)
                          router.push(`/portfolio/admin/projects/new?clientId=${activeDetailClient.id}`)
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 shadow-none"
                      >
                        <Plus className="size-3.5" />
                        Create First Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeDetailClient.projectsList.map((p: ProjectWithClient) => {
                        const badge = STATUS_BADGES[p.status] || { label: p.status, className: '' }
                        return (
                          <div
                            key={p.id}
                            className="group relative border rounded-xl p-4 bg-card hover:border-violet-300 dark:hover:border-violet-800 transition-all flex flex-col justify-between gap-3 shadow-xs"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] bg-muted border px-1 py-0.5 rounded font-bold">
                                    {p.project_number}
                                  </span>
                                  <Badge variant="outline" className={cn("text-[9px] font-semibold py-0.5 px-1.5 leading-none", badge.className)}>
                                    {badge.label}
                                  </Badge>
                                </div>
                                <h5 className="font-semibold text-xs text-foreground/90 group-hover:text-primary transition-colors leading-snug mt-1">
                                  {p.title}
                                </h5>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                  Category: {TYPE_LABELS[p.type] || p.type}
                                </p>
                              </div>

                              <span className="font-mono font-bold text-xs text-foreground/80">
                                {rupee(p.agreed_fee || 0)}
                              </span>
                            </div>

                            <Button
                              onClick={() => {
                                setDetailOpen(false)
                                router.push(`/portfolio/admin/projects/${p.id}`)
                              }}
                              variant="secondary"
                              size="sm"
                              className="w-full text-[10px] h-7.5 gap-1 shadow-none"
                            >
                              <Layers className="size-3" />
                              View Project Timeline
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              <div className="border-t p-4 shrink-0 bg-muted/10 flex justify-end">
                <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
                  Close Profile
                </Button>
              </div>
            </>
          )}

        </SheetContent>
      </Sheet>

    </div>
  )
}
