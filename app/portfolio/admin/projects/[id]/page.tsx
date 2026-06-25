'use client'

import React, { use, useState, useEffect, useMemo } from 'react'
import { usePortfolio } from '../../../_components/usePortfolio'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Card, CardAction, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Field, FieldContent, FieldDescription,
  FieldGroup, FieldLabel,
} from '@/components/ui/field'
import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Check, Clock, AlertTriangle, Plus, Sparkles,
  Trash2, Link as LinkIcon, FileText, Sliders,
  ChevronRight, TrendingUp, IndianRupee, Layers,
  CheckCircle2, Circle,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  ProjectPhase, PhaseStatus, ExtraType,
  PaymentType, PaymentMethod, MediaCategory, ProjectStatus,
} from '../../../_components/types'
import { SHOP } from '@/lib/config/shop'

// ─── formatters ───────────────────────────────────────────────────────────────

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

const SERVICE_LABELS: Record<string, string> = {
  design_drawings: 'Drawings & Site Surveys',
  visualization_3d: '3D Renders & Walkthrough',
  construction_supervision: 'Site Supervision',
  interior_design: 'Interior Styling',
  renovation: 'Renovation Drafting',
}

const PHASE_CFG: Record<PhaseStatus, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     variant: 'secondary', icon: <Circle className="size-3 text-muted-foreground" /> },
  in_progress: { label: 'In Progress', variant: 'default',   icon: <Clock className="size-3 text-blue-400" /> },
  review:      { label: 'In Review',   variant: 'outline',   icon: <AlertTriangle className="size-3 text-amber-500" /> },
  revision:    { label: 'Revisions',   variant: 'outline',   icon: <AlertTriangle className="size-3 text-amber-500" /> },
  completed:   { label: 'Completed',   variant: 'secondary', icon: <Check className="size-3 text-emerald-500" /> },
}

// ─── types ────────────────────────────────────────────────────────────────────

