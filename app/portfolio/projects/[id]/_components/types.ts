export interface ProjectExtra {
  id: string
  project_id: string
  type: 'addition' | 'removal' | 'revision'
  description: string
  fee_impact: number
  approved_by_client: boolean
  date: string
  notes: string | null
  created_at: string
}

export interface ProjectPayment {
  id: string
  project_id: string
  type: 'advance' | 'milestone' | 'final' | 'extra'
  amount: number
  method: 'cash' | 'upi' | 'bank_transfer' | 'cheque'
  reference: string | null
  payment_date: string
  note: string | null
  created_at: string
}

export interface PublicListing {
  id: string
  project_id: string
  slug: string
  public_title: string | null
  public_description: string | null
  cover_media_id: string | null
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PublicListingMedia {
  id: string
  public_listing_id: string
  media_id: string
  sort_order: number
}

export interface ExtraFormValues {
  type: 'addition' | 'removal' | 'revision'
  description: string
  fee_impact: string
  approved_by_client: boolean
  date: string
  notes: string
}

export interface PaymentFormValues {
  type: 'advance' | 'milestone' | 'final' | 'extra'
  amount: string
  method: 'cash' | 'upi' | 'bank_transfer' | 'cheque'
  reference: string
  payment_date: string
  note: string
}

export interface PublicCurationFormValues {
  is_active: boolean
  slug: string
  public_title: string
  public_description: string
  cover_media_id: string
  is_featured: boolean
  selected_media_ids: string[] // List of media IDs selected for public display
}

export const EMPTY_EXTRA_FORM: ExtraFormValues = {
  type: 'addition',
  description: '',
  fee_impact: '',
  approved_by_client: true,
  date: new Date().toISOString().split('T')[0],
  notes: ''
}

export const EMPTY_PAYMENT_FORM: PaymentFormValues = {
  type: 'milestone',
  amount: '',
  method: 'upi',
  reference: '',
  payment_date: new Date().toISOString().split('T')[0],
  note: ''
}

export const EMPTY_CURATION_FORM: PublicCurationFormValues = {
  is_active: false,
  slug: '',
  public_title: '',
  public_description: '',
  cover_media_id: '',
  is_featured: false,
  selected_media_ids: []
}
