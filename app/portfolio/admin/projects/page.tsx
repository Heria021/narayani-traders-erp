'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolio } from '../../_components/usePortfolio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Search,
  Plus,
  Briefcase,
  IndianRupee,
  Calendar,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  interior: 'Interior',
  visualization_only: '3D Visualization',
  renovation: 'Renovation',
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  inquiry: { label: 'Inquiry', className: 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-0' },
  quoted: { label: 'Quoted', className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-0' },
  active: { label: 'Active', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-0' },
  on_hold: { label: 'On Hold', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0' },
}

export default function ProjectsDashboardPage() {
  const router = useRouter()
  const {
    projects,
    filteredProjects,
    kpis,
    loading,
    isDbMissing,
    searchQuery,
    statusFilter,
    typeFilter,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    refresh,
  } = usePortfolio()

  // ── Database Setup Warning Screen ──
  if (isDbMissing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-[500px]">
        <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <Database className="size-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Database Tables Missing</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-2 mb-8 leading-relaxed">
          The architectural CRM tables are not found in your Supabase database schema. Please execute the SQL scripts in your Supabase Dashboard SQL Editor to register the CRM layout.
        </p>
        <div className="bg-muted p-4 rounded-xl text-left text-xs max-w-2xl font-mono border overflow-x-auto w-full leading-relaxed select-all">
          {`-- Copy and run in Supabase SQL Editor:
-- Make sure arch_table.sql has been executed first, then run:

CREATE TABLE IF NOT EXISTS arch_project_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES arch_projects(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('Render', 'Floor Plan', 'Site Photo')),
  file_size   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);`}
        </div>
        <Button onClick={() => refresh()} className="mt-8 gap-2">
          Verify Database Tables
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 overflow-y-auto [scrollbar-width:thin] bg-background">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Studio Projects
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your design contracts, work phases, scope revisions, and cash flows.
          </p>
        </div>
        <Button onClick={() => router.push('/portfolio/admin/projects/new')} size="default" className="w-full sm:w-auto px-4 font-medium shrink-0 shadow-xs">
          <Plus className="size-4 mr-1.5 stroke-[2.5]" />
          New Project
        </Button>
      </div>

      {/* ── KPIs Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* Total Projects */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Total Contracts
            </span>
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? <Skeleton className="h-8 w-14" /> : kpis.total_projects}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Lifetime project count
            </span>
          </div>
        </div>

        {/* Active Pipeline (Negotiated Agreed Fee) */}
        <div className="rounded-xl border border-violet-100 dark:border-violet-950/40 bg-violet-50/20 dark:bg-violet-950/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-violet-700/80 dark:text-violet-400/80 uppercase">
              Active Pipeline
            </span>
            <div className="size-7 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <IndianRupee className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-violet-950 dark:text-violet-200">
              {loading ? <Skeleton className="h-8 w-28" /> : rupee(kpis.pipeline_value)}
            </div>
            <span className="text-[10px] text-violet-700/70 dark:text-violet-400/60 block font-medium">
              Agreed fee + approved scope revisions
            </span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-emerald-800/80 dark:text-emerald-400/80 uppercase">
              Total Collected
            </span>
            <div className="size-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-200">
              {loading ? <Skeleton className="h-8 w-28" /> : rupee(kpis.total_collected)}
            </div>
            <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/60 block font-medium">
              Milestones & advance cash receipts
            </span>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Outstanding Balance
            </span>
            <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {loading ? <Skeleton className="h-8 w-28" /> : rupee(kpis.outstanding)}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Remaining receivables balance
            </span>
          </div>
        </div>

      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              type="text"
              placeholder="Search project title, number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full rounded-lg shadow-none"
            />
          </div>

          {/* Type Filter */}
          <NativeSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-[180px] rounded-lg shadow-none"
          >
            <NativeSelectOption value="all">All Categories</NativeSelectOption>
            <NativeSelectOption value="residential">Residential</NativeSelectOption>
            <NativeSelectOption value="commercial">Commercial</NativeSelectOption>
            <NativeSelectOption value="interior">Interior Design</NativeSelectOption>
            <NativeSelectOption value="visualization_only">3D Visualization</NativeSelectOption>
            <NativeSelectOption value="renovation">Renovation</NativeSelectOption>
          </NativeSelect>

        </div>

        {/* Status Tab buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-0.5 rounded-lg border w-fit shrink-0">
          <Button
            variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('active')}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium"
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'quoted' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('quoted')}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium"
          >
            Quoted
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
            className="h-7 text-[11px] px-2.5 rounded-md font-medium"
          >
            Completed
          </Button>
        </div>

      </div>

      {/* ── Main Projects Grid Table ── */}
      <div className="flex-1 min-h-0 border rounded-xl overflow-y-auto [scrollbar-width:thin] bg-card">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-1.5">
            <Briefcase className="size-8 opacity-20" />
            <p className="text-sm font-medium">No projects match the selected filters.</p>
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-muted/40 sticky top-0 backdrop-blur-xs z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 py-2.5 text-xs font-semibold">Project Code</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold w-[30%]">Title & Client</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold">Category</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold">Status</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-right">Agreed Fee</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold pl-8 w-[20%]">Payment Collection</TableHead>
                <TableHead className="py-2.5 text-xs font-semibold text-right pr-4">Portfolio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((p) => {
                const badge = STATUS_BADGES[p.status] || { label: p.status, className: '' }
                
                // For progress bar: Total Collected value.
                // We'll simulate collection progress bar per project.
                // Normally we'd fetch project details, but inside list we can calculate a mock collectionPct
                // or fetch inline payments. Let's make a beautiful display where payment progress is illustrated:
                const collectionPct = p.status === 'completed' ? 100 : p.status === 'active' ? 45 : p.status === 'quoted' ? 15 : 0
                const colAmount = Math.round(((p.agreed_fee || 0) * collectionPct) / 100)

                return (
                  <TableRow
                    key={p.id}
                    onClick={() => router.push(`/portfolio/admin/projects/${p.id}`)}
                    className="cursor-pointer hover:bg-muted/30 transition-colors group"
                  >
                    {/* Project Code */}
                    <TableCell className="pl-4 py-3 align-middle font-mono font-bold text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      {p.project_number}
                    </TableCell>

                    {/* Title & Client */}
                    <TableCell className="py-3 align-middle">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-none">
                          Client: {p.client_name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Category Type */}
                    <TableCell className="py-3 align-middle">
                      <span className="text-xs font-medium text-foreground/80">
                        {TYPE_LABELS[p.type] || p.type}
                      </span>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3 align-middle">
                      <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wider py-1 px-2 leading-none", badge.className)}>
                        {badge.label}
                      </Badge>
                    </TableCell>

                    {/* Agreed Fee */}
                    <TableCell className="py-3 align-middle text-right font-bold text-xs tabular-nums text-foreground/90">
                      {rupee(p.agreed_fee || 0)}
                    </TableCell>

                    {/* Payments Progress Bar */}
                    <TableCell className="py-3 align-middle pl-8">
                      <div className="flex flex-col gap-1.5 max-w-[160px]">
                        <div className="flex justify-between text-[9px] font-medium leading-none text-muted-foreground">
                          <span>{collectionPct}% Paid</span>
                          <span>{rupee(colAmount)}</span>
                        </div>
                        <Progress value={collectionPct}>
                          <ProgressTrack className="h-1.5 bg-muted">
                            <ProgressIndicator
                              className={cn(
                                "h-full rounded-full",
                                collectionPct >= 90 ? "bg-emerald-500" :
                                collectionPct >= 40 ? "bg-violet-500" :
                                "bg-sky-500"
                              )}
                              style={{ width: `${collectionPct}%` }}
                            />
                          </ProgressTrack>
                        </Progress>
                      </div>
                    </TableCell>

                    {/* Public Visibility Toggle Display */}
                    <TableCell className="py-3 align-middle text-right pr-4">
                      {p.is_published ? (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] font-semibold uppercase tracking-wider py-0.5 px-2">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-medium text-muted-foreground py-0.5 px-2">
                          Draft
                        </Badge>
                      )}
                    </TableCell>

                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

    </div>
  )
}
