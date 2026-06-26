'use client'

import { use, useState, useEffect } from 'react'
import { useProjectDetail } from './_components/useProjectDetail'
import { useProjects } from '../_components/useProjects'
import { useBreadcrumb } from '@/components/app-shell'
import { EMPTY_CURATION_FORM } from './_components/types'
import type { PublicCurationFormValues } from './_components/types'
import { PROJECT_TYPES } from '../_components/types'
import type { ProjectFormValues } from '../_components/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MapPin, Calendar, Users,
  DollarSign, Upload, Globe, Image as ImageIcon,
  Trash2, Info, IndianRupee, Layers,
} from 'lucide-react'

import { InvoiceSheet } from './_components/InvoiceSheet'
import { WebsiteConfigSheet } from './_components/WebsiteConfigSheet'
import { ProjectDetailSheet } from './_components/ProjectDetailSheet'
import { MediaUploadSheet } from './_components/MediaUploadSheet'
import { ProjectForm } from '../_components/ProjectForm'

function getProjectTypeName(typeVal: string) {
  const item = PROJECT_TYPES.find(t => t.value === typeVal)
  return item ? item.label : typeVal
}

function formatINR(num: number | null) {
  if (num === null || isNaN(num)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(num)
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const {
    loading, project, media, extras, publicListing, publicListingMedia,
    baseFee, approvedExtras, finalTotalFee,
    uploadMedia, deleteMedia, setAsCoverImage, addExtra, deleteExtra,
    savePublicCuration, refetch,
  } = useProjectDetail(id)

  const { clients, updateProject } = useProjects()
  const { setCustomTitle } = useBreadcrumb()

  useEffect(() => {
    if (project?.title) setCustomTitle(project.title)
  }, [project?.title, setCustomTitle])

  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false)
  const [curationSheetOpen, setCurationSheetOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const [mediaUploadOpen, setMediaUploadOpen] = useState(false)
  const [curationValues, setCurationValues] = useState<PublicCurationFormValues>(EMPTY_CURATION_FORM)
  const [curationSaving, setCurationSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setCurationValues({
        is_active: !!publicListing,
        slug: publicListing?.slug ?? project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        public_title: publicListing?.public_title ?? project.title,
        public_description: publicListing?.public_description ?? project.description ?? '',
        cover_media_id: publicListing?.cover_media_id ?? '',
        is_featured: publicListing?.is_featured ?? false,
        selected_media_ids: publicListingMedia.map(m => m.media_id),
      })
    }
  }, [project, publicListing, publicListingMedia])

  const handleCurationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCurationSaving(true)
    await savePublicCuration(curationValues)
    setCurationSaving(false)
  }

  async function handleProjectUpdate(values: ProjectFormValues, imageFile: File | null) {
    if (!project) return false
    const ok = await updateProject(project.id, values, imageFile, media)
    if (ok) await refetch()
    return ok
  }

  if (loading || !project) {
    return (
      <div className="flex flex-col gap-6 p-6 h-screen overflow-hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="flex-1 w-full rounded-xl" />
      </div>
    )
  }

  const locationText = [project.city, project.state].filter(Boolean).join(', ')

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">

      {/* ── Compact header + basic strip ── */}
      <div className="shrink-0 border-b border-border/60 bg-background relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative px-8 pt-7 pb-0">
          <div className="flex items-start justify-between gap-4 mb-4">
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
              <h1 className="text-2xl font-bold tracking-tight leading-tight truncate">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-0.5 flex-wrap justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailSheetOpen(true)}
                className="h-8 px-3 text-xs font-medium gap-1.5"
              >
                <Info className="size-3.5 text-muted-foreground" />
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaUploadOpen(true)}
                className="h-8 px-3 text-xs font-medium gap-1.5"
              >
                <Upload className="size-3.5 text-muted-foreground" />
                Upload
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

          {/* Single basic metadata strip */}
          <button
            type="button"
            onClick={() => setDetailSheetOpen(true)}
            className="w-full flex items-stretch divide-x divide-border/60 border-t border-border/40 overflow-x-auto scrollbar-none hover:bg-muted/30 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 px-6 py-4 first:pl-0 shrink-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Client</p>
                <p className="text-sm font-semibold leading-tight">{project.client?.name || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 shrink-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <MapPin className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Location</p>
                <p className="text-sm font-semibold leading-tight">{locationText || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 shrink-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Completed</p>
                <p className="text-sm font-semibold leading-tight">{project.year_completed ?? 'Ongoing'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 shrink-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <IndianRupee className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Agreed fee</p>
                <p className="text-sm font-semibold leading-tight tabular-nums">{formatINR(project.agreed_fee)}</p>
              </div>
            </div>
            <div className="flex items-center px-4 py-4 shrink-0 ml-auto">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                View all details →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Media grid ── */}
      <div className="flex-1 overflow-y-auto p-8">
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-card">
            <ImageIcon className="size-12 text-muted-foreground/20 mb-3" />
            <h4 className="font-semibold text-sm">No photos uploaded yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Upload photos to build this project&apos;s visual log.
            </p>
            <Button onClick={() => setMediaUploadOpen(true)} variant="outline" className="mt-4 text-xs rounded-lg h-8 gap-1.5">
              <Upload className="size-3.5" /> Upload photo
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
                          Make cover
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
                    <p className="p-3 text-[11px] font-semibold leading-tight truncate">{m.caption}</p>
                  ) : (
                    <p className="p-3 text-[10px] text-muted-foreground/60 italic font-medium">No caption</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ProjectDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        project={project}
        mediaCount={media.length}
        publicListing={publicListing}
        baseFee={baseFee}
        approvedExtras={approvedExtras}
        finalTotalFee={finalTotalFee}
        onEdit={() => setFormOpen(true)}
        onOpenInvoice={() => setInvoiceSheetOpen(true)}
        onOpenShowcase={() => setCurationSheetOpen(true)}
      />

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

      <WebsiteConfigSheet
        open={curationSheetOpen}
        onOpenChange={setCurationSheetOpen}
        curationValues={curationValues}
        setCurationValues={setCurationValues}
        media={media}
        curationSaving={curationSaving}
        onSubmit={handleCurationSubmit}
      />

      <ProjectForm
        open={formOpen}
        project={project}
        clients={clients}
        onClose={() => setFormOpen(false)}
        onSubmit={handleProjectUpdate}
      />

      <MediaUploadSheet
        open={mediaUploadOpen}
        onOpenChange={setMediaUploadOpen}
        uploadMedia={uploadMedia}
      />
    </div>
  )
}
