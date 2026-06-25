export interface Client {
  id: string
  name: string
  phone: string
  email: string | null
  city: string | null
  state: string | null
  gstin: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientWithStats extends Client {
  project_count: number
}

export interface ClientFormValues {
  name: string
  phone: string
  email: string
  city: string
  state: string
  gstin: string
  notes: string
}

export const EMPTY_CLIENT_FORM: ClientFormValues = {
  name: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  gstin: '',
  notes: '',
}

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry',
]
