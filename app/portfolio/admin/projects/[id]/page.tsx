'use client'

import React, { use, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolio } from '../../../_components/usePortfolio'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Plus,
  IndianRupee,
  Calendar,
  Layers,
  Sparkles,
  User,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  FileText,
  Sliders,
  DollarSign,
  Briefcase
} from 'lucide-react'
import { toast } from 'sonner'
import type { ProjectPhase, ProjectExtra, ProjectPayment, ProjectMedia, PhaseStatus, ExtraType, PaymentType, PaymentMethod, MediaCategory, ProjectStatus } from '../../../_components/types'

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residential Architecture',
  commercial: 'Commercial Space',
  interior: 'Interior Design',
  visualization_only: '3D Visualization Only',
  renovation: 'Renovation & Restoration',
}

const SERVICE_LABELS: Record<string, string> = {
  design_drawings: 'Drawings & Site Surveys',
  visualization_3d: '3D Renders & Walkthrough',
  construction_supervision: 'Site Supervision',
  interior_design: 'Interior Styling',
  renovation: 'Renovation Drafting',
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>
}

function Label({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-foreground/80">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const {
    projectDetail,
    detailLoading,
    fetchProjectDetail,
    updateProjectAttributes,
    updatePhase,
    recordPayment,
    addExtra,
    toggleExtraApproval,
    linkMedia,
    unlinkMedia,
  } = usePortfolio()

  // ── Modals Trigger States ──
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [extraOpen,   setExtraOpen]   = useState(false)
  const [phaseOpen,   setPhaseOpen]   = useState(false)
  const [mediaOpen,   setMediaOpen]   = useState(false)

  // ── Active Selected Item States for Editing ──
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null)

  // ── Payment Form Input States ──
  const [payAmount,    setPayAmount]    = useState('')
  const [payType,      setPayType]      = useState<PaymentType>('milestone')
  const [payMethod,    setPayMethod]    = useState<PaymentMethod>('upi')
  const [payRef,       setPayRef]       = useState('')
  const [payDate,      setPayDate]      = useState(new Date().toISOString().slice(0, 10))
  const [payNote,      setPayNote]      = useState('')
  const [payPhaseId,   setPayPhaseId]   = useState('')

  // ── Extras Form Input States ──
  const [extraType,    setExtraType]    = useState<ExtraType>('addition')
  const [extraDesc,    setExtraDesc]    = useState('')
  const [extraImpact,  setExtraImpact]  = useState('')
  const [extraDate,    setExtraDate]    = useState(new Date().toISOString().slice(0, 10))
  const [extraNotes,   setExtraNotes]   = useState('')
  const [extraApprove, setExtraApprove] = useState(false)

  // ── Phase Form Input States ──
  const [phaseStatus,  setPhaseStatus]  = useState<PhaseStatus>('pending')
  const [phaseNotes,   setPhaseNotes]   = useState('')
  const [phaseStart,   setPhaseStart]   = useState('')
  const [phaseEnd,     setPhaseEnd]     = useState('')

  // ── Media Form Input States ──
  const [mName,        setMName]        = useState('')
  const [mUrl,         setMUrl]         = useState('')
  const [mCategory,    setMCategory]    = useState<MediaCategory>('Render')

  // Load project details on mount / ID change
  useEffect(() => {
    if (id) fetchProjectDetail(id)
  }, [id, fetchProjectDetail])

  // Setup phase form when selectedPhase changes
  useEffect(() => {
    if (selectedPhase) {
      setPhaseStatus(selectedPhase.status)
      setPhaseNotes(selectedPhase.notes || '')
      setPhaseStart(selectedPhase.started_at || '')
      setPhaseEnd(selectedPhase.completed_at || '')
    }
  }, [selectedPhase])

  // ── Aggregate calculations ──
  const calculations = useMemo(() => {
    if (!projectDetail) return { agreed: 0, extras: 0, total: 0, paid: 0, balance: 0 }
    const agreed = projectDetail.agreed_fee || 0
    const extras = projectDetail.extras
      .filter(e => e.approved_by_client)
      .reduce((sum, e) => sum + Number(e.fee_impact), 0)
    
    const total = agreed + extras
    const paid = projectDetail.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balance = Math.max(0, total - paid)

    return { agreed, extras, total, paid, balance }
  }, [projectDetail])

  // Phase Status Node styling helper
  const getNodeStyles = (status: PhaseStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-700'
      case 'in_progress':
        return 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-300 ring-2 ring-blue-500/20 animate-pulse'
      case 'review':
      case 'revision':
        return 'bg-amber-50 border-amber-500 text-amber-600 dark:bg-amber-950/40 dark:border-amber-400 dark:text-amber-300'
      default:
        return 'bg-slate-50 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600'
    }
  }

  // Phase icon helper
  const renderNodeIcon = (status: PhaseStatus, index: number) => {
    if (status === 'completed') {
      return <Check className="size-3.5 stroke-[3]" />
    }
    if (status === 'in_progress') {
      return <Clock className="size-3.5" />
    }
    if (status === 'review' || status === 'revision') {
      return <AlertTriangle className="size-3.5" />
    }
    return <span className="text-[10px]">{index + 1}</span>
  }

  // Handle Payment Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(payAmount) || 0
    if (amt <= 0) {
      toast.error('Amount must be greater than zero')
      return
    }

    const success = await recordPayment(id, {
      phase_id: payPhaseId || null,
      type: payType,
      amount: amt,
      method: payMethod,
      reference: payRef,
      payment_date: payDate,
      note: payNote
    })

    if (success) {
      setPaymentOpen(false)
      setPayAmount('')
      setPayRef('')
      setPayNote('')
      setPayPhaseId('')
    }
  }

  // Handle Extra Submit
  const handleExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extraDesc.trim()) {
      toast.error('Description is required')
      return
    }

    const success = await addExtra(id, {
      type: extraType,
      description: extraDesc,
      fee_impact: Number(extraImpact) || 0,
      approved_by_client: extraApprove,
      date: extraDate,
      notes: extraNotes
    })

    if (success) {
      setExtraOpen(false)
      setExtraDesc('')
      setExtraImpact('')
      setExtraNotes('')
      setExtraApprove(false)
    }
  }

  // Handle Phase Edit Submit
  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPhase) return

    const success = await updatePhase(id, selectedPhase.id, {
      status: phaseStatus,
      notes: phaseNotes || null,
      started_at: phaseStart || null,
      completed_at: phaseEnd || null
    })

    if (success) {
      setPhaseOpen(false)
      setSelectedPhase(null)
    }
  }

  // Handle Media attachment Submit
  const handleMediaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mName.trim() || !mUrl.trim()) {
      toast.error('Asset name and URL are required')
      return
    }

    const success = await linkMedia(id, {
      file_name: mName,
      file_url: mUrl,
      category: mCategory,
      file_size: null
    })

    if (success) {
      setMediaOpen(false)
      setMName('')
      setMUrl('')
    }
  }

  if (detailLoading || !projectDetail) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto [scrollbar-width:thin] bg-background">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b pb-4">
        <div className="flex items-start gap-3">
          <Button
            onClick={() => router.push('/portfolio/admin/projects')}
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs bg-muted border px-1.5 py-0.5 rounded font-bold">
                {projectDetail.project_number}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {projectDetail.title}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Client: <span className="font-semibold text-foreground/80">{projectDetail.client.name}</span> &nbsp;·&nbsp; Phone: {projectDetail.client.phone}
            </p>
          </div>
        </div>

        {/* Action Controls (Status Switcher & Portfolios publish toggle) */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Status Select */}
          <NativeSelect
            value={projectDetail.status}
            onChange={(e) => updateProjectAttributes(id, { status: e.target.value as ProjectStatus })}
            className="rounded-lg shadow-none text-xs h-8"
          >
            <NativeSelectOption value="inquiry">Inquiry</NativeSelectOption>
            <NativeSelectOption value="quoted">Quoted</NativeSelectOption>
            <NativeSelectOption value="active">Active</NativeSelectOption>
            <NativeSelectOption value="on_hold">On Hold</NativeSelectOption>
            <NativeSelectOption value="completed">Completed</NativeSelectOption>
            <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
          </NativeSelect>

          {/* Published toggle */}
          <Button
            onClick={() => updateProjectAttributes(id, { is_published: !projectDetail.is_published })}
            variant={projectDetail.is_published ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1 shadow-none"
          >
            <Sparkles className={cn("size-3.5", projectDetail.is_published ? "fill-current animate-pulse text-amber-300" : "")} />
            {projectDetail.is_published ? 'Published' : 'Draft'}
          </Button>
        </div>
      </div>

      {/* ── Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Roadmap and Execution stages */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Roadmaps container */}
          <div className="border rounded-xl p-5 bg-card space-y-6">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Layers className="size-4 text-violet-500" />
                Interactive Services Roadmap
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                Click any circle node below to log details, progress timestamps, or client comments.
              </p>
            </div>

            {/* Loop through project services */}
            <div className="space-y-8">
              {projectDetail.services.map((serv) => {
                const phases = projectDetail.phases.filter(p => p.service_id === serv.id)
                return (
                  <div key={serv.id} className="space-y-4 border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg border">
                      <span className="text-xs font-semibold text-foreground/90">
                        {SERVICE_LABELS[serv.service_type] || serv.service_type}
                      </span>
                      {serv.fee_for_service && (
                        <span className="text-[10px] font-bold text-muted-foreground font-mono">
                          Allocation: {rupee(serv.fee_for_service)}
                        </span>
                      )}
                    </div>

                    {/* Nodes flow layout */}
                    <div className="relative pt-4 pb-8 px-4 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none]">
                      
                      {/* Flex wrapper for circles */}
                      <div className="flex items-center justify-between w-full relative">
                        {/* Connecting Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted z-0" />

                        {phases.map((p, idx) => {
                          const nodeStyle = getNodeStyles(p.status)
                          return (
                            <div key={p.id} className="flex flex-col items-center relative z-10 shrink-0 select-none">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPhase(p)
                                  setPhaseOpen(true)
                                }}
                                className={cn(
                                  "size-10 rounded-full flex items-center justify-center border-2 font-bold cursor-pointer transition-all hover:scale-105 duration-200 text-xs shadow-xs shrink-0",
                                  nodeStyle
                                )}
                                title={`Phase: ${p.name} (${p.status})`}
                              >
                                {renderNodeIcon(p.status, idx)}
                              </button>
                              <span className="absolute top-12 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-center w-20 truncate text-foreground/80 leading-tight">
                                {p.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Media Attachments gallery */}
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <LinkIcon className="size-4 text-sky-500" />
                Renderings & Floor Plans
              </h3>
              <Button onClick={() => setMediaOpen(true)} variant="outline" size="sm" className="h-7 text-[10px] gap-1 shadow-none">
                <Plus className="size-3" /> Add Link
              </Button>
            </div>

            {projectDetail.media.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic">
                No renderings, floor plans, or site photos linked yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {projectDetail.media.map(m => (
                  <div key={m.id} className="group relative border rounded-lg overflow-hidden bg-muted/30 flex flex-col justify-between">
                    {/* Image preview or icon wrapper */}
                    <div className="aspect-video w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border-b relative">
                      {m.file_url.startsWith('http') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.file_url} alt={m.file_name} className="object-cover w-full h-full" />
                      ) : (
                        <FileText className="size-8 text-muted-foreground/40" />
                      )}
                      
                      {/* Delete action overlay */}
                      <button
                        onClick={() => unlinkMedia(id, m.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete attachment"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="p-2 space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none block">
                        {m.category}
                      </span>
                      <span className="text-xs font-semibold text-foreground/90 leading-tight block truncate" title={m.file_name}>
                        {m.file_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Receivables ledger, extras & payment records */}
        <div className="space-y-6">
          
          {/* receivables ledger */}
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5 border-b pb-2">
              <DollarSign className="size-4 text-emerald-500" />
              Financial Ledger
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Agreed Fee</span>
                <span className="font-semibold text-foreground font-mono">{rupee(calculations.agreed)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Approved Scope Changes</span>
                <span className="font-semibold text-foreground font-mono">+ {rupee(calculations.extras)}</span>
              </div>
              <div className="flex justify-between border-t pt-2.5 font-bold text-sm text-foreground">
                <span>Total Fee Pipeline</span>
                <span className="font-mono">{rupee(calculations.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Amount Received</span>
                <span className="font-semibold font-mono">− {rupee(calculations.paid)}</span>
              </div>

              {/* Balance Card */}
              <div className={cn(
                "flex justify-between border-t pt-3 font-bold rounded-lg px-2.5 py-2 mt-1",
                calculations.balance > 0 ? "bg-amber-50/50 dark:bg-amber-950/15 text-amber-600 dark:text-amber-400" : "bg-emerald-50/50 dark:bg-emerald-950/15 text-emerald-600 dark:text-emerald-400"
              )}>
                <span>{calculations.balance > 0 ? 'Receivables Balance' : 'Fully Settled'}</span>
                <span className="font-mono">{rupee(calculations.balance)}</span>
              </div>
            </div>
          </div>

          {/* Extras and mid-scope changes */}
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Scope Extras Log</h3>
              <Button onClick={() => setExtraOpen(true)} variant="outline" size="sm" className="h-7 text-[10px] gap-1 shadow-none">
                <Plus className="size-3" /> Log Extra
              </Button>
            </div>

            <div className="space-y-3.5">
              {projectDetail.extras.length === 0 ? (
                <div className="py-2 text-center text-xs text-muted-foreground italic">
                  No mid-project scope modifications logged.
                </div>
              ) : (
                projectDetail.extras.map(e => {
                  const isNegative = e.type === 'removal'
                  return (
                    <div key={e.id} className="flex justify-between items-center gap-3 text-xs border bg-muted/10 p-2.5 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        {/* Approval toggle */}
                        <input
                          type="checkbox"
                          checked={e.approved_by_client}
                          onChange={() => toggleExtraApproval(id, e.id, e.approved_by_client)}
                          className="size-4 rounded border-input text-violet-600 focus:ring-violet-500 shrink-0"
                          title="Client approved?"
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className={cn("font-semibold leading-tight", !e.approved_by_client && "text-muted-foreground line-through")}>
                            {e.description}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {fmtDate(e.date)} · <span className="capitalize">{e.type}</span>
                          </span>
                        </div>
                      </div>
                      <span className={cn(
                        "font-bold font-mono text-xs tabular-nums shrink-0",
                        isNegative ? "text-rose-600" : "text-emerald-600"
                      )}>
                        {isNegative ? '−' : '+'}{rupee(Math.abs(e.fee_impact))}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Payments list ledger */}
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Payments History</h3>
              <Button onClick={() => setPaymentOpen(true)} variant="outline" size="sm" className="h-7 text-[10px] gap-1 shadow-none">
                <Plus className="size-3" /> Record
              </Button>
            </div>

            <div className="space-y-3.5">
              {projectDetail.payments.length === 0 ? (
                <div className="py-2 text-center text-xs text-muted-foreground italic">
                  No payments logged yet.
                </div>
              ) : (
                projectDetail.payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center gap-3 text-xs border bg-muted/10 p-2.5 rounded-lg">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-foreground font-mono leading-none">
                        {p.payment_number}
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-1">
                        {fmtDate(p.payment_date)} · <span className="uppercase">{p.method}</span>
                      </span>
                    </div>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {rupee(p.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── Dialog 1: Record Payment ── */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Record Client Payment
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4 my-2">
            <Field>
              <Label required>Amount Received (₹)</Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label required>Payment Stage</Label>
                <NativeSelect value={payType} onChange={(e: any) => setPayType(e.target.value)}>
                  <NativeSelectOption value="advance">Advance</NativeSelectOption>
                  <NativeSelectOption value="milestone">Milestone</NativeSelectOption>
                  <NativeSelectOption value="final">Final Invoice</NativeSelectOption>
                  <NativeSelectOption value="extra">Extra Charge</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <Label required>Method</Label>
                <NativeSelect value={payMethod} onChange={(e: any) => setPayMethod(e.target.value)}>
                  <NativeSelectOption value="upi">UPI / GPay</NativeSelectOption>
                  <NativeSelectOption value="bank_transfer">Bank NEFT</NativeSelectOption>
                  <NativeSelectOption value="cash">Cash</NativeSelectOption>
                  <NativeSelectOption value="cheque">Cheque</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Transaction / Ref Number</Label>
                <Input
                  placeholder="UPI Txn ID or Cheque No."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </Field>
              <Field>
                <Label required>Date Received</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* Optional phase linkage */}
            <Field>
              <Label>Link to Roadmap Stage</Label>
              <NativeSelect value={payPhaseId} onChange={(e) => setPayPhaseId(e.target.value)}>
                <NativeSelectOption value="">Advance/None</NativeSelectOption>
                {projectDetail.phases.map(p => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <Label>Payment Notes</Label>
              <Textarea
                placeholder="Record notes, bank comments..."
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="min-h-[50px]"
              />
            </Field>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: Add Scope Extra change ── */}
      <Dialog open={extraOpen} onOpenChange={setExtraOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <Sliders className="size-4 text-amber-500" />
              Log Scope Modification
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExtraSubmit} className="space-y-4 my-2">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label required>Change Type</Label>
                <NativeSelect value={extraType} onChange={(e: any) => setExtraType(e.target.value)}>
                  <NativeSelectOption value="addition">Addition (extra fee)</NativeSelectOption>
                  <NativeSelectOption value="removal">Removal (deduction)</NativeSelectOption>
                  <NativeSelectOption value="revision">Additional Revisions</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <Label required>Financial Impact (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  value={extraImpact}
                  onChange={(e) => setExtraImpact(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field>
              <Label required>Description / Items</Label>
              <Input
                placeholder="e.g. Added electrical layouts of Kitchen"
                value={extraDesc}
                onChange={(e) => setExtraDesc(e.target.value)}
                required
              />
            </Field>

            <Field>
              <Label required>Date Logged</Label>
              <Input
                type="date"
                value={extraDate}
                onChange={(e) => setExtraDate(e.target.value)}
                required
              />
            </Field>

            <Field>
              <Label>Revisions Brief / Notes</Label>
              <Textarea
                placeholder="Log client comments, details..."
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                className="min-h-[50px]"
              />
            </Field>

            {/* Approved by default */}
            <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={extraApprove}
                onChange={() => setExtraApprove(!extraApprove)}
                className="size-4 rounded border-input text-violet-600 focus:ring-violet-500 shrink-0"
              />
              <span className="text-xs font-semibold text-foreground/80">Approved by client? (adds to billing pipeline immediately)</span>
            </label>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setExtraOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log Extra</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 3: Edit Roadmap Phase Stage ── */}
      <Dialog open={phaseOpen} onOpenChange={setPhaseOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <Clock className="size-4 text-violet-500" />
              Update Roadmap Stage
            </DialogTitle>
          </DialogHeader>
          {selectedPhase && (
            <form onSubmit={handlePhaseSubmit} className="space-y-4 my-2">
              <div className="bg-muted/40 p-3 border rounded-lg text-xs space-y-1">
                <p className="font-bold text-foreground">{selectedPhase.name}</p>
                {selectedPhase.description && (
                  <p className="text-muted-foreground">{selectedPhase.description}</p>
                )}
              </div>

              <Field>
                <Label required>Execution Status</Label>
                <NativeSelect value={phaseStatus} onChange={(e: any) => setPhaseStatus(e.target.value)}>
                  <NativeSelectOption value="pending">Pending</NativeSelectOption>
                  <NativeSelectOption value="in_progress">In Progress</NativeSelectOption>
                  <NativeSelectOption value="review">Review Requested</NativeSelectOption>
                  <NativeSelectOption value="revision">Client Revisions</NativeSelectOption>
                  <NativeSelectOption value="completed">Completed & Done</NativeSelectOption>
                </NativeSelect>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <Label>Date Started</Label>
                  <Input
                    type="date"
                    value={phaseStart}
                    onChange={(e) => setPhaseStart(e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Date Completed</Label>
                  <Input
                    type="date"
                    value={phaseEnd}
                    onChange={(e) => setPhaseEnd(e.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <Label>Revision notes / Comments</Label>
                <Textarea
                  placeholder="Record client revision logs, structural comments..."
                  value={phaseNotes}
                  onChange={(e) => setPhaseNotes(e.target.value)}
                  className="min-h-[60px]"
                />
              </Field>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => { setPhaseOpen(false); setSelectedPhase(null) }}>
                  Cancel
                </Button>
                <Button type="submit">Save Stage</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog 4: Add Media link ── */}
      <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <LinkIcon className="size-4 text-sky-500" />
              Link Asset Image / Drawing URL
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMediaSubmit} className="space-y-4 my-2">
            <Field>
              <Label required>Asset Title / Filename</Label>
              <Input
                placeholder="e.g. Ground Floor Plan, living render"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                required
              />
            </Field>

            <Field>
              <Label required>Asset URL / Link path</Label>
              <Input
                placeholder="e.g. https://image-url-path.com/render.jpg"
                value={mUrl}
                onChange={(e) => setMUrl(e.target.value)}
                required
              />
            </Field>

            <Field>
              <Label required>File Category</Label>
              <NativeSelect value={mCategory} onChange={(e: any) => setMCategory(e.target.value)}>
                <NativeSelectOption value="Render">3D Render</NativeSelectOption>
                <NativeSelectOption value="Floor Plan">Floor Plan Drawing</NativeSelectOption>
                <NativeSelectOption value="Site Photo">Site Progress Photo</NativeSelectOption>
              </NativeSelect>
            </Field>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setMediaOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Link Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
