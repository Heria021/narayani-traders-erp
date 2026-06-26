'use client'

import { use, useState, useEffect } from 'react'
import { useProjectDetail } from './_components/useProjectDetail'
import { useBreadcrumb } from '@/components/app-shell'
import {
  EMPTY_CURATION_FORM,
} from './_components/types'
import type { PublicCurationFormValues } from './_components/types'
import { PROJECT_TYPES } from '../_components/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  MapPin, Calendar, Users,
  DollarSign, Upload, Globe, Image as ImageIcon,
  Building2, Layers, Trash2, Ruler
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { InvoiceSheet } from './_components/InvoiceSheet'
import { WebsiteConfigSheet } from './_components/WebsiteConfigSheet'

// ─────────────────────────────────────────────────────────────────────────────

function getProjectTypeName(typeVal: string) {
  const item = PROJECT_TYPES.find(t => t.value === typeVal)
  return item ? item.label : typeVal
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const {
    loading, project, media, extras, publicListing, publicListingMedia,
    baseFee, approvedExtras, finalTotalFee,
    uploadMedia, deleteMedia, setAsCoverImage, addExtra, deleteExtra,
    savePublicCuration
  } = useProjectDetail(id)

  const { setCustomTitle } = useBreadcrumb()

  useEffect(() => {
    if (project?.title) {
      setCustomTitle(project.title)
    }
  }, [project?.title, setCustomTitle])

  // ── Sheet States ──────────────────────────────────────────────────────────
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false)
  const [curationSheetOpen, setCurationSheetOpen] = useState(false)

  // ── Media Upload State ─────────────────────────────────────────────────────
  const [mediaUploadOpen, setMediaUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaCaption, setMediaCaption] = useState('')

  // ── Curation Form State ────────────────────────────────────────────────────
  const [curationValues, setCurationValues] = useState<PublicCurationFormValues>(EMPTY_CURATION_FORM)
  const [curationSaving, setCurationSaving] = useState(false)

  // Load curation settings from DB when project loads
  useEffect(() => {
    if (project) {
      setCurationValues({
        is_active: !!publicListing,
        slug: publicListing?.slug ?? project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        public_title: publicListing?.public_title ?? project.title,
        public_description: publicListing?.public_description ?? project.description ?? '',
        cover_media_id: publicListing?.cover_media_id ?? '',
        is_featured: publicListing?.is_featured ?? false,
        selected_media_ids: publicListingMedia.map(m => m.media_id)
      })
    }
  }, [project, publicListing, publicListingMedia])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mediaFile) return
    setUploading(true)
    const ok = await uploadMedia(mediaFile, mediaCaption)
    if (ok) {
      setMediaFile(null)
      setMediaCaption('')
      setMediaUploadOpen(false)
    }
    setUploading(false)
  }

  const handleCurationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCurationSaving(true)
    await savePublicCuration(curationValues)
    setCurationSaving(false)
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || !project) {
    return (
      <div className="flex flex-col gap-6 p-6 h-screen overflow-hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  const locationText = [project.city, project.state].filter(Boolean).join(', ')

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">

      {/* ══ PROJECT HEADER ════════════════════════════════════════════════════ */}
      <div className="shrink-0 border-b border-border/60 bg-background relative overflow-hidden">
        {/* Subtle architectural dot-grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative px-8 pt-7 pb-0">
          {/* ── Top row: badge + actions ── */}
          <div className="flex items-start justify-between gap-4 mb-4">
            {/* Left: type badge + title */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-none"
                >
                  <Layers className="size-2.5 mr-1" />
                  {getProjectTypeName(project.type)}
                </Badge>
                {publicListing && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
                    Live
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight truncate">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaUploadOpen(true)}
                className="h-8 px-3 text-xs font-medium gap-1.5"
              >
                <Upload className="size-3.5 text-muted-foreground" />
                Upload Media
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoiceSheetOpen(true)}
                className="h-8 px-3 text-xs font-medium gap-1.5"
              >
                <DollarSign className="size-3.5 text-muted-foreground" />
                Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurationSheetOpen(true)}
                className="h-8 px-3 text-xs font-medium gap-1.5"
              >
                <Globe className="size-3.5 text-muted-foreground" />
                Showcase
              </Button>
            </div>
          </div>

          {/* ── Metadata Strip 1: General Info ── */}
          <div className="flex items-stretch divide-x divide-border/60 border-t border-border/40 overflow-x-auto scrollbar-none">
            {/* Client */}
            <div className="flex items-center gap-3 px-6 py-4 first:pl-0 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Client</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {project.client?.name || 'Not Assigned'}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <MapPin className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Location</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {locationText || 'Not Specified'}
                </p>
              </div>
            </div>

            {/* Completion */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Completed</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {project.year_completed ?? 'Ongoing'}
                </p>
              </div>
            </div>

            {/* Project type */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Building2 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Type</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {getProjectTypeName(project.type)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Metadata Strip 2: Specs & Media ── */}
          <div className="flex items-stretch divide-x divide-border/60 border-t border-border/40 overflow-x-auto scrollbar-none bg-muted/5 dark:bg-muted/[0.01]">
            {/* Area */}
            <div className="flex items-center gap-3 px-6 py-4 first:pl-0 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Ruler className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Area</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {project.area_sqft ? `${Math.round(project.area_sqft).toLocaleString('en-IN')} ft²` : '—'}
                </p>
              </div>
            </div>

            {/* Floors */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Layers className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Floors</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {project.floors != null ? project.floors : '—'}
                </p>
              </div>
            </div>

            {/* Configuration */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Building2 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Config</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {project.configuration || '—'}
                </p>
              </div>
            </div>

            {/* Media count */}
            <div className="flex items-center gap-3 px-6 py-4 shrink-0 group">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <ImageIcon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Media</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {media.length} photo{media.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN BODY: Media Pool Grid ════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-8">
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-card">
            <ImageIcon className="size-12 text-muted-foreground/20 mb-3" />
            <h4 className="font-semibold text-sm">No photos uploaded yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Click on &ldquo;Upload Media&rdquo; to attach photos to this project.
            </p>
            <Button
              onClick={() => setMediaUploadOpen(true)}
              variant="outline"
              className="mt-4 text-xs rounded-lg h-8 gap-1.5"
            >
              <Upload className="size-3.5" /> Upload Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {media.map(m => {
              const isCover = m.sort_order === 0
              return (
                <div
                  key={m.id}
                  className="group relative border border-border/80 rounded-xl overflow-hidden bg-card flex flex-col hover:shadow-md hover:border-foreground/20 transition-all duration-300"
                >
                  <div className="aspect-video w-full relative bg-muted border-b overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.file_url}
                      alt={m.caption || 'Project Media'}
                      className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-500"
                    />
                    {isCover && (
                      <Badge className="absolute top-3 right-3 text-[9px] font-semibold py-0.5 tracking-wider uppercase bg-amber-500 hover:bg-amber-500 text-white border-none rounded">
                        Cover
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      {!isCover && (
                        <Button
                          type="button"
                          onClick={() => setAsCoverImage(m)}
                          size="sm"
                          className="h-7 text-[10px] bg-white text-black hover:bg-white/90 rounded-md font-semibold px-2.5"
                        >
                          Make Cover
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => deleteMedia(m)}
                        variant="destructive"
                        size="icon-sm"
                        className="size-7 rounded-md"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  {m.caption ? (
                    <p className="p-3 text-[11px] text-neutral-800 dark:text-neutral-200 font-semibold leading-tight truncate">
                      {m.caption}
                    </p>
                  ) : (
                    <p className="p-3 text-[10px] text-muted-foreground/60 italic font-medium">
                      No caption recorded
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ INVOICE SHEET ════════════════════════════════════════════════════ */}
      <InvoiceSheet
        open={invoiceSheetOpen}
        onOpenChange={setInvoiceSheetOpen}
        project={project}
        extras={extras}
        baseFee={baseFee}
        approvedExtras={approvedExtras}
        finalTotalFee={finalTotalFee}
        addExtra={addExtra}
        deleteExtra={deleteExtra}
      />

      {/* ══ WEBSITE CONFIG SHEET ═════════════════════════════════════════════ */}
      <WebsiteConfigSheet
        open={curationSheetOpen}
        onOpenChange={setCurationSheetOpen}
        curationValues={curationValues}
        setCurationValues={setCurationValues}
        media={media}
        curationSaving={curationSaving}
        onSubmit={handleCurationSubmit}
      />

      {/* ══ DIALOG: Upload Project Media ══════════════════════════════════ */}
      <Dialog open={mediaUploadOpen} onOpenChange={setMediaUploadOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden border shadow-lg">
          <DialogHeader className="px-7 py-5 border-b bg-muted/20">
            <DialogTitle className="text-base font-bold">Upload Project Media</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an image file and attach it to this project&apos;s visual log.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload}>
            <div className="px-7 py-6 space-y-5">
              {/* File Select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground/70">Select File</label>
                <div className="border-2 border-dashed border-input rounded-xl p-8 bg-muted/10 hover:bg-muted/25 transition-colors relative cursor-pointer flex flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setMediaFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  <Upload className="size-7 text-muted-foreground/50" />
                  <span className="text-sm font-medium">
                    {mediaFile ? mediaFile.name : 'Click or drag to upload'}
                  </span>
                  <span className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP</span>
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground/70">Caption <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Input
                  value={mediaCaption}
                  onChange={e => setMediaCaption(e.target.value)}
                  placeholder="e.g. Front elevation view, finished modular kitchen"
                  className="text-sm"
                />
              </div>
            </div>

            <DialogFooter className="px-7 py-4 border-t bg-muted/10">
              <Button type="button" variant="outline" onClick={() => setMediaUploadOpen(false)} disabled={uploading} className="text-xs h-8">
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !mediaFile} className="text-xs h-8 font-semibold">
                {uploading ? 'Uploading…' : 'Upload File'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
