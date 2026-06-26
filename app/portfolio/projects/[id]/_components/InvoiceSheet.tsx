'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, Building2, User, Calendar, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectExtra, ExtraFormValues } from './types'
import { EMPTY_EXTRA_FORM } from './types'

// ─────────────────────────────────────────────────────────────────────────────

function formatINR(num: number | null) {
  if (num === null || isNaN(num)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: {
    title: string
    type: string
    city?: string | null
    state?: string | null
    year_completed?: number | null
    client?: { name?: string | null } | null
    agreed_fee?: number | null
  }
  extras: ProjectExtra[]
  baseFee: number
  approvedExtras: number
  finalTotalFee: number
  addExtra: (values: ExtraFormValues) => Promise<boolean>
  deleteExtra: (id: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────

export function InvoiceSheet({
  open, onOpenChange,
  project, extras,
  baseFee, approvedExtras, finalTotalFee,
  addExtra, deleteExtra,
}: Props) {
  const [addingExtra, setAddingExtra] = useState(false)
  const [extraValues, setExtraValues] = useState<ExtraFormValues>(EMPTY_EXTRA_FORM)
  const [extraSaving, setExtraSaving] = useState(false)

  async function handleAddExtraSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!extraValues.description.trim() || !extraValues.fee_impact) return
    setExtraSaving(true)
    const ok = await addExtra(extraValues)
    if (ok) {
      setExtraValues(EMPTY_EXTRA_FORM)
      setAddingExtra(false)
    }
    setExtraSaving(false)
  }

  function handleCancel() {
    setExtraValues(EMPTY_EXTRA_FORM)
    setAddingExtra(false)
  }

  const locationText = [project.city, project.state].filter(Boolean).join(', ')
  const invoiceNumber = `INV-${project.title.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden"
      >
        {/* Sheet Header */}
        <SheetHeader className="px-8 py-5 border-b shrink-0 bg-muted/10 dark:bg-muted/[0.02]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 shrink-0">
                <FileText className="size-4 text-indigo-500" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold leading-tight">Project Invoice</SheetTitle>
                <SheetDescription className="text-xs">
                  Financial breakdown &amp; scope ledger for <span className="font-semibold text-foreground">{project.title}</span>
                </SheetDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className="text-xs font-mono tracking-wide bg-background">
                {invoiceNumber}
              </Badge>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                Value: {formatINR(finalTotalFee)}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Invoice Document ── */}
          <div className="px-8 py-6 space-y-8">

            {/* Billed-From / Billed-To / Meta row */}
            <div className="grid grid-cols-3 gap-4">
              {/* From */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-3" /> From
                </p>
                <p className="text-sm font-bold text-foreground leading-snug">Narayani Traders</p>
                <p className="text-xs text-muted-foreground">Interior Design Studio</p>
              </div>

              {/* Client */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="size-3" /> Billed To
                </p>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {project.client?.name || '—'}
                </p>
                {locationText && (
                  <p className="text-xs text-muted-foreground">{locationText}</p>
                )}
              </div>

              {/* Meta */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3" /> Project
                </p>
                <p className="text-sm font-bold text-foreground leading-snug truncate">
                  {project.title}
                </p>
                {project.year_completed && (
                  <p className="text-xs text-muted-foreground">Year {project.year_completed}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* ── Line-items table ── */}
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="pl-5 text-xs font-semibold">Item</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-right pr-5 text-xs font-semibold">Amount</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* Base contract row */}
                  <TableRow>
                    <TableCell className="pl-5 font-medium text-sm">Base Contract</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-none">
                        Contract
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                        Approved
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-5 font-bold tabular-nums text-sm">
                      {formatINR(baseFee)}
                    </TableCell>
                  </TableRow>

                  {/* Extra rows */}
                  {extras.map((e) => (
                    <TableRow key={e.id} className="group">
                      <TableCell className="pl-5 text-sm text-muted-foreground max-w-[200px] truncate" title={e.description}>
                        {e.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] rounded-full px-2 py-0.5 border-none capitalize',
                            e.type === 'addition' && 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
                            e.type === 'removal' && 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
                            e.type === 'revision' && 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
                          )}
                        >
                          {e.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'text-xs font-semibold flex items-center gap-1',
                          e.approved_by_client
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground'
                        )}>
                          <span className={cn(
                            'size-1.5 rounded-full inline-block',
                            e.approved_by_client ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                          )} />
                          {e.approved_by_client ? 'Approved' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-2">
                          <span className={cn(
                            'font-bold tabular-nums text-sm',
                            e.fee_impact > 0 ? 'text-foreground' : 'text-emerald-600 dark:text-emerald-400'
                          )}>
                            {e.fee_impact > 0 ? '+' : ''}{formatINR(e.fee_impact)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteExtra(e.id)}
                            className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {extras.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground/50 italic">
                        No scope adjustments recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>

                {/* ── Totals footer ── */}
                <TableFooter>
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={3} className="pl-5 text-xs text-muted-foreground font-medium">
                      Scope Extras Subtotal
                    </TableCell>
                    <TableCell className="text-right pr-5 tabular-nums text-sm font-semibold text-muted-foreground">
                      {approvedExtras !== 0 ? (approvedExtras > 0 ? '+' : '') : ''}{formatINR(approvedExtras)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={3} className="pl-5 text-xs text-muted-foreground font-medium">
                      Base Contract
                    </TableCell>
                    <TableCell className="text-right pr-5 tabular-nums text-sm font-semibold text-muted-foreground">
                      {formatINR(baseFee)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="pl-5 text-sm font-bold">
                      Total Invoice
                    </TableCell>
                    <TableCell className="text-right pr-5 tabular-nums text-lg font-bold">
                      {formatINR(finalTotalFee)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* ── Add Extra Section ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-amber-500" />
                  <span className="text-sm font-bold text-foreground">Scope Adjustments</span>
                  <span className="text-xs text-muted-foreground">
                    — {extras.length} item{extras.length !== 1 ? 's' : ''} logged
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={addingExtra ? 'secondary' : 'default'}
                  onClick={() => {
                    if (addingExtra) handleCancel()
                    else setAddingExtra(true)
                  }}
                  className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5"
                >
                  {addingExtra ? (
                    <><ChevronUp className="size-3.5" /> Cancel</>
                  ) : (
                    <><Plus className="size-3.5" /> Add Extra</>
                  )}
                </Button>
              </div>

              {/* Inline Add Extra Form — expands below */}
              <div className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                addingExtra ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              )}>
                <form onSubmit={handleAddExtraSubmit}>
                  <div className="border rounded-xl bg-muted/20 p-5 space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Log New Scope Adjustment
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Adjustment Type</label>
                        <NativeSelect
                          value={extraValues.type}
                          onChange={e => setExtraValues(v => ({ ...v, type: e.target.value as any }))}
                          className="w-full text-sm"
                        >
                          <NativeSelectOption value="addition">Addition — Extra work / charges</NativeSelectOption>
                          <NativeSelectOption value="removal">Removal — Work reduction / discount</NativeSelectOption>
                          <NativeSelectOption value="revision">Revision — Excess design revisions</NativeSelectOption>
                        </NativeSelect>
                      </div>

                      {/* Date */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Log Date</label>
                        <Input
                          type="date"
                          value={extraValues.date}
                          onChange={e => setExtraValues(v => ({ ...v, date: e.target.value }))}
                          required
                          className="text-sm"
                        />
                      </div>

                      {/* Description */}
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Description</label>
                        <Input
                          value={extraValues.description}
                          onChange={e => setExtraValues(v => ({ ...v, description: e.target.value }))}
                          placeholder="e.g. Added 3D renders for master bedroom"
                          required
                          className="text-sm"
                        />
                      </div>

                      {/* Fee Impact */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Fee Impact (₹)</label>
                        <Input
                          type="number"
                          value={extraValues.fee_impact}
                          onChange={e => setExtraValues(v => ({ ...v, fee_impact: e.target.value }))}
                          placeholder="e.g. 15000 (negative for discount)"
                          required
                          className="text-sm"
                        />
                      </div>

                      {/* Client Approved */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Client Approval</label>
                        <div className="flex items-center justify-between h-9 px-3 border rounded-lg bg-background">
                          <span className="text-xs text-muted-foreground">
                            {extraValues.approved_by_client ? 'Approved — counts in total' : 'Pending — excluded from total'}
                          </span>
                          <Switch
                            checked={extraValues.approved_by_client}
                            onCheckedChange={v => setExtraValues(ev => ({ ...ev, approved_by_client: v }))}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Internal Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
                        <Textarea
                          value={extraValues.notes}
                          onChange={e => setExtraValues(v => ({ ...v, notes: e.target.value }))}
                          placeholder="Discussion context, reference thread, etc."
                          rows={2}
                          className="resize-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={extraSaving}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={extraSaving || !extraValues.description.trim() || !extraValues.fee_impact}
                        className="h-8 text-xs font-semibold"
                      >
                        {extraSaving ? 'Logging…' : 'Log Adjustment'}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
