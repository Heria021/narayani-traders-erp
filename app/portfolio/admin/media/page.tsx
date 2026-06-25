'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolio } from '../../_components/usePortfolio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  Search,
  FileText,
  Briefcase
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function MediaLibraryPage() {
  const router = useRouter()
  const {
    projects,
    media,
    loading,
    isDbMissing,
    unlinkMedia,
    refresh,
  } = usePortfolio()

  // ── Search & Filter states ──
  const [projFilter, setProjFilter] = useState('all')
  const [catFilter,  setCatFilter]  = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filtered list
  const filteredMedia = useMemo(() => {
    return media.filter(m => {
      const matchProj = projFilter === 'all' || m.project_id === projFilter
      const matchCat = catFilter === 'all' || m.category === catFilter
      const matchSearch = m.file_name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchProj && matchCat && matchSearch
    })
  }, [media, projFilter, catFilter, searchQuery])

  // Get project name by ID
  const getProjectName = (projId: string) => {
    const p = projects.find(item => item.id === projId)
    return p ? p.title : '—'
  }

  // Delete wrapper
  const handleDelete = async (mId: string, projId: string) => {
    const success = await unlinkMedia(projId, mId)
    if (success) {
      toast.success('Media unlinked from project')
    }
  }

  if (isDbMissing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-[500px]">
        <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <ImageIcon className="size-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Database Setup Warning</h2>
        <p className="text-sm text-muted-foreground max-w-sm mt-2 leading-relaxed">
          Please run the `arch_project_media` table SQL migration script in your Supabase SQL Editor first.
        </p>
        <Button onClick={() => refresh()} className="mt-8">
          Verify Database Tables
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto [scrollbar-width:thin] bg-background">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Media Library
          </h1>
          <p className="text-xs text-muted-foreground">
            A centralized repository of uploaded files, 3D renderings, floor plans, and site photos.
          </p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          
          {/* Search by filename */}
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              type="text"
              placeholder="Search filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full rounded-lg shadow-none"
            />
          </div>

          {/* Project select */}
          <NativeSelect
            value={projFilter}
            onChange={(e) => setProjFilter(e.target.value)}
            className="w-full sm:w-[200px] rounded-lg shadow-none"
          >
            <NativeSelectOption value="all">All Projects</NativeSelectOption>
            {projects.map(p => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          {/* Category Select */}
          <NativeSelect
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-full sm:w-[160px] rounded-lg shadow-none"
          >
            <NativeSelectOption value="all">All Categories</NativeSelectOption>
            <NativeSelectOption value="Render">3D Renders</NativeSelectOption>
            <NativeSelectOption value="Floor Plan">Floor Plans</NativeSelectOption>
            <NativeSelectOption value="Site Photo">Site Photos</NativeSelectOption>
          </NativeSelect>

        </div>

        {/* Counter */}
        <div className="text-xs text-muted-foreground font-medium shrink-0">
          Showing <span className="text-foreground font-bold font-mono">{filteredMedia.length}</span> assets
        </div>
      </div>

      {/* ── Main Asset Grid ── */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="aspect-video w-full rounded-xl" />
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-1.5 border-2 border-dashed rounded-xl">
            <ImageIcon className="size-8 opacity-20" />
            <p className="text-sm font-medium">No media assets found for the active filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8 p-1">
            {filteredMedia.map((m) => (
              <div
                key={m.id}
                className="group relative border rounded-xl overflow-hidden bg-card flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
              >
                {/* File preview */}
                <div className="aspect-video w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border-b relative overflow-hidden">
                  {m.file_url.startsWith('http') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.file_url} alt={m.file_name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <FileText className="size-8 text-muted-foreground/30" />
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/portfolio/admin/projects/${m.project_id}`)}
                      className="p-1.5 bg-background hover:bg-muted text-foreground rounded shadow-sm text-xs font-medium flex items-center gap-1"
                      title="Go to Project"
                    >
                      <Briefcase className="size-3.5" />
                    </button>
                    {m.file_url.startsWith('http') && (
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-background hover:bg-muted text-foreground rounded shadow-sm text-xs font-medium flex items-center gap-1"
                        title="Open full size"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(m.id, m.project_id)}
                      className="p-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded shadow-sm"
                      title="Delete asset link"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details info */}
                <div className="p-3 space-y-1.5">
                  <div className="flex justify-between items-center leading-none">
                    <Badge variant="secondary" className="text-[8px] font-bold tracking-wider uppercase py-0.5 px-1 bg-muted/60">
                      {m.category}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block truncate" title={m.file_name}>
                      {m.file_name}
                    </span>
                    <span className="text-[9px] text-muted-foreground block truncate font-medium">
                      Proj: {getProjectName(m.project_id)}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