type PhaseEditMap = Record<string, {
  status: PhaseStatus
  notes: string
  started_at: string
  completed_at: string
}>

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const {
    projectDetail, detailLoading, fetchProjectDetail,
    updateProjectAttributes, updatePhase,
    recordPayment, addExtra, toggleExtraApproval,
    linkMedia, unlinkMedia,
  } = usePortfolio()

  // ── sheet / dialog open flags ──
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false)
  const [financialsOpen, setFinancialsOpen] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [activeForm, setActiveForm] = useState<'payment' | 'extra' | null>(null)

  // ── service sheet ──
  // selectedServiceId drives which service's phases appear in the sheet
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  // phaseEdits: per-phase form state, initialised when sheet opens
  const [phaseEdits, setPhaseEdits] = useState<PhaseEditMap>({})
  const [phaseSaving, setPhaseSaving] = useState(false)

  // ── payment form ──
  const [payAmount, setPayAmount] = useState('')
  const [payType, setPayType] = useState<PaymentType>('milestone')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi')
  const [payRef, setPayRef] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payNote, setPayNote] = useState('')
  const [payPhaseId, setPayPhaseId] = useState('')

  // ── extra form ──
  const [extraType, setExtraType] = useState<ExtraType>('addition')
  const [extraDesc, setExtraDesc] = useState('')
  const [extraImpact, setExtraImpact] = useState('')
  const [extraDate, setExtraDate] = useState(new Date().toISOString().slice(0, 10))
  const [extraNotes, setExtraNotes] = useState('')
  const [extraApprove, setExtraApprove] = useState(false)

  // ── media form ──
  const [mName, setMName] = useState('')
  const [mUrl, setMUrl] = useState('')
  const [mCategory, setMCategory] = useState<MediaCategory>('Render')

  useEffect(() => { if (id) fetchProjectDetail(id) }, [id, fetchProjectDetail])

  // derived: service currently open in the sheet
  const selectedService = useMemo(
    () => projectDetail?.services.find(s => s.id === selectedServiceId) ?? null,
    [projectDetail, selectedServiceId]
  )
  const selectedPhases = useMemo(
    () => projectDetail?.phases.filter(p => p.service_id === selectedServiceId) ?? [],
    [projectDetail, selectedServiceId]
  )

  const calculations = useMemo(() => {
    if (!projectDetail) return { agreed: 0, extras: 0, total: 0, paid: 0, balance: 0 }
    const agreed = projectDetail.agreed_fee || 0
    const extras = projectDetail.extras
      .filter(e => e.approved_by_client)
      .reduce((sum, e) => sum + Number(e.fee_impact), 0)
    const total = agreed + extras
    const paid = projectDetail.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    return { agreed, extras, total, paid, balance: Math.max(0, total - paid) }
  }, [projectDetail])

  // open sheet: init phaseEdits from current phase data
  function openServiceSheet(serviceId: string) {
    const phases = projectDetail?.phases.filter(p => p.service_id === serviceId) ?? []
    const edits: PhaseEditMap = {}
    for (const p of phases) {
      edits[p.id] = {
        status: p.status,
        notes: p.notes || '',
        started_at: p.started_at || '',
        completed_at: p.completed_at || '',
      }
    }
    setPhaseEdits(edits)
    setSelectedServiceId(serviceId)
    setServiceSheetOpen(true)
  }

  function closeServiceSheet() {
    setServiceSheetOpen(false)
    setSelectedServiceId(null)
    setPhaseEdits({})
  }

  function setPhaseField<K extends keyof PhaseEditMap[string]>(
    phaseId: string, key: K, value: PhaseEditMap[string][K]
  ) {
    setPhaseEdits(prev => ({
      ...prev,
      [phaseId]: { ...prev[phaseId], [key]: value },
    }))
  }

  async function handleServiceSheetSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPhaseSaving(true)
    const results = await Promise.all(
      Object.entries(phaseEdits).map(([phaseId, edit]) =>
        updatePhase(id, phaseId, {
          status: edit.status,
          notes: edit.notes || null,
          started_at: edit.started_at || null,
          completed_at: edit.completed_at || null,
        })
      )
    )
    setPhaseSaving(false)
    if (results.every(Boolean)) closeServiceSheet()
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(payAmount)
    if (amt <= 0) { toast.error('Amount must be greater than zero'); return }
    const ok = await recordPayment(id, {
      phase_id: payPhaseId || null, type: payType,
      amount: amt, method: payMethod,
      reference: payRef, payment_date: payDate, note: payNote,
    })
    if (ok) {
      setActiveForm(null)
      setPayAmount(''); setPayRef(''); setPayNote(''); setPayPhaseId('')
    }
  }

  async function handleExtraSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!extraDesc.trim()) { toast.error('Description is required'); return }
    const ok = await addExtra(id, {
      type: extraType, description: extraDesc,
      fee_impact: Number(extraImpact) || 0,
      approved_by_client: extraApprove,
      date: extraDate, notes: extraNotes,
    })
    if (ok) {
      setActiveForm(null)
      setExtraDesc(''); setExtraImpact(''); setExtraNotes(''); setExtraApprove(false)
    }
  }

  async function handleMediaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mName.trim() || !mUrl.trim()) { toast.error('Name and URL required'); return }
    const ok = await linkMedia(id, { file_name: mName, file_url: mUrl, category: mCategory, file_size: null })
    if (ok) { setMediaOpen(false); setMName(''); setMUrl('') }
  }

  if (detailLoading || !projectDetail) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 overflow-y-auto [scrollbar-width:thin]">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs bg-muted border px-1.5 py-0.5 rounded font-bold tracking-wide">
              {projectDetail.project_number}
            </span>
            <h1 className="text-xl font-bold tracking-tight">{projectDetail.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {projectDetail.client.name}
            <span className="mx-2 text-border">·</span>
            {projectDetail.client.phone}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <NativeSelect
            value={projectDetail.status}
            onChange={e => updateProjectAttributes(id, { status: e.target.value as ProjectStatus })}
            className="text-xs h-8 rounded-lg shadow-none"
          >
            <NativeSelectOption value="inquiry">Inquiry</NativeSelectOption>
            <NativeSelectOption value="quoted">Quoted</NativeSelectOption>
            <NativeSelectOption value="active">Active</NativeSelectOption>
            <NativeSelectOption value="on_hold">On Hold</NativeSelectOption>
            <NativeSelectOption value="completed">Completed</NativeSelectOption>
            <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
          </NativeSelect>

          <Button
            onClick={() => updateProjectAttributes(id, { is_published: !projectDetail.is_published })}
            variant={projectDetail.is_published ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1.5 shadow-none"
          >
            <Sparkles className={cn('size-3.5', projectDetail.is_published && 'fill-current text-amber-300')} />
            {projectDetail.is_published ? 'Published' : 'Draft'}
          </Button>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT ── Roadmap + Media ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Services Roadmap ── one row per service, click to open sheet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-4 text-violet-500" />
                Services Roadmap
              </CardTitle>
              <CardDescription>
                Click a service to view and update all its phase details.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {projectDetail.services.map((serv, si) => {
                const phases = projectDetail.phases.filter(p => p.service_id === serv.id)
                const doneCount = phases.filter(p => p.status === 'completed').length
                const activePhase = phases.find(p => p.status === 'in_progress' || p.status === 'review' || p.status === 'revision')

                return (
                  <div key={serv.id}>
                    {si > 0 && <Separator />}
                    <button
                      type="button"
                      onClick={() => openServiceSheet(serv.id)}
                      className="w-full text-left px-6 py-4 hover:bg-muted/40 transition-colors flex items-center gap-4 group"
                    >
                      {/* Progress fraction */}
                      <div className="shrink-0 flex flex-col items-center justify-center size-10 rounded-full border-2 border-muted bg-muted/50 group-hover:border-violet-300 transition-colors">
                        <span className="text-[10px] font-bold tabular-nums leading-none text-foreground">
                          {doneCount}/{phases.length}
                        </span>
                      </div>

                      {/* Service name + active phase hint */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {SERVICE_LABELS[serv.service_type] || serv.service_type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {activePhase
                            ? <>Active: <span className="text-foreground/70">{activePhase.name}</span></>
                            : doneCount === phases.length && phases.length > 0
                              ? 'All phases complete'
                              : `${phases.length} phase${phases.length !== 1 ? 's' : ''}`
                          }
                        </p>
                      </div>

                      {/* Phase status pills — compact overview */}
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        {phases.map(p => {
                          const cfg = PHASE_CFG[p.status]
                          return (
                            <span
                              key={p.id}
                              title={p.name}
                              className={cn(
                                'size-2 rounded-full',
                                p.status === 'completed' && 'bg-emerald-500',
                                p.status === 'in_progress' && 'bg-blue-500',
                                (p.status === 'review' || p.status === 'revision') && 'bg-amber-400',
                                p.status === 'pending' && 'bg-muted-foreground/30',
                              )}
                            />
                          )
                        })}
                      </div>

                      {/* Fee */}
                      {serv.fee_for_service && (
                        <span className="hidden md:block text-xs font-mono font-medium text-muted-foreground shrink-0">
                          {rupee(serv.fee_for_service)}
                        </span>
                      )}

                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Media Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="size-4 text-sky-500" />
                Renderings & Drawings
              </CardTitle>
              <CardAction>
                <Button onClick={() => setMediaOpen(true)} variant="outline" size="sm">
                  <Plus className="size-3.5" /> Add Link
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {projectDetail.media.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No renderings or floor plans linked yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {projectDetail.media.map(m => (
                    <div key={m.id} className="group relative border rounded-lg overflow-hidden bg-muted/30 flex flex-col">
                      <div className="aspect-video w-full flex items-center justify-center bg-muted border-b relative">
                        {m.file_url.startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.file_url} alt={m.file_name} className="object-cover w-full h-full" />
                        ) : (
                          <FileText className="size-7 text-muted-foreground/40" />
                        )}
                        <button
                          onClick={() => unlinkMedia(id, m.id)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-0.5">
                          {m.category}
                        </span>
                        <span className="text-xs font-medium block truncate" title={m.file_name}>
                          {m.file_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT ── Billing ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Compact Financials Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-500" />
                Project Financials
              </CardTitle>
              <CardDescription>
                Overview of billings, collections, and contract status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Total Contract</span>
                <span className="font-bold font-mono text-foreground">{rupee(calculations.total)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{rupee(calculations.paid)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-semibold">Outstanding Balance</span>
                <span className={cn(
                  "font-mono font-bold px-2 py-0.5 rounded text-xs",
                  calculations.balance > 0 
                    ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" 
                    : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                )}>
                  {rupee(calculations.balance)}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => { setActiveForm(null); setFinancialsOpen(true) }} className="w-full gap-2 shadow-none">
                <FileText className="size-4" />
                View Financials
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          Sheet: Service → all its phases
      ══════════════════════════════════════════════════════════════ */}
      <Sheet open={serviceSheetOpen} onOpenChange={v => { if (!v) closeServiceSheet() }}>
        <SheetContent
          side="right"
          className="flex flex-col gap-0 p-0 m-4 rounded-xl overflow-hidden h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]"
          style={{ width: '520px', maxWidth: 'calc(96vw - 2rem)' }}
        >
          <SheetHeader className="px-6 py-5 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Layers className="size-4 text-violet-500" />
              {selectedService ? (SERVICE_LABELS[selectedService.service_type] || selectedService.service_type) : 'Service Phases'}
            </SheetTitle>
            <SheetDescription>
              Update status, dates, and notes for each phase below.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleServiceSheetSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {selectedPhases.map((phase, idx) => {
                const edit = phaseEdits[phase.id]
                if (!edit) return null
                const cfg = PHASE_CFG[edit.status]

                return (
                  <div key={phase.id}>
                    {idx > 0 && <Separator />}
                    <div className="px-6 py-5 space-y-4">
                      {/* Phase header */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{phase.name}</p>
                          {phase.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
                          )}
                        </div>
                        <Badge variant={cfg.variant} className="gap-1 shrink-0">
                          {cfg.icon}{cfg.label}
                        </Badge>
                      </div>

                      {/* Phase fields */}
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor={`status-${phase.id}`}>Status</FieldLabel>
                          <Select
                            value={edit.status}
                            onValueChange={v => setPhaseField(phase.id, 'status', v as PhaseStatus)}
                          >
                            <SelectTrigger id={`status-${phase.id}`} className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="review">Review Requested</SelectItem>
                                <SelectItem value="revision">Client Revisions</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                          <Field>
                            <FieldLabel htmlFor={`start-${phase.id}`}>Date Started</FieldLabel>
                            <Input
                              id={`start-${phase.id}`}
                              type="date"
                              value={edit.started_at}
                              onChange={e => setPhaseField(phase.id, 'started_at', e.target.value)}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`end-${phase.id}`}>Date Completed</FieldLabel>
                            <Input
                              id={`end-${phase.id}`}
                              type="date"
                              value={edit.completed_at}
                              onChange={e => setPhaseField(phase.id, 'completed_at', e.target.value)}
                            />
                          </Field>
                        </div>

                        <Field>
                          <FieldLabel htmlFor={`notes-${phase.id}`}>Notes</FieldLabel>
                          <FieldDescription>Revision requests, client feedback, internal comments.</FieldDescription>
                          <Textarea
                            id={`notes-${phase.id}`}
                            value={edit.notes}
                            onChange={e => setPhaseField(phase.id, 'notes', e.target.value)}
                            placeholder="e.g. Client requested bedroom layout revision…"
                            className="min-h-[80px] resize-none"
                          />
                        </Field>
                      </FieldGroup>
                    </div>
                  </div>
                )
              })}
            </div>

            <SheetFooter className="px-6 py-4 border-t shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={closeServiceSheet} disabled={phaseSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={phaseSaving} className="ml-auto">
                {phaseSaving ? 'Saving…' : 'Save All Phases'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ══════════════════════════════════════════════════════════════
          Sheet: Project Financials Ledger & Invoice
      ══════════════════════════════════════════════════════════════ */}
      <Sheet open={financialsOpen} onOpenChange={setFinancialsOpen}>
        <SheetContent
          side="right"
          className="flex flex-col gap-0 p-0 m-4 rounded-xl overflow-hidden h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] shadow-xl border bg-card"
          style={{ width: '640px', maxWidth: 'calc(96vw - 2rem)' }}
        >
          <SheetHeader className="px-6 py-5 border-b shrink-0 flex flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <SheetTitle className="flex items-center gap-2 text-base">
                <FileText className="size-5 text-violet-500" />
                Invoice #{projectDetail.project_number}
              </SheetTitle>
              <SheetDescription>
                {projectDetail.estimated_end_date ? `Due: ${fmtDate(projectDetail.estimated_end_date)}` : 'No due date set'}
              </SheetDescription>
            </div>
            <Badge variant={calculations.balance > 0 ? "outline" : "secondary"} className={cn("uppercase tracking-wider text-[10px]", calculations.balance > 0 ? "border-amber-500 text-amber-600 bg-amber-500/10" : "border-emerald-500 text-emerald-600 bg-emerald-500/10")}>
              {calculations.balance > 0 ? 'Pending' : 'Paid'}
            </Badge>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 [scrollbar-width:thin]">
            {!activeForm ? (
              <>
                {/* Brand & Studio Header */}
                <div className="flex justify-between items-start pb-4 border-b border-dashed border-border/80">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{SHOP.name1} {SHOP.name2} Studio</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{SHOP.tagline}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground leading-relaxed">
                    <p>{SHOP.address}</p>
                    <p>Phone: {SHOP.phone1}</p>
                  </div>
                </div>

                {/* Client & Project Info */}
                <div className="grid grid-cols-2 gap-4 bg-muted/20 border border-border/60 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Bill To</span>
                    <strong className="text-foreground text-sm block">{projectDetail.client.name}</strong>
                    <p className="text-muted-foreground mt-1">{projectDetail.client.phone}</p>
                    {projectDetail.client.email && <p className="text-muted-foreground mt-0.5 truncate">{projectDetail.client.email}</p>}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Project Site</span>
                    <strong className="text-foreground text-sm block truncate">{projectDetail.title}</strong>
                    <p className="text-muted-foreground mt-1">{projectDetail.location || 'Location not specified'}</p>
                    {(projectDetail.city || projectDetail.state) && (
                      <p className="text-muted-foreground mt-0.5">
                        {[projectDetail.city, projectDetail.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Services Allocation */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Service Scope Component</h4>
                  <div className="border border-border/60 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border/60 text-left">
                          <TableHead className="py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Service Description</TableHead>
                          <TableHead className="py-2.5 px-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-32">Allocation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectDetail.services.map(serv => (
                          <TableRow key={serv.id} className="border-b border-border/60 hover:bg-muted/10">
                            <TableCell className="py-3 px-4 text-xs font-semibold text-foreground">
                              {SERVICE_LABELS[serv.service_type] || serv.service_type}
                              {serv.notes && <span className="block text-[10px] text-muted-foreground font-normal italic mt-0.5">{serv.notes}</span>}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums text-foreground">
                              {serv.fee_for_service ? rupee(serv.fee_for_service) : rupee(0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {projectDetail.services.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="py-6 text-center text-xs text-muted-foreground italic">No services roadmap components assigned.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Extras changes */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scope Extras Log</h4>
                  <div className="border border-border/60 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border/60 text-left">
                          <TableHead className="py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-5"></TableHead>
                          <TableHead className="py-2.5 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</TableHead>
                          <TableHead className="py-2.5 px-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-32">Impact</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectDetail.extras.map(e => (
                          <TableRow key={e.id} className="border-b border-border/60 hover:bg-muted/10">
                            <TableCell className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={e.approved_by_client}
                                onChange={() => toggleExtraApproval(id, e.id, e.approved_by_client)}
                                className="size-3.5 rounded border-input accent-violet-600 shrink-0"
                              />
                            </TableCell>
                            <TableCell className="py-3 px-3 text-xs">
                              <span className={cn("font-medium text-foreground", !e.approved_by_client && "line-through text-muted-foreground")}>
                                {e.description}
                              </span>
                              <span className="block text-[10px] text-muted-foreground mt-0.5">{fmtDate(e.date)}</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-mono text-xs font-bold tabular-nums">
                              <span className={e.type === 'removal' ? 'text-rose-600' : 'text-emerald-600'}>
                                {e.type === 'removal' ? '−' : '+'}{rupee(Math.abs(e.fee_impact))}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {projectDetail.extras.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground italic">No mid-project scope modifications logged.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Payments History */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payments History</h4>
                  <div className="border border-border/60 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border/60 text-left">
                          <TableHead className="py-2.5 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Receipt No / Method</TableHead>
                          <TableHead className="py-2.5 px-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-32">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectDetail.payments.map(p => (
                          <TableRow key={p.id} className="border-b border-border/60 hover:bg-muted/10">
                            <TableCell className="py-3 px-4 text-xs">
                              <strong className="font-semibold block font-mono text-foreground">{p.payment_number}</strong>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {fmtDate(p.payment_date)} · <span className="uppercase">{p.method}</span>
                                {p.reference ? ` (${p.reference})` : ''}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right font-mono text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {rupee(p.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {projectDetail.payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="py-6 text-center text-xs text-muted-foreground italic">No payments logged yet.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Billing Summary Box */}
                <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-2.5 text-xs text-muted-foreground ml-auto w-full sm:w-[320px]">
                  <div className="flex justify-between">
                    <span>Agreed Base Fee</span>
                    <span className="font-medium text-foreground tabular-nums">{rupee(calculations.agreed)}</span>
                  </div>
                  {calculations.extras > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Approved Scope Extras</span>
                      <span className="font-medium tabular-nums">+ {rupee(calculations.extras)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold text-foreground">
                    <span>Grand Total</span>
                    <span className="tabular-nums font-mono">{rupee(calculations.total)}</span>
                  </div>
                  {calculations.paid > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Payments Received</span>
                      <span className="font-medium tabular-nums">− {rupee(calculations.paid)}</span>
                    </div>
                  )}
                  <div className={cn(
                    "flex justify-between border-t border-border/60 pt-2 text-sm font-bold rounded-lg px-2 py-1.5 mt-1",
                    calculations.balance > 0 ? "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400" : "bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400"
                  )}>
                    <span>{calculations.balance > 0 ? 'Outstanding Balance' : 'Fully Settled'}</span>
                    <span className="tabular-nums font-mono">{rupee(calculations.balance)}</span>
                  </div>
                </div>
              </>
            ) : activeForm === 'payment' ? (
              /* Inline Form: Record Payment */
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Record Client Payment
                  </h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setActiveForm(null)} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="pay-amt">Amount Received (₹)</FieldLabel>
                    <Input id="pay-amt" type="number" placeholder="e.g. 50000" value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="pay-type">Stage Type</FieldLabel>
                      <Select value={payType} onValueChange={v => setPayType(v as PaymentType)}>
                        <SelectTrigger id="pay-type" className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="advance">Advance</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="final">Final Invoice</SelectItem>
                          <SelectItem value="extra">Extra Charge</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="pay-method">Method</FieldLabel>
                      <Select value={payMethod} onValueChange={v => setPayMethod(v as PaymentMethod)}>
                        <SelectTrigger id="pay-method" className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upi">UPI / GPay</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="pay-ref">Ref / Transaction No.</FieldLabel>
                      <Input id="pay-ref" placeholder="UPI Txn or Cheque No." value={payRef} onChange={e => setPayRef(e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="pay-date">Date Received</FieldLabel>
                      <Input id="pay-date" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} required />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="pay-phase">Link to Roadmap Phase</FieldLabel>
                    <Select value={payPhaseId} onValueChange={v => setPayPhaseId(v ?? '')}>
                      <SelectTrigger id="pay-phase" className="w-full"><SelectValue placeholder="Advance / None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none_val">None / Advance</SelectItem>
                        {projectDetail.phases.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="pay-note">Payment Notes</FieldLabel>
                    <Textarea id="pay-note" placeholder="Optional bank comments/notes..." value={payNote} onChange={e => setPayNote(e.target.value)} className="min-h-[60px]" />
                  </Field>
                </FieldGroup>
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
                  <Button type="submit">Log Payment</Button>
                </div>
              </form>
            ) : (
              /* Inline Form: Log Scope Extra */
              <form onSubmit={handleExtraSubmit} className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sliders className="size-4 text-amber-500" />
                    Log Scope Modification
                  </h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setActiveForm(null)} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="extra-type">Change Type</FieldLabel>
                      <Select value={extraType} onValueChange={v => setExtraType(v as ExtraType)}>
                        <SelectTrigger id="extra-type" className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="addition">Addition (extra fee)</SelectItem>
                          <SelectItem value="removal">Removal (deduction)</SelectItem>
                          <SelectItem value="revision">Additional Revisions</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="extra-impact">Financial Impact (₹)</FieldLabel>
                      <Input id="extra-impact" type="number" placeholder="e.g. 15000" value={extraImpact} onChange={e => setExtraImpact(e.target.value)} required />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="extra-desc">Description / Items</FieldLabel>
                    <Input id="extra-desc" placeholder="e.g. Added kitchen layout detail drawing" value={extraDesc} onChange={e => setExtraDesc(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="extra-date">Date Logged</FieldLabel>
                    <Input id="extra-date" type="date" value={extraDate} onChange={e => setExtraDate(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="extra-notes">Notes</FieldLabel>
                    <Textarea id="extra-notes" placeholder="Log details, client comments..." value={extraNotes} onChange={e => setExtraNotes(e.target.value)} className="min-h-[60px]" />
                  </Field>
                  <Field orientation="horizontal">
                    <input
                      type="checkbox"
                      id="extra-approve"
                      checked={extraApprove}
                      onChange={() => setExtraApprove(!extraApprove)}
                      className="size-4 mt-0.5 rounded border-input accent-violet-600 shrink-0"
                    />
                    <FieldContent>
                      <FieldLabel htmlFor="extra-approve">Approved by client</FieldLabel>
                      <FieldDescription>Adds to billing pipeline immediately.</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setActiveForm(null)}>Cancel</Button>
                  <Button type="submit">Log Extra</Button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Actions (hidden if a sub-form is active) */}
          {!activeForm && (
            <SheetFooter className="p-4 border-t bg-muted/10 flex sm:flex-row items-center gap-2 shrink-0">
              <Button type="button" variant="outline" onClick={() => setActiveForm('extra')} className="flex-1 gap-1 h-9 text-xs">
                <Plus className="size-3.5" />
                Log Extra
              </Button>
              <Button type="button" onClick={() => setActiveForm('payment')} className="flex-1 gap-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700">
                <Plus className="size-3.5" />
                Record Payment
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ══════════════════════════════════════════════════════════════
              </Field>
              <Field>
                <FieldLabel htmlFor="extra-date">Date</FieldLabel>
                <Input id="extra-date" type="date"
                  value={extraDate} onChange={e => setExtraDate(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="extra-notes">Notes</FieldLabel>
                <Textarea id="extra-notes" placeholder="Client comments…"
                  value={extraNotes} onChange={e => setExtraNotes(e.target.value)}
                  className="min-h-[60px] resize-none" />
              </Field>
              <Field orientation="horizontal">
                <input type="checkbox" id="extra-approve"
                  checked={extraApprove} onChange={() => setExtraApprove(!extraApprove)}
                  className="size-4 mt-0.5 rounded border-input accent-violet-600 shrink-0" />
                <FieldContent>
                  <FieldLabel htmlFor="extra-approve">Approved by client</FieldLabel>
                  <FieldDescription>Adds to billing pipeline immediately.</FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExtraOpen(false)}>Cancel</Button>
              <Button type="submit">Log Extra</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          Dialog: Link Media
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="size-4 text-sky-500" />
              Link Asset
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMediaSubmit} className="space-y-4 mt-1">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="m-name">Asset Title</FieldLabel>
                <Input id="m-name" placeholder="e.g. Ground Floor Plan"
                  value={mName} onChange={e => setMName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="m-url">URL</FieldLabel>
                <Input id="m-url" placeholder="https://…"
                  value={mUrl} onChange={e => setMUrl(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="m-cat">Category</FieldLabel>
                <Select value={mCategory} onValueChange={v => setMCategory(v as MediaCategory)}>
                  <SelectTrigger id="m-cat" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Render">3D Render</SelectItem>
                    <SelectItem value="Floor Plan">Floor Plan</SelectItem>
                    <SelectItem value="Site Photo">Site Photo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMediaOpen(false)}>Cancel</Button>
              <Button type="submit">Link Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}