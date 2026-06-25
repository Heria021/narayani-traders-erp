export interface Client {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  gstin: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ProjectType = 'residential' | 'commercial' | 'interior' | 'visualization_only' | 'renovation'

export type ProjectStatus = 'inquiry' | 'quoted' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id: string
  client_id: string
  title: string
  project_number: string
  type: ProjectType
  location: string | null
  city: string | null
  state: string | null
  area_sqft: number | null
  rate_per_sqft: number | null
  base_fee: number | null
  agreed_fee: number | null
  status: ProjectStatus
  start_date: string | null
  estimated_end_date: string | null
  actual_end_date: string | null
  scope_notes: string | null
  internal_notes: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface ProjectWithClient extends Project {
  client_name: string
  client_phone: string
  client_email: string | null
}

export type ServiceType = 'design_drawings' | 'visualization_3d' | 'construction_supervision' | 'interior_design' | 'renovation'

export interface ProjectService {
  id: string
  project_id: string
  service_type: ServiceType
  is_included: boolean
  fee_for_service: number | null
  notes: string | null
  created_at: string
}

export type PhaseStatus = 'pending' | 'in_progress' | 'review' | 'revision' | 'completed'

export interface ProjectPhase {
  id: string
  project_id: string
  service_id: string
  name: string
  description: string | null
  phase_order: number
  status: PhaseStatus
  is_included: boolean
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ExtraType = 'addition' | 'removal' | 'revision'

export interface ProjectExtra {
  id: string
  project_id: string
  type: ExtraType
  description: string
  fee_impact: number
  approved_by_client: boolean
  date: string
  notes: string | null
  created_at: string
}

export type PaymentType = 'advance' | 'milestone' | 'final' | 'extra'

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque'

export interface ProjectPayment {
  id: string
  project_id: string
  phase_id: string | null
  payment_number: string
  type: PaymentType
  amount: number
  method: PaymentMethod
  reference: string | null
  payment_date: string
  note: string | null
  created_at: string
}

export type MediaCategory = 'Render' | 'Floor Plan' | 'Site Photo'

export interface ProjectMedia {
  id: string
  project_id: string
  file_name: string
  file_url: string
  category: MediaCategory
  file_size: number | null
  created_at: string
}

export interface StudioSettings {
  id: string
  tagline: string | null
  biography: string | null
  social_instagram: string | null
  social_facebook: string | null
  social_pinterest: string | null
  whatsapp_number: string | null
  services: string[]
  created_at: string
  updated_at: string
}

export interface ProjectDetailData extends Project {
  client: Client
  services: ProjectService[]
  phases: ProjectPhase[]
  extras: ProjectExtra[]
  payments: ProjectPayment[]
  media: ProjectMedia[]
}

export interface PortfolioKpis {
  total_projects: number
  active_projects: number
  pipeline_value: number
  total_collected: number
  outstanding: number
}
