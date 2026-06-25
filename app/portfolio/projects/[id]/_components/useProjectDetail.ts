'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  ProjectExtra,
  PublicListing,
  PublicListingMedia,
  ExtraFormValues,
  PublicCurationFormValues
} from './types'
import type { Project, ProjectMedia, ProjectWithRelations } from '../../_components/types'

export function useProjectDetail(projectId: string) {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<ProjectWithRelations | null>(null)
  const [media, setMedia] = useState<ProjectMedia[]>([])
  const [extras, setExtras] = useState<ProjectExtra[]>([])
  const [publicListing, setPublicListing] = useState<PublicListing | null>(null)
  const [publicListingMedia, setPublicListingMedia] = useState<PublicListingMedia[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch Project with Client
      const { data: projData, error: projErr } = await supabase
        .from('arch_projects')
        .select('*, client:arch_clients(id, name)')
        .eq('id', projectId)
        .single()

      if (projErr) {
        console.error('Error fetching project:', projErr)
        toast.error('Failed to load project details')
        setLoading(false)
        return
      }

      // Convert numeric fields from strings if necessary
      const enrichedProj: ProjectWithRelations = {
        ...projData,
        area_sqft: projData.area_sqft ? Number(projData.area_sqft) : null,
        rate_per_sqft: projData.rate_per_sqft ? Number(projData.rate_per_sqft) : null,
        agreed_fee: projData.agreed_fee ? Number(projData.agreed_fee) : null,
      }
      setProject(enrichedProj)

      // 2. Fetch Media pool
      const { data: mediaData, error: mediaErr } = await supabase
        .from('arch_project_media')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order')
        .order('created_at', { ascending: false })

      if (mediaErr) console.error('Error fetching media:', mediaErr)
      setMedia(mediaData || [])

      // 3. Fetch Extras
      const { data: extrasData, error: extrasErr } = await supabase
        .from('arch_project_extras')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      if (extrasErr) console.error('Error fetching extras:', extrasErr)
      setExtras((extrasData || []).map((e: any) => ({
        ...e,
        fee_impact: e.fee_impact ? Number(e.fee_impact) : 0
      })))

      // 5. Fetch Public Curation listing
      const { data: listData, error: listErr } = await supabase
        .from('arch_public_listings')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle()

      if (listErr) console.error('Error fetching public listing:', listErr)
      setPublicListing(listData || null)

      // 6. Fetch Public Curation media list if public listing exists
      if (listData) {
        const { data: listMediaData, error: listMediaErr } = await supabase
          .from('arch_public_listing_media')
          .select('*')
          .eq('public_listing_id', listData.id)

        if (listMediaErr) console.error('Error fetching listing media:', listMediaErr)
        setPublicListingMedia(listMediaData || [])
      } else {
        setPublicListingMedia([])
      }

    } catch (err) {
      console.error('Exception in hook fetching details:', err)
      toast.error('An unexpected error occurred loading data')
    } finally {
      setLoading(false)
    }
  }, [supabase, projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Financial Ledger Calculations ---
  const baseFee = project?.agreed_fee ?? 0
  const approvedExtras = extras
    .filter(e => e.approved_by_client)
    .reduce((sum, e) => sum + e.fee_impact, 0)
  
  const finalTotalFee = baseFee + approvedExtras

  // --- Media Actions ---
  const uploadMedia = async (file: File, caption: string): Promise<boolean> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `projects/${projectId}/${fileName}`

      // Upload file to the 'portfolio' bucket
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadErr) {
        console.error('Storage Upload Error:', uploadErr)
        toast.error(`File upload failed: ${uploadErr.message}`)
        return false
      }

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath)

      // Insert media record
      const { error: insertErr } = await supabase
        .from('arch_project_media')
        .insert({
          project_id: projectId,
          file_url: publicUrlData.publicUrl,
          public_id: filePath,
          caption: caption.trim() || null,
          sort_order: media.length > 0 ? Math.max(...media.map(m => m.sort_order)) + 1 : 0
        })


      if (insertErr) {
        console.error('Error inserting media metadata:', insertErr)
        toast.error('Failed to link upload record to database')
        return false
      }

      toast.success('File uploaded successfully')
      await fetchData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'File upload exception occurred')
      return false
    }
  }

  const deleteMedia = async (mediaItem: ProjectMedia): Promise<boolean> => {
    try {
      // 1. Delete from Supabase Storage if it has a storage path
      if (mediaItem.public_id) {
        const { error: storageErr } = await supabase.storage
          .from('portfolio')
          .remove([mediaItem.public_id])

        if (storageErr) {
          console.error('Storage Delete Error:', storageErr)
          toast.warning('Failed to delete file from storage, deleting DB row anyway.')
        }
      }

      // 2. Delete row (Cascade will handle relation if any)
      const { error: dbErr } = await supabase
        .from('arch_project_media')
        .delete()
        .eq('id', mediaItem.id)

      if (dbErr) {
        toast.error(`Database deletion error: ${dbErr.message}`)
        return false
      }

      toast.success('Media file deleted successfully')
      await fetchData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete media')
      return false
    }
  }

  const setAsCoverImage = async (mediaItem: ProjectMedia): Promise<boolean> => {
    try {
      // Reset all sort_orders to positive value, set this one to 0
      const { error: resetErr } = await supabase
        .from('arch_project_media')
        .update({ sort_order: 1 } as any)
        .eq('project_id', projectId)

      if (resetErr) {
        toast.error('Failed to reset cover ordering')
        return false
      }

      const { error: setErr } = await supabase
        .from('arch_project_media')
        .update({ sort_order: 0 } as any)
        .eq('id', mediaItem.id)

      if (setErr) {
        toast.error('Failed to set selected image as cover')
        return false
      }

      // If a public listing exists, set its cover_media_id as well
      if (publicListing) {
        await supabase
          .from('arch_public_listings')
          .update({ cover_media_id: mediaItem.id } as any)
          .eq('id', publicListing.id)
      }

      toast.success('Cover image updated successfully')
      await fetchData()
      return true
    } catch (err: any) {
      console.error(err)
      return false
    }
  }

  // --- Extras Actions ---
  const addExtra = async (values: ExtraFormValues): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_project_extras')
        .insert({
          project_id: projectId,
          type: values.type,
          description: values.description.trim(),
          fee_impact: parseFloat(values.fee_impact) || 0,
          approved_by_client: values.approved_by_client,
          date: values.date,
          notes: values.notes.trim() || null
        })

      if (error) {
        toast.error(error.message)
        return false
      }

      toast.success('Scope change extra logged successfully')
      await fetchData()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to log extra')
      return false
    }
  }

  const deleteExtra = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_project_extras')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return false
      }

      toast.success('Scope change deleted')
      await fetchData()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete extra')
      return false
    }
  }

  // --- Public Curation Actions ---
  const savePublicCuration = async (values: PublicCurationFormValues): Promise<boolean> => {
    try {
      if (!values.is_active) {
        // Delete public listing if toggled off
        if (publicListing) {
          const { error } = await supabase
            .from('arch_public_listings')
            .delete()
            .eq('id', publicListing.id)

          if (error) {
            toast.error(error.message)
            return false
          }
        }
        toast.success('Public listing disabled for this project')
        await fetchData()
        return true
      }

      // Upsert Listing entry
      const slugVal = values.slug.trim() || (project?.title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      const { data: upsertedListing, error: upsertErr } = await supabase
        .from('arch_public_listings')
        .upsert({
          project_id: projectId,
          slug: slugVal,
          public_title: values.public_title.trim() || null,
          public_description: values.public_description.trim() || null,
          cover_media_id: values.cover_media_id || null,
          is_featured: values.is_featured,
          updated_at: new Date().toISOString()
        } as any, {
          onConflict: 'project_id'
        })
        .select()
        .single()

      if (upsertErr) {
        toast.error(upsertErr.message)
        return false
      }

      const listingId = upsertedListing.id

      // Update Public gallery selection
      // 1. Clear previous listings mapping
      const { error: clearErr } = await supabase
        .from('arch_public_listing_media')
        .delete()
        .eq('public_listing_id', listingId)

      if (clearErr) {
        console.error('Failed to clear listing media:', clearErr)
      }

      // 2. Insert new listings mapping
      if (values.selected_media_ids.length > 0) {
        const rowsToInsert = values.selected_media_ids.map((mediaId, idx) => ({
          public_listing_id: listingId,
          media_id: mediaId,
          sort_order: idx
        }))

        const { error: insertErr } = await supabase
          .from('arch_public_listing_media')
          .insert(rowsToInsert)

        if (insertErr) {
          console.error('Failed to insert listing media:', insertErr)
          toast.warning('Listing metadata saved, but could not link photo selections.')
        }
      }

      toast.success('Public website curation settings saved')
      await fetchData()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to save curation settings')
      return false
    }
  }

  return {
    loading,
    project,
    media,
    extras,
    publicListing,
    publicListingMedia,
    
    // Ledger stats
    baseFee,
    approvedExtras,
    finalTotalFee,

    // Actions
    uploadMedia,
    deleteMedia,
    setAsCoverImage,
    addExtra,
    deleteExtra,
    savePublicCuration,
    refetch: fetchData
  }
}
