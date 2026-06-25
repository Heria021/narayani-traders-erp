/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  Client,
  Project,
  ProjectWithClient,
  ProjectService,
  ProjectPhase,
  ProjectExtra,
  ProjectPayment,
  ProjectMedia,
  StudioSettings,
  ProjectDetailData,
  PortfolioKpis,
  ServiceType,
  PhaseStatus,
  ExtraType,
  PaymentType,
  PaymentMethod,
  MediaCategory,
  ProjectType,
} from './types'

// Phase Templates from arch_table.sql
const PHASE_TEMPLATES: Record<ServiceType, string[]> = {
  design_drawings: [
    "Site measurement & survey",
    "Concept floor plan",
    "Final floor plan",
    "Elevation drawings",
    "Section drawings",
    "Electrical layout",
    "Plumbing layout",
    "Structural drawings"
  ],
  visualization_3d: [
    "Exterior 3D render",
    "Living room render",
    "Master bedroom render",
    "Kitchen render",
    "Other interior renders",
    "Walkthrough video"
  ],
  construction_supervision: [
    "Foundation",
    "Structure / RCC",
    "Brickwork / masonry",
    "Plaster",
    "Flooring",
    "Electrical & plumbing rough-in",
    "Finishing & painting",
    "Final handover & inspection"
  ],
  interior_design: [
    "Space planning",
    "Material & finish selection",
    "Furniture layout",
    "Lighting design",
    "Final interior renders",
    "Execution & supervision"
  ],
  renovation: [
    "Site assessment",
    "Demolition plan",
    "New layout drawings",
    "Material selection",
    "Execution & supervision",
    "Final inspection"
  ]
}

