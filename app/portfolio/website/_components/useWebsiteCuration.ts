'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

export interface ListingRow {
  // from arch_public_listings
  id: string
  project_id: string
  slug: string
  public_title: string | null
  public_description: string | null
  cover_media_id: string | null
  cover_media_url: string | null     // resolved via join
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // from arch_projects join
  project_title: string
  project_type: string
  project_city: string | null
  project_state: string | null
  project_year: number | null
  client_name: string | null
  // computed
  gallery_count: number
}

export interface UnpublishedProject {
  id: string
  title: string
  type: string
  city: string | null
  state: string | null
  year_completed: number | null
  client_name: string | null
}

// ─────────────────────────────────────────────────────────────────────────────

export function useWebsiteCuration() {
  const supabase = createClient()

  const [listings, setListings] = useState<ListingRow[]>([])
  const [unpublished, setUnpublished] = useState<UnpublishedProject[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch all public listings with project + client join
      const { data: lstData, error: lstErr } = await supabase
        .from('arch_public_listings')
        .select(`
          *,
          project:arch_projects(
            id, title, type, city, state, year_completed,
            client:arch_clients(name)
          ),
          cover_media:arch_project_media(file_url),
          gallery:arch_public_listing_media(id)
        `)
        .order('sort_order')

      if (lstErr) { toast.error('Failed to load listings'); setLoading(false); return }

      const rows: ListingRow[] = (lstData || []).map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        slug: r.slug,
        public_title: r.public_title,
        public_description: r.public_description,
        cover_media_id: r.cover_media_id,
        cover_media_url: r.cover_media?.file_url ?? null,
        is_featured: r.is_featured,
        sort_order: r.sort_order,
        created_at: r.created_at,
        updated_at: r.updated_at,
        project_title: r.project?.title ?? 'Unknown',
        project_type: r.project?.type ?? 'other',
        project_city: r.project?.city ?? null,
        project_state: r.project?.state ?? null,
        project_year: r.project?.year_completed ?? null,
        client_name: r.project?.client?.name ?? null,
        gallery_count: r.gallery?.length ?? 0,
      }))

      setListings(rows)

      // 2. Fetch all projects that are NOT yet published
      const publishedIds = rows.map(r => r.project_id)
      const { data: projData, error: projErr } = await supabase
        .from('arch_projects')
        .select('id, title, type, city, state, year_completed, client:arch_clients(name)')
        .order('year_completed', { ascending: false })

      if (projErr) { console.error(projErr) } else {
        const all: UnpublishedProject[] = (projData || [])
          .filter((p: any) => !publishedIds.includes(p.id))
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            city: p.city,
            state: p.state,
            year_completed: p.year_completed,
            client_name: p.client?.name ?? null,
          }))
        setUnpublished(all)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Toggle featured ──
  const toggleFeatured = useCallback(async (listing: ListingRow) => {
    const next = !listing.is_featured
    const { error } = await supabase
      .from('arch_public_listings')
      .update({ is_featured: next })
      .eq('id', listing.id)

    if (error) { toast.error('Failed to update'); return }
    toast.success(next ? 'Marked as featured' : 'Removed from featured')
    setListings(ls => ls.map(l => l.id === listing.id ? { ...l, is_featured: next } : l))
  }, [supabase])

  // ── Unpublish ──
  const unpublish = useCallback(async (listing: ListingRow) => {
    const { error } = await supabase
      .from('arch_public_listings')
      .delete()
      .eq('id', listing.id)

    if (error) { toast.error('Failed to unpublish'); return }
    toast.success(`"${listing.public_title || listing.project_title}" unpublished`)
    await fetchAll()
  }, [supabase, fetchAll])

  return {
    listings,
    unpublished,
    loading,
    refetch: fetchAll,
    toggleFeatured,
    unpublish,
  }
}
