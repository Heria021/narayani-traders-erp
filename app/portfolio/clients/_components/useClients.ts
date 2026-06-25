'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Client, ClientWithStats, ClientFormValues } from './types'

export function useClients() {
  const supabase = createClient()

  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedClient = clients.find(c => c.id === selectedId) ?? null

  const fetchClients = useCallback(async (s: string = search) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('arch_clients')
        .select('*, arch_projects(id)')
        .order('name')

      if (error) {
        console.error(error)
        toast.error('Failed to load clients')
        setLoading(false)
        return
      }

      let enriched: ClientWithStats[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        city: c.city,
        state: c.state,
        gstin: c.gstin,
        notes: c.notes,
        created_at: c.created_at,
        updated_at: c.updated_at,
        project_count: c.arch_projects?.length ?? 0
      }))

      if (s.trim()) {
        const query = s.toLowerCase()
        enriched = enriched.filter(
          c =>
            c.name.toLowerCase().includes(query) ||
            c.phone.toLowerCase().includes(query) ||
            (c.email ?? '').toLowerCase().includes(query) ||
            (c.city ?? '').toLowerCase().includes(query) ||
            (c.state ?? '').toLowerCase().includes(query) ||
            (c.gstin ?? '').toLowerCase().includes(query)
        )
      }

      setClients(enriched)
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [supabase, search])

  useEffect(() => {
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchClients(v), 300)
  }, [fetchClients])

  const addClient = useCallback(async (values: ClientFormValues): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('arch_clients')
        .insert({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          city: values.city.trim() || null,
          state: values.state.trim() || null,
          gstin: values.gstin.trim() || null,
          notes: values.notes.trim() || null,
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return false
      }

      toast.success(`${values.name} added successfully`)
      await fetchClients()
      if (data) setSelectedId(data.id)
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to add client')
      return false
    }
  }, [supabase, fetchClients])

  const updateClient = useCallback(async (id: string, values: ClientFormValues): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_clients')
        .update({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          city: values.city.trim() || null,
          state: values.state.trim() || null,
          gstin: values.gstin.trim() || null,
          notes: values.notes.trim() || null,
        })
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return false
      }

      toast.success(`${values.name} updated successfully`)
      await fetchClients()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to update client')
      return false
    }
  }, [supabase, fetchClients])

  const deleteClient = useCallback(async (client: ClientWithStats): Promise<boolean> => {
    if (client.project_count > 0) {
      toast.error(`Cannot delete client ${client.name} because they have ${client.project_count} project(s) recorded.`)
      return false
    }
    try {
      const { error } = await supabase
        .from('arch_clients')
        .delete()
        .eq('id', client.id)

      if (error) {
        toast.error(error.message)
        return false
      }

      toast.success(`${client.name} deleted successfully`)
      if (selectedId === client.id) setSelectedId(null)
      await fetchClients()
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete client')
      return false
    }
  }, [supabase, fetchClients, selectedId])

  return {
    clients,
    search,
    loading,
    selectedId,
    selectedClient,
    setSelectedId,
    handleSearchChange,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  }
}
