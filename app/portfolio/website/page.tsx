'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Globe, Star, MapPin, Calendar, Eye, ArrowUpRight,
  MoreHorizontal, Pencil, EyeOff, Layers, Users,
  LayoutGrid, Sparkles, Link2, Image as ImageIcon,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWebsiteCuration, type ListingRow, type UnpublishedProject } from './_components/useWebsiteCuration'
import { PROJECT_TYPES } from '../projects/_components/types'

// ─────────────────────────────────────────────────────────────────────────────

function getProjectTypeName(typeVal: string) {
  const item = PROJECT_TYPES.find(t => t.value === typeVal)
  return item ? item.label : typeVal
}

const TYPE_COLORS: Record<string, string> = {
  residential:        'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  commercial:         'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  interior:           'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  visualization_only: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
  renovation:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  other:              'bg-muted text-muted-foreground',
}

// ── Blueprint placeholder ────────────────────────────────────────────────────
const ImagePlaceholder = () => (
  <div className="w-full h-full bg-neutral-900 dark:bg-neutral-950 relative overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px]" />
    <div className="flex flex-col items-center gap-1 text-neutral-700 relative z-10">
      <svg className="size-7 stroke-[1]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M20 20v-8H4v8m16-8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6" /><path d="M12 4v16M4 12h16" />
      </svg>
      <span className="text-[8px] uppercase tracking-widest font-bold font-mono">No Cover</span>
    </div>
  </div>
)

// ── Published listing card ────────────────────────────────────────────────────
function ListingCard({
  listing,
  onGoToProject,
  onToggleFeatured,
  onUnpublish,
}: {
  listing: ListingRow
  onGoToProject: () => void
  onToggleFeatured: () => void
  onUnpublish: () => void
}) {
  const location = [listing.project_city, listing.project_state].filter(Boolean).join(', ')
  const displayTitle = listing.public_title || listing.project_title

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl border overflow-hidden bg-card',
      'shadow-xs hover:shadow-md hover:shadow-black/8 dark:hover:shadow-black/25',
      'hover:border-border hover:-translate-y-0.5 transition-all duration-300 ease-out',
      listing.is_featured && 'ring-1 ring-amber-300/60 dark:ring-amber-500/30',
    )}>

      {/* ── Image zone ── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted shrink-0">
        {listing.cover_media_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={listing.cover_media_url}
            alt={displayTitle}
            className="object-cover w-full h-full group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : <ImagePlaceholder />}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Featured badge */}
        {listing.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400/90 text-amber-950 text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
            <Star className="size-3 fill-current" /> Featured
          </div>
        )}

        {/* 3-dot menu */}
        <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={onGoToProject}>
                <Pencil className="size-4 mr-2" /> Configure in Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFeatured}>
                <Star className="size-4 mr-2" />
                {listing.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onUnpublish}>
                <EyeOff className="size-4 mr-2" /> Unpublish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Type badge */}
        <span className={cn(
          'absolute bottom-3 left-3 text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded-md',
          'bg-neutral-900/80 text-white backdrop-blur-sm'
        )}>
          {getProjectTypeName(listing.project_type)}
        </span>

        {/* Year */}
        {listing.project_year && (
          <span className="absolute bottom-3 right-3 text-[10px] text-white/75 font-mono font-semibold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
            {listing.project_year}
          </span>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Client + title */}
        <div className="space-y-0.5">
          {listing.client_name && (
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest truncate">
              {listing.client_name}
            </p>
          )}
          <h3 className="font-bold text-foreground text-[14px] leading-snug line-clamp-1">
            {displayTitle}
          </h3>
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0 text-muted-foreground/50" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        {/* Slug + gallery count */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-muted/50 border border-border/50 rounded-lg px-2.5 py-1.5 min-w-0">
            <Link2 className="size-3 text-muted-foreground/60 shrink-0" />
            <span className="text-[11px] font-mono text-muted-foreground truncate">
              /{listing.slug}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 border border-border/50 rounded-lg px-2.5 py-1.5">
            <ImageIcon className="size-3 text-muted-foreground/50" />
            {listing.gallery_count} photo{listing.gallery_count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Live</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoToProject}
          className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
        >
          Configure <ArrowUpRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}