export function usePortfolio() {
  const supabase = createClient()

  // ── States ──
  const [projects,     setProjects]     = useState<ProjectWithClient[]>([])
  const [clients,      setClients]      = useState<Client[]>([])
  const [settings,     setSettings]     = useState<StudioSettings | null>(null)
  const [media,        setMedia]        = useState<ProjectMedia[]>([])
  const [kpis,         setKpis]         = useState<PortfolioKpis>({ total_projects: 0, active_projects: 0, pipeline_value: 0, total_collected: 0, outstanding: 0 })
  const [loading,      setLoading]      = useState(true)
  const [isDbMissing,  setIsDbMissing]  = useState(false)

  // ── Single Project Details States ──
  const [projectDetail, setProjectDetail] = useState<ProjectDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── Filters & Search ──
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter,   setTypeFilter]   = useState<string>('all')

  // ── Helper to catch missing table / database errors ──
  const handleDbError = useCallback((err: any) => {
    console.error(err)
    if (err?.code === '42P01') {
      setIsDbMissing(true)
    } else {
      toast.error(err?.message || 'Database error occurred')
    }
  }, [])

  // ── Fetch Global / Dashboard Data ──
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setIsDbMissing(false)

    try {
      // 1. Fetch Clients
      const { data: clientsData, error: clientsErr } = await supabase
        .from('arch_clients')
        .select('*')
        .order('name')

      if (clientsErr) throw clientsErr
      setClients(clientsData || [])

      // 2. Fetch Projects (Joined with Client)
      const { data: prodsData, error: prodsErr } = await supabase
        .from('arch_projects')
        .select('*, arch_clients!inner(name, phone, email)')
        .order('created_at', { ascending: false })

      if (prodsErr) throw prodsErr

      const mappedProjects: ProjectWithClient[] = (prodsData || []).map((p: any) => ({
        id: p.id,
        client_id: p.client_id,
        title: p.title,
        project_number: p.project_number,
        type: p.type,
        location: p.location,
        city: p.city,
        state: p.state,
        area_sqft: p.area_sqft ? Number(p.area_sqft) : null,
        rate_per_sqft: p.rate_per_sqft ? Number(p.rate_per_sqft) : null,
        base_fee: p.base_fee ? Number(p.base_fee) : null,
        agreed_fee: p.agreed_fee ? Number(p.agreed_fee) : null,
        status: p.status,
        start_date: p.start_date,
        estimated_end_date: p.estimated_end_date,
        actual_end_date: p.actual_end_date,
        scope_notes: p.scope_notes,
        internal_notes: p.internal_notes,
        is_published: p.is_published,
        created_at: p.created_at,
        updated_at: p.updated_at,
        client_name: p.arch_clients?.name ?? '—',
        client_phone: p.arch_clients?.phone ?? '—',
        client_email: p.arch_clients?.email ?? null,
      }))

      setProjects(mappedProjects)

      // 3. Fetch Payments
      const { data: paymentsData } = await supabase.from('arch_project_payments').select('amount')
      const totalCollected = (paymentsData ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

      // 4. Fetch Extras
      const { data: extrasData } = await supabase.from('arch_project_extras').select('fee_impact, approved_by_client')
      const approvedExtrasSum = (extrasData ?? [])
        .filter(e => e.approved_by_client)
        .reduce((sum, e) => sum + Number(e.fee_impact), 0)

      // Compute pipeline value (agreed fees + approved extras)
      const agreedFeesSum = mappedProjects
        .filter(p => p.status !== 'cancelled')
        .reduce((sum, p) => sum + (p.agreed_fee ?? 0), 0)

      const pipelineValue = agreedFeesSum + approvedExtrasSum
      const activeCount = mappedProjects.filter(p => ['active', 'quoted', 'inquiry'].includes(p.status)).length

      setKpis({
        total_projects: mappedProjects.length,
        active_projects: activeCount,
        pipeline_value: pipelineValue,
        total_collected: totalCollected,
        outstanding: Math.max(0, pipelineValue - totalCollected),
      })

      // 5. Fetch Studio Settings
      const { data: settingsData } = await supabase
        .from('portfolio_settings')
        .select('*')
        .eq('id', 'studio_config')
        .maybeSingle()

      if (settingsData) {
        setSettings({
          id: settingsData.id,
          tagline: settingsData.tagline,
          biography: settingsData.biography,
          social_instagram: settingsData.social_instagram,
          social_facebook: settingsData.social_facebook,
          social_pinterest: settingsData.social_pinterest,
          whatsapp_number: settingsData.whatsapp_number,
          services: Array.isArray(settingsData.services) ? settingsData.services : [],
          created_at: settingsData.created_at,
          updated_at: settingsData.updated_at,
        })
      }

      // 6. Fetch Media
      const { data: mediaData } = await supabase
        .from('arch_project_media')
        .select('*')
        .order('created_at', { ascending: false })

      setMedia((mediaData || []) as ProjectMedia[])

    } catch (err: any) {
      handleDbError(err)
    } finally {
      setLoading(false)
    }
  }, [supabase, handleDbError])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ── Filtered Projects list for UI ──
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      const matchType = typeFilter === 'all' || p.type === typeFilter

      return matchSearch && matchStatus && matchType
    })
  }, [projects, searchQuery, statusFilter, typeFilter])

  // ── Fetch Project Details ──
  const fetchProjectDetail = useCallback(async (projectId: string) => {
    setDetailLoading(true)
    try {
      const [
        { data: proj, error: projErr },
        { data: client, error: clientErr },
        { data: services },
        { data: phases },
        { data: extras },
        { data: payments },
        { data: mediaData }
      ] = await Promise.all([
        supabase.from('arch_projects').select('*').eq('id', projectId).single(),
        supabase.from('arch_clients').select('*').eq('id', (await supabase.from('arch_projects').select('client_id').eq('id', projectId).single()).data?.client_id).single(),
        supabase.from('arch_project_services').select('*').eq('project_id', projectId),
        supabase.from('arch_project_phases').select('*').eq('project_id', projectId).order('phase_order', { ascending: true }),
        supabase.from('arch_project_extras').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('arch_project_payments').select('*').eq('project_id', projectId).order('payment_date', { ascending: false }),
        supabase.from('arch_project_media').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
      ])

      if (projErr || !proj) throw projErr || new Error('Project not found')
      if (clientErr || !client) throw clientErr || new Error('Client not found')

      setProjectDetail({
        ...proj,
        client,
        services: (services || []) as ProjectService[],
        phases: (phases || []) as ProjectPhase[],
        extras: (extras || []) as ProjectExtra[],
        payments: (payments || []) as ProjectPayment[],
        media: (mediaData || []) as ProjectMedia[],
      } as ProjectDetailData)
    } catch (err: any) {
      console.error(err)
      toast.error('Could not load project details')
    } finally {
      setDetailLoading(false)
    }
  }, [supabase])

  // ── Create Project & Auto-generate Phases ──
  const createProject = async (values: {
    client_id: string
    title: string
    type: ProjectType
    location: string
    city: string
    state: string
    area_sqft: string
    rate_per_sqft: string
    agreed_fee: string
    scope_notes: string
    internal_notes: string
    services: ServiceType[]
  }): Promise<string | null> => {
    try {
      const area = Number(values.area_sqft) || 0
      const rate = Number(values.rate_per_sqft) || 0
      const baseFee = area * rate
      const agreedFee = Number(values.agreed_fee) || baseFee

      // 1. Get project number sequence
      const { count } = await supabase.from('arch_projects').select('id', { count: 'exact', head: true })
      const numSeq = String((count ?? 0) + 1).padStart(3, '0')
      const projectNumber = `PROJ-${new Date().getFullYear()}-${numSeq}`

      // 2. Insert project
      const { data: newProj, error: insertErr } = await supabase
        .from('arch_projects')
        .insert({
          client_id: values.client_id,
          title: values.title,
          project_number: projectNumber,
          type: values.type,
          location: values.location || null,
          city: values.city || null,
          state: values.state || null,
          area_sqft: area || null,
          rate_per_sqft: rate || null,
          base_fee: baseFee || null,
          agreed_fee: agreedFee,
          status: 'inquiry',
          scope_notes: values.scope_notes || null,
          internal_notes: values.internal_notes || null,
          is_published: false
        })
        .select('id')
        .single()

      if (insertErr || !newProj) throw insertErr

      // 3. Insert Services and auto-generate Phases based on templates
      const projId = newProj.id

      for (const sType of values.services) {
        const { data: serv, error: sErr } = await supabase
          .from('arch_project_services')
          .insert({
            project_id: projId,
            service_type: sType,
            is_included: true,
            fee_for_service: agreedFee / values.services.length // Split fee evenly by default
          })
          .select('id')
          .single()

        if (sErr || !serv) throw sErr

        const phaseNames = PHASE_TEMPLATES[sType] || []
        const phasesPayload = phaseNames.map((name, idx) => ({
          project_id: projId,
          service_id: serv.id,
          name,
          phase_order: idx + 1,
          status: 'pending' as PhaseStatus,
          is_included: true
        }))

        if (phasesPayload.length > 0) {
          const { error: pErr } = await supabase.from('arch_project_phases').insert(phasesPayload)
          if (pErr) throw pErr
        }
      }

      toast.success('Project created successfully')
      fetchAllData()
      return projId

    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Could not create project')
      return null
    }
  }

  // ── Create Client ──
  const createClientRecord = async (values: {
    name: string
    phone: string
    email: string
    address: string
    city: string
    state: string
    gstin: string
    notes: string
  }): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('arch_clients')
        .insert({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          address: values.address.trim() || null,
          city: values.city.trim() || null,
          state: values.state.trim() || null,
          gstin: values.gstin.trim() || null,
          notes: values.notes.trim() || null,
        })
        .select('*')
        .single()

      if (error) throw error
      toast.success(`Client ${values.name} registered`)
      fetchAllData()
      return data as Client
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Could not register client')
      return null
    }
  }

  // ── Update Project status / attributes ──
  const updateProjectAttributes = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_projects')
        .update(updates)
        .eq('id', projectId)

      if (error) throw error
      toast.success('Project updated')
      fetchProjectDetail(projectId)
      fetchAllData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Could not update project attributes')
      return false
    }
  }

  // ── Update Project Phase ──
  const updatePhase = async (projectId: string, phaseId: string, updates: Partial<ProjectPhase>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_project_phases')
        .update(updates)
        .eq('id', phaseId)

      if (error) throw error
      toast.success('Phase updated')
      fetchProjectDetail(projectId)
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to update phase')
      return false
    }
  }

  // ── Record Payment received ──
  const recordPayment = async (projectId: string, values: {
    phase_id: string | null
    type: PaymentType
    amount: number
    method: PaymentMethod
    reference: string
    payment_date: string
    note: string
  }): Promise<boolean> => {
    try {
      // 1. Get payment number sequence
      const { count } = await supabase.from('arch_project_payments').select('id', { count: 'exact', head: true })
      const numSeq = String((count ?? 0) + 1).padStart(3, '0')
      const paymentNumber = `PAY-${new Date().getFullYear()}-${numSeq}`

      const { error } = await supabase
        .from('arch_project_payments')
        .insert({
          project_id: projectId,
          phase_id: values.phase_id || null,
          payment_number: paymentNumber,
          type: values.type,
          amount: values.amount,
          method: values.method,
          reference: values.reference || null,
          payment_date: values.payment_date,
          note: values.note || null
        })

      if (error) throw error
      toast.success('Payment recorded')
      fetchProjectDetail(projectId)
      fetchAllData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to log payment')
      return false
    }
  }

  // ── Add mid-project Extra scope ──
  const addExtra = async (projectId: string, values: {
    type: ExtraType
    description: string
    fee_impact: number
    approved_by_client: boolean
    date: string
    notes: string
  }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_project_extras')
        .insert({
          project_id: projectId,
          type: values.type,
          description: values.description,
          fee_impact: values.fee_impact,
          approved_by_client: values.approved_by_client,
          date: values.date,
          notes: values.notes || null
        })

      if (error) throw error
      toast.success('Scope change extra logged')
      fetchProjectDetail(projectId)
      fetchAllData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to log extra')
      return false
    }
  }

  // ── Toggle Extra approval ──
  const toggleExtraApproval = async (projectId: string, extraId: string, currentStatus: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_project_extras')
        .update({ approved_by_client: !currentStatus })
        .eq('id', extraId)

      if (error) throw error
      toast.success(!currentStatus ? 'Extra approved' : 'Extra unapproved')
      fetchProjectDetail(projectId)
      fetchAllData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to toggle approval')
      return false
    }
  }

  // ── Add/Link Project Media render/site photo ──
  const linkMedia = async (projectId: string, values: {
    file_name: string
    file_url: string
    category: MediaCategory
    file_size: number | null
  }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_project_media')
        .insert({
          project_id: projectId,
          file_name: values.file_name,
          file_url: values.file_url,
          category: values.category,
          file_size: values.file_size
        })

      if (error) throw error
      toast.success('Media attachment linked')
      fetchProjectDetail(projectId)
      fetchAllData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to link media asset')
      return false
    }
  }

  // ── Delete Project Media render/site photo ──
  const unlinkMedia = async (projectId: string, mediaId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('arch_project_media')
        .delete()
        .eq('id', mediaId)

      if (error) throw error
      toast.success('Media attachment removed')
      fetchProjectDetail(projectId)
      fetchAllData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to unlink media')
      return false
    }
  }

  // ── Update Studio profile settings ──
  const updateSettings = async (values: Partial<StudioSettings>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('portfolio_settings')
        .upsert({
          id: 'studio_config',
          ...values,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Studio configuration updated')
      fetchAllData()
      return true
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save settings')
      return false
    }
  }

  return {
    // states
    projects,
    filteredProjects,
    clients,
    settings,
    media,
    kpis,
    loading,
    isDbMissing,
    projectDetail,
    detailLoading,

    // filters
    searchQuery,
    statusFilter,
    typeFilter,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,

    // actions
    refresh: fetchAllData,
    fetchProjectDetail,
    createProject,
    createClientRecord,
    updateProjectAttributes,
    updatePhase,
    recordPayment,
    addExtra,
    toggleExtraApproval,
    linkMedia,
    unlinkMedia,
    updateSettings,
  }
}
