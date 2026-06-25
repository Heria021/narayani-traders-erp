'use client'

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Badge } from '@/components/ui/badge'
import {
  Globe, Sparkles, Image as ImageIcon, Info, CheckCircle, Hash, Type, AlignLeft, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PublicCurationFormValues } from './types'

// ─────────────────────────────────────────────────────────────────────────────

interface ProjectMedia {
  id: string
  file_url: string
  caption: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  curationValues: PublicCurationFormValues
  setCurationValues: React.Dispatch<React.SetStateAction<PublicCurationFormValues>>
  media: ProjectMedia[]
  curationSaving: boolean
  onSubmit: (e: React.FormEvent) => void
}

// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, description
}: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/5 border shrink-0 mt-0.5">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function WebsiteConfigSheet({
  open, onOpenChange,
  curationValues, setCurationValues,
  media, curationSaving, onSubmit,
}: Props) {

  function toggleMedia(mediaId: string) {
    setCurationValues(v => {
      const exists = v.selected_media_ids.includes(mediaId)
      const nextList = exists
        ? v.selected_media_ids.filter(id => id !== mediaId)
        : [...v.selected_media_ids, mediaId]
      let nextCover = v.cover_media_id
      if (exists && v.cover_media_id === mediaId) nextCover = ''
      return { ...v, selected_media_ids: nextList, cover_media_id: nextCover }
    })
  }

  const canSave = !(
    curationValues.is_active &&
    curationValues.selected_media_ids.length > 0 &&
    !curationValues.cover_media_id
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-8 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20">
              <Globe className="size-4 text-indigo-500" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold leading-tight">Public Website Config</SheetTitle>
              <SheetDescription className="text-xs">Control how this project appears on the portfolio website</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">

            {/* ── Section 1: Publication Status ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionHeader
                icon={Globe}
                title="Publication Status"
                description="Control whether this project is visible on the public portfolio website."
              />
              <div className={cn(
                'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
                curationValues.is_active
                  ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/20 dark:bg-indigo-500/5'
                  : 'border-border bg-muted/20'
              )}>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold leading-tight">
                    {curationValues.is_active ? 'Live on website' : 'Not published'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {curationValues.is_active
                      ? 'This project is visible to public visitors.'
                      : 'This project is hidden from the public portfolio.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {curationValues.is_active && (
                    <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none rounded-full font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
                      Live
                    </Badge>
                  )}
                  <Switch
                    checked={curationValues.is_active}
                    onCheckedChange={v => setCurationValues(cv => ({ ...cv, is_active: v }))}
                  />
                </div>
              </div>
            </div>

            {/* ── Sections only shown when active ── */}
            {curationValues.is_active && (
              <>
                {/* ── Section 2: SEO & Metadata ── */}
                <div className="rounded-xl border bg-card p-5 space-y-5">
                  <SectionHeader
                    icon={Hash}
                    title="SEO & Metadata"
                    description="Control the URL, page title, and description for search engines and social previews."
                  />

                  <div className="space-y-4">
                    {/* URL Slug */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                        <Hash className="size-3 text-muted-foreground" /> URL Slug
                      </label>
                      <div className="flex items-center rounded-lg border bg-muted/30 overflow-hidden focus-within:ring-2 focus-within:ring-ring/30">
                        <span className="px-3 text-xs text-muted-foreground border-r bg-muted/50 h-9 flex items-center shrink-0 font-mono">
                          /projects/
                        </span>
                        <Input
                          value={curationValues.slug}
                          onChange={e => setCurationValues(cv => ({
                            ...cv,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '')
                          }))}
                          placeholder="jaipur-modern-villa"
                          className="border-0 bg-transparent rounded-none shadow-none focus-visible:ring-0 font-mono text-sm h-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Public Title */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                          <Type className="size-3 text-muted-foreground" /> Page Title
                        </label>
                        <Input
                          value={curationValues.public_title}
                          onChange={e => setCurationValues(cv => ({ ...cv, public_title: e.target.value }))}
                          placeholder="Defaults to the internal project title"
                          className="text-sm"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                          <AlignLeft className="size-3 text-muted-foreground" /> Public Description
                        </label>
                        <Textarea
                          value={curationValues.public_description}
                          onChange={e => setCurationValues(cv => ({ ...cv, public_description: e.target.value }))}
                          placeholder="Describe the architectural layout, materials, and design highlights for public visitors…"
                          rows={4}
                          className="resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Featured Listing ── */}
                <div className="rounded-xl border bg-card p-5">
                  <SectionHeader
                    icon={Star}
                    title="Featured on Homepage"
                    description="Pin this project to the curated highlights section on the main portfolio page."
                  />
                  <div className={cn(
                    'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
                    curationValues.is_featured
                      ? 'border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
                      : 'border-border bg-muted/20'
                  )}>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">
                        {curationValues.is_featured ? 'Featured on homepage' : 'Standard listing'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {curationValues.is_featured
                          ? 'Project appears in the homepage featured row.'
                          : 'Project appears in the regular portfolio grid only.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {curationValues.is_featured && (
                        <Badge className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none rounded-full font-semibold">
                          <Sparkles className="size-3 mr-1 inline" />
                          Featured
                        </Badge>
                      )}
                      <Switch
                        checked={curationValues.is_featured}
                        onCheckedChange={v => setCurationValues(cv => ({ ...cv, is_featured: v }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Gallery & Cover ── */}
                <div className="rounded-xl border bg-card p-5 space-y-5">
                  <SectionHeader
                    icon={ImageIcon}
                    title="Gallery & Cover Photo"
                    description="Select which photos from the project media pool appear in the public gallery, and pick a hero cover image."
                  />

                  {media.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-xl bg-muted/10">
                      <ImageIcon className="size-8 text-muted-foreground/25 mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">No media uploaded yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Upload photos first to build the public gallery.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Cover dropdown */}
                      <div className="space-y-2 max-w-sm">
                        <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5">
                          <ImageIcon className="size-3 text-muted-foreground" /> Gallery Cover Thumbnail
                        </label>
                        <NativeSelect
                          value={curationValues.cover_media_id}
                          onChange={e => setCurationValues(cv => ({ ...cv, cover_media_id: e.target.value }))}
                          className="w-full text-sm"
                        >
                          <NativeSelectOption value="">Choose cover image…</NativeSelectOption>
                          {media
                            .filter(m => curationValues.selected_media_ids.includes(m.id))
                            .map(m => (
                              <NativeSelectOption key={m.id} value={m.id}>
                                {m.caption || 'Untitled Image'}
                              </NativeSelectOption>
                            ))}
                        </NativeSelect>
                        {curationValues.selected_media_ids.length > 0 && !curationValues.cover_media_id && (
                          <p className="text-xs text-amber-500 font-semibold flex items-center gap-1.5">
                            <Info className="size-3.5 shrink-0" />
                            Please pick one of the selected photos as the cover.
                          </p>
                        )}
                      </div>

                      {/* Grid picker */}
                      <div>
                        <p className="text-xs font-semibold text-foreground/70 mb-3">
                          Select Photos for Gallery
                          {curationValues.selected_media_ids.length > 0 && (
                            <span className="ml-2 text-muted-foreground font-normal">
                              ({curationValues.selected_media_ids.length} selected)
                            </span>
                          )}
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {media.map(m => {
                            const isSelected = curationValues.selected_media_ids.includes(m.id)
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleMedia(m.id)}
                                className={cn(
                                  'relative aspect-video rounded-lg overflow-hidden border-2 transition-all group',
                                  isSelected
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                    : 'border-border hover:border-foreground/30'
                                )}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={m.file_url}
                                  alt={m.caption || 'Photo'}
                                  className="object-cover w-full h-full"
                                />
                                <div className={cn(
                                  'absolute inset-0 transition-all',
                                  isSelected
                                    ? 'bg-indigo-500/10'
                                    : 'bg-black/0 group-hover:bg-black/10'
                                )} />
                                <div className={cn(
                                  'absolute top-1.5 right-1.5 size-5 rounded-full flex items-center justify-center transition-all',
                                  isSelected
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-black/40 border border-white/20'
                                )}>
                                  {isSelected && <CheckCircle className="size-3.5 text-white fill-white/20" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t bg-muted/10 flex items-center justify-between shrink-0">
            <p className="text-xs text-muted-foreground">
              {curationValues.is_active ? 'Changes are reflected live after saving.' : 'Project is not publicly visible.'}
            </p>
            <Button
              type="submit"
              disabled={curationSaving || !canSave}
              className="h-9 px-5 font-semibold rounded-lg text-sm"
            >
              {curationSaving ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