// ── Unpublished project row ────────────────────────────────────────────────────
function UnpublishedRow({
  p, onGoToProject
}: {
  p: UnpublishedProject
  onGoToProject: () => void
}) {
  const location = [p.city, p.state].filter(Boolean).join(', ')

  return (
    <button
      onClick={onGoToProject}
      className={cn(
        'w-full text-left flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4',
        'hover:border-border hover:shadow-sm hover:bg-muted/10',
        'transition-all duration-200 group',
      )}
    >
      {/* Type dot */}
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60 shrink-0">
        <Layers className="size-4 text-muted-foreground/60" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{p.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
            TYPE_COLORS[p.type] ?? 'bg-muted text-muted-foreground'
          )}>
            {getProjectTypeName(p.type)}
          </span>
          {location && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="size-2.5" />{location}
            </span>
          )}
          {p.year_completed && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Calendar className="size-2.5" />{p.year_completed}
            </span>
          )}
          {p.client_name && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Users className="size-2.5" />{p.client_name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground hidden sm:block">Publish via project</span>
        <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </div>
    </button>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </div>
      <div className="px-4 py-3 border-t border-border/50 flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShowcasePage() {
  const router = useRouter()
  const { listings, unpublished, loading, toggleFeatured, unpublish } = useWebsiteCuration()

  const featuredCount = listings.filter(l => l.is_featured).length
  const totalGallery = listings.reduce((s, l) => s + l.gallery_count, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">

      {/* ══ PAGE HEADER ═══════════════════════════════════════════════════════ */}
      <div className="shrink-0 border-b border-border/60 bg-background relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />

        <div className="relative px-8 pt-7 pb-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-foreground/5 border border-border/60">
                  <Globe className="size-4.5 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Showcase</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl pl-0.5">
                Control what appears on the public portfolio website — manage published projects, featured picks, and gallery showcase.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => router.push('/portfolio/projects')}
              >
                <ExternalLink className="size-3.5" />
                Go to Projects
              </Button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="flex items-stretch divide-x divide-border/60 border-t border-border/40">
            <div className="flex items-center gap-3 px-6 py-4 first:pl-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <LayoutGrid className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Published</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : listings.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 shrink-0">
                <Star className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Featured</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : featuredCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <ImageIcon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Gallery Photos</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : totalGallery}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted/70 shrink-0">
                <Eye className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 leading-none mb-1">Unpublished</p>
                <p className="text-sm font-bold text-foreground leading-tight tabular-nums">
                  {loading ? '—' : unpublished.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-7 space-y-10">

        {/* ── LIVE GRID ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="size-1.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-foreground">Live on Website</h2>
            <Badge variant="secondary" className="text-[10px] px-2 py-0 rounded-full ml-1">
              {loading ? '…' : listings.length}
            </Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl bg-card text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                <Globe className="size-7 text-muted-foreground/30" />
              </div>
              <h3 className="font-bold text-base">Nothing published yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1.5">
                Go to a project's detail page and open the <strong>Website</strong> panel to publish it.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-lg gap-1.5 text-xs"
                onClick={() => router.push('/portfolio/projects')}
              >
                <ArrowUpRight className="size-3.5" /> Browse Projects
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map(l => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onGoToProject={() => router.push(`/portfolio/projects/${l.project_id}`)}
                  onToggleFeatured={() => toggleFeatured(l)}
                  onUnpublish={() => unpublish(l)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── UNPUBLISHED PROJECTS ── */}
        {!loading && unpublished.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-1.5 rounded-full bg-muted-foreground/40" />
              <h2 className="text-sm font-bold text-foreground">Not Yet Published</h2>
              <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full ml-1 text-muted-foreground">
                {unpublished.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              These projects exist in your records but are not on the public website. Open a project and use the
              {' '}<strong>Website</strong> panel to publish it.
            </p>
            <div className="space-y-2">
              {unpublished.map(p => (
                <UnpublishedRow
                  key={p.id}
                  p={p}
                  onGoToProject={() => router.push(`/portfolio/projects/${p.id}`)}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
