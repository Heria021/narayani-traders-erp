'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Project, ProjectWithRelations, ProjectFormValues } from './types'

export function useProjects() {
  const supabase = createClient()

  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedProject = projects.find(p => p.id === selectedId) ?? null

  // Fetch available clients for the dropdown
  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('arch_clients')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Failed to fetch clients for projects form:', error)
        return
      }
      setClients(data || [])
    } catch (err) {
      console.error(err)
    }
  }, [supabase])

  // Fetch projects joined with clients and media
  const fetchProjects = useCallback(async (
    s: string = search,
    typeF: string = typeFilter,
    yearF: string = yearFilter
  ) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('arch_projects')
        .select(`
          *,
          client:arch_clients(id, name),
          media:arch_project_media(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
        toast.error('Failed to load projects')
        setLoading(false)
        return
      }

      let enriched: ProjectWithRelations[] = (data || []).map((p: any) => ({
        ...p,
        // Ensure numbers are properly parsed from numeric strings
        area_sqft: p.area_sqft ? Number(p.area_sqft) : null,
        rate_per_sqft: p.rate_per_sqft ? Number(p.rate_per_sqft) : null,
        agreed_fee: p.agreed_fee ? Number(p.agreed_fee) : null,
      }))

      // Apply client-side search filtering
      if (s.trim()) {
        const query = s.toLowerCase()
        enriched = enriched.filter(
          p =>
            p.title.toLowerCase().includes(query) ||
            (p.client?.name ?? '').toLowerCase().includes(query) ||
            (p.city ?? '').toLowerCase().includes(query) ||
            (p.state ?? '').toLowerCase().includes(query) ||
            (p.configuration ?? '').toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query)
        )
      }

      // Apply project type filtering
      if (typeF && typeF !== 'all') {
        enriched = enriched.filter(p => p.type === typeF)
      }

      // Apply completion year filtering
      if (yearF && yearF !== 'all') {
        enriched = enriched.filter(p => p.year_completed?.toString() === yearF)
      }

      setProjects(enriched)
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [supabase, search, typeFilter, yearFilter])

  useEffect(() => {
    fetchProjects()
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchProjects(v, typeFilter, yearFilter), 300)
  }, [fetchProjects, typeFilter, yearFilter])

  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v)
    fetchProjects(search, v, yearFilter)
  }, [fetchProjects, search, yearFilter])

  const handleYearFilterChange = useCallback((v: string) => {
    setYearFilter(v)
    fetchProjects(search, typeFilter, v)
  }, [fetchProjects, search, typeFilter])

  // Helper to upload image file to Supabase storage
  const uploadImage = async (projectId: string, file: File): Promise<{ url: string; path: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `projects/${projectId}/${fileName}`

      // Upload file to the 'portfolio' bucket
      const { data, error } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Supabase Storage Upload Error:', error)
        // If bucket doesn't exist, we will mention this
        if (error.message.includes('bucket') || error.message.includes('does not exist')) {
          toast.error('Storage bucket "portfolio" not found. Please create a public bucket named "portfolio" in Supabase.')
        } else {
          toast.error(`Image upload failed: ${error.message}`)
        }
        return null
      }

      const { data: publicUrlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath)

      return {
        url: publicUrlData.publicUrl,
        path: filePath
      }
    } catch (err) {
      console.error('Storage upload exception:', err)
      toast.error('An error occurred during file upload')
      return null
    }
  }

  const addProject = useCallback(async (values: ProjectFormValues, imageFile: File | null): Promise<boolean> => {
    try {
      // 1. Insert Project into DB
      const { data: newProject, error } = await supabase
        .from('arch_projects')
        .insert({
          client_id: values.client_id,
          title: values.title.trim(),
          type: values.type,
          city: values.city.trim() || null,
          state: values.state.trim() || null,
          area_sqft: values.area_sqft ? parseFloat(values.area_sqft) : null,
          floors: values.floors ? parseInt(values.floors) : null,
          configuration: values.configuration.trim() || null,
          rate_per_sqft: values.rate_per_sqft ? parseFloat(values.rate_per_sqft) : null,
          agreed_fee: values.agreed_fee ? parseFloat(values.agreed_fee) : null,
          year_completed: values.year_completed ? parseInt(values.year_completed) : null,
          start_date: values.start_date || null,
          completion_date: values.completion_date || null,
          description: values.description.trim() || null,
          internal_notes: values.internal_notes.trim() || null,
          client_testimonial: values.client_testimonial.trim() || null,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return false
      }

      const projectId = newProject.id

      // 2. Handle Cover Image (Upload or direct URL)
      let coverUrl = values.cover_image_url.trim()
      let publicId: string | null = null

      if (imageFile) {
        const uploadResult = await uploadImage(projectId, imageFile)
        if (uploadResult) {
          coverUrl = uploadResult.url
          publicId = uploadResult.path
        }
      }

      // 3. If there is a cover URL, insert it into arch_project_media
      if (coverUrl) {
        const { error: mediaError } = await supabase
          .from('arch_project_media')
          .insert({
            project_id: projectId,
            file_url: coverUrl,
            public_id: publicId,
            caption: 'Cover Image',
            phase: 'after',
            sort_order: 0
          })

        if (mediaError) {
          console.error('Error inserting project media:', mediaError)
          toast.warning('Project created, but failed to link the cover image record.')
        }
      }

      toast.success(`Project "${values.title}" created successfully`)
      await fetchProjects()
      await fetchClients()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project')
      return false
    }
  }, [supabase, fetchProjects, fetchClients])

  const updateProject = useCallback(async (
    id: string,
    values: ProjectFormValues,
    imageFile: File | null,
    existingMedia: ProjectWithRelations['media']
  ): Promise<boolean> => {
    try {
      // 1. Update Project table
      const { error } = await supabase
        .from('arch_projects')
        .update({
          client_id: values.client_id,
          title: values.title.trim(),
          type: values.type,
          city: values.city.trim() || null,
          state: values.state.trim() || null,
          area_sqft: values.area_sqft ? parseFloat(values.area_sqft) : null,
          floors: values.floors ? parseInt(values.floors) : null,
          configuration: values.configuration.trim() || null,
          rate_per_sqft: values.rate_per_sqft ? parseFloat(values.rate_per_sqft) : null,
          agreed_fee: values.agreed_fee ? parseFloat(values.agreed_fee) : null,
          year_completed: values.year_completed ? parseInt(values.year_completed) : null,
          start_date: values.start_date || null,
          completion_date: values.completion_date || null,
          description: values.description.trim() || null,
          internal_notes: values.internal_notes.trim() || null,
          client_testimonial: values.client_testimonial.trim() || null,
        })
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return false
      }

      // 2. Handle Cover Image Upload or Text Update
      let coverUrl = values.cover_image_url.trim()
      let publicId: string | null = null

      const coverMediaItem = existingMedia?.find(m => m.caption === 'Cover Image' || m.sort_order === 0)

      if (imageFile) {
        // Upload new file
        const uploadResult = await uploadImage(id, imageFile)
        if (uploadResult) {
          coverUrl = uploadResult.url
          publicId = uploadResult.path

          // Delete old image file if it had a public_id (storage path)
          if (coverMediaItem?.public_id) {
            await supabase.storage
              .from('portfolio')
              .remove([coverMediaItem.public_id])
          }
        }
      }

      if (coverUrl) {
        if (coverMediaItem) {
          // Update existing media row
          const { error: mediaError } = await supabase
            .from('arch_project_media')
            .update({
              file_url: coverUrl,
              public_id: publicId || coverMediaItem.public_id,
              updated_at: new Date().toISOString()
            } as any)
            .eq('id', coverMediaItem.id)

          if (mediaError) {
            console.error('Error updating project media:', mediaError)
          }
        } else {
          // Insert a new media row
          const { error: mediaError } = await supabase
            .from('arch_project_media')
            .insert({
              project_id: id,
              file_url: coverUrl,
              public_id: publicId,
              caption: 'Cover Image',
              phase: 'after',
              sort_order: 0
            })

          if (mediaError) {
            console.error('Error creating project media:', mediaError)
          }
        }
      } else if (coverMediaItem && !values.cover_image_url.trim()) {
        // If image URL was cleared, delete the media row and file
        if (coverMediaItem.public_id) {
          await supabase.storage.from('portfolio').remove([coverMediaItem.public_id])
        }
        await supabase.from('arch_project_media').delete().eq('id', coverMediaItem.id)
      }

      toast.success(`Project "${values.title}" updated successfully`)
      await fetchProjects()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project')
      return false
    }
  }, [supabase, fetchProjects])

  const deleteProject = useCallback(async (project: ProjectWithRelations): Promise<boolean> => {
    try {
      // 1. Delete all images from storage first
      const mediaList = project.media || []
      const filePathsToDelete = mediaList
        .map(m => m.public_id)
        .filter((id): id is string => typeof id === 'string')

      if (filePathsToDelete.length > 0) {
        const { error: storageErr } = await supabase.storage
          .from('portfolio')
          .remove(filePathsToDelete)
        if (storageErr) {
          console.error('Failed to clear project files from storage:', storageErr)
        }
      }

      // 2. Delete project from DB (Cascade will delete media rows)
      const { error } = await supabase
        .from('arch_projects')
        .delete()
        .eq('id', project.id)

      if (error) {
        toast.error(error.message)
        return false
      }

      toast.success(`Project "${project.title}" deleted successfully`)
      if (selectedId === project.id) setSelectedId(null)
      await fetchProjects()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project')
      return false
    }
  }, [supabase, fetchProjects, selectedId])

  // Get distinct completion years from current projects list for the dropdown filter
  const getAvailableYears = useCallback(() => {
    const yearsSet = new Set<number>()
    projects.forEach(p => {
      if (p.year_completed) yearsSet.add(p.year_completed)
    })
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [projects])

  return {
    projects,
    clients,
    search,
    typeFilter,
    yearFilter,
    loading,
    selectedId,
    selectedProject,
    setSelectedId,
    handleSearchChange,
    handleTypeFilterChange,
    handleYearFilterChange,
    addProject,
    updateProject,
    deleteProject,
    getAvailableYears,
    refetch: fetchProjects,
  }
}
