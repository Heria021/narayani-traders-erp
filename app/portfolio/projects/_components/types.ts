export interface Project {
  id: string
  client_id: string
  title: string
  type: 'residential' | 'commercial' | 'interior' | 'visualization_only' | 'renovation' | 'other'
  city: string | null
  state: string | null
  area_sqft: number | null
  floors: number | null
  configuration: string | null
  rate_per_sqft: number | null
  agreed_fee: number | null
  year_completed: number | null
  start_date: string | null
  completion_date: string | null
  description: string | null
  internal_notes: string | null
  client_testimonial: string | null
  created_at: string
  updated_at: string
}

export interface ProjectMedia {
  id: string
  project_id: string
  file_url: string
  public_id: string | null
  caption: string | null
  phase: 'before' | 'during' | 'after' | null
  sort_order: number
  created_at: string
}

export interface ProjectWithRelations extends Project {
  client?: {
    id: string
    name: string
  } | null
  media?: ProjectMedia[]
}

export interface ProjectFormValues {
  client_id: string
  title: string
  type: string
  city: string
  state: string
  area_sqft: string
  floors: string
  configuration: string
  rate_per_sqft: string
  agreed_fee: string
  year_completed: string
  start_date: string
  completion_date: string
  description: string
  internal_notes: string
  client_testimonial: string
  cover_image_url: string
}

export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  client_id: '',
  title: '',
  type: 'residential',
  city: '',
  state: '',
  area_sqft: '',
  floors: '',
  configuration: '',
  rate_per_sqft: '',
  agreed_fee: '',
  year_completed: new Date().getFullYear().toString(),
  start_date: '',
  completion_date: '',
  description: '',
  internal_notes: '',
  client_testimonial: '',
  cover_image_url: ''
}

export const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'interior', label: 'Interior Design' },
  { value: 'visualization_only', label: 'Visualization Only' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'other', label: 'Other' }
] as const
