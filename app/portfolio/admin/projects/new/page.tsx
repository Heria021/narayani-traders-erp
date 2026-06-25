'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolio } from '../../../_components/usePortfolio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  ArrowLeft,
  Plus,
  Briefcase,
  UserPlus,
  PackagePlus,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential Architecture' },
  { value: 'commercial', label: 'Commercial Spaces' },
  { value: 'interior', label: 'Interior Design' },
  { value: 'visualization_only', label: '3D Visualization Only' },
  { value: 'renovation', label: 'Renovation & Restoration' },
]

const SERVICES_OPTS = [
  { value: 'design_drawings', label: 'Design & Structural Drawings' },
  { value: 'visualization_3d', label: '3D Renders & Walkthrough Video' },
  { value: 'construction_supervision', label: 'On-site Construction Supervision' },
  { value: 'interior_design', label: 'Interior styling & furnishings' },
  { value: 'renovation', label: 'Renovation drawings & Demolitions' },
]

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>
}

function Label({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-foreground/80">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const { clients, createProject, createClientRecord } = usePortfolio()

  // ── Project Form Values ──
  const [title,         setTitle]         = useState('')
  const [clientId,      setClientId]      = useState('')
  const [type,          setType]          = useState('residential')
  const [location,      setLocation]      = useState('')
  const [city,          setCity]          = useState('')
  const [state,         setState]         = useState('Rajasthan')
  const [areaSqft,      setAreaSqft]      = useState('')
  const [rateSqft,      setRateSqft]      = useState('')
  const [agreedFee,     setAgreedFee]     = useState('')
  const [scopeNotes,    setScopeNotes]    = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [selServices,   setSelServices]   = useState<string[]>(['design_drawings', 'visualization_3d'])
  
  const [submitting,    setSubmitting]    = useState(false)

  // ── Modals Toggle ──
  const [clientModalOpen,  setClientModalOpen]  = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)

  // ── Quick-Add Client State ──
  const [clientName,    setClientName]    = useState('')
  const [clientPhone,   setClientPhone]   = useState('')
  const [clientEmail,   setClientEmail]   = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientCity,    setClientCity]    = useState('')
  const [clientState,   setClientState]   = useState('Rajasthan')
  const [clientNotes,   setClientNotes]   = useState('')
  const [clientGstin,   setClientGstin]   = useState('')
  const [addingClient,  setAddingClient]  = useState(false)

  // ── Quick-Add Product/Asset State ──
  const [prodName,      setProdName]      = useState('')
  const [prodSku,       setProdSku]       = useState('')
  const [prodCategory,  setProdCategory]  = useState('Construction Material')
  const [prodPrice,     setProdPrice]     = useState('')
  const [prodCost,      setProdCost]      = useState('')
  const [addingProduct, setAddingProduct] = useState(false)

  // ── Auto-select client if ID is passed in the URL search params ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const clientParam = params.get('clientId')
      if (clientParam) {
        setClientId(clientParam)
      }
    }
  }, [])

  // ── Auto-calc default negotiated fee based on SQFT rates ──
  useEffect(() => {
    const area = Number(areaSqft) || 0
    const rate = Number(rateSqft) || 0
    if (area > 0 && rate > 0) {
      setAgreedFee(String(area * rate))
    }
  }, [areaSqft, rateSqft])

  // Handle service checkbox toggles
  const handleServiceToggle = (sType: string) => {
    if (selServices.includes(sType)) {
      setSelServices(selServices.filter(s => s !== sType))
    } else {
      setSelServices([...selServices, sType])
    }
  }

  // Handle Client Quick-Add Submit
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !clientPhone.trim()) {
      toast.error('Client name and phone are required')
      return
    }
    setAddingClient(true)
    const newClient = await createClientRecord({
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
      address: clientAddress,
      city: clientCity,
      state: clientState,
      notes: clientNotes,
      gstin: clientGstin
    })
    setAddingClient(false)

    if (newClient) {
      setClientId(newClient.id) // Pre-select the newly added client
      setClientModalOpen(false)
      // reset client fields
      setClientName('')
      setClientPhone('')
      setClientEmail('')
      setClientAddress('')
      setClientCity('')
      setClientNotes('')
      setClientGstin('')
    }
  }

  // Handle Product Quick-Add Submit (inserts into products catalog table)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodName.trim()) {
      toast.error('Product name is required')
      return
    }
    setAddingProduct(true)
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: prodName.trim(),
          sku: prodSku.trim() || null,
          category: prodCategory.trim() || 'Architecture Asset',
          selling_price: Number(prodPrice) || 0,
          purchase_price: Number(prodCost) || 0,
          unit_name: 'piece',
          track_inventory: false,
          is_active: true
        })

      if (error) throw error
      toast.success(`Registered asset: ${prodName}`)
      setProductModalOpen(false)
      // reset product fields
      setProdName('')
      setProdSku('')
      setProdPrice('')
      setProdCost('')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Could not register product asset')
    } finally {
      setAddingProduct(false)
    }
  }

  // Submit Project Form
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Project title is required')
      return
    }
    if (!clientId) {
      toast.error('Please select or register a client')
      return
    }
    if (selServices.length === 0) {
      toast.error('Please include at least one execution service')
      return
    }

    setSubmitting(true)
    const newProjId = await createProject({
      client_id: clientId,
      title,
      type: type as any,
      location,
      city,
      state,
      area_sqft: areaSqft,
      rate_per_sqft: rateSqft,
      agreed_fee: agreedFee,
      scope_notes: scopeNotes,
      internal_notes: internalNotes,
      services: selServices as any
    })
    setSubmitting(false)

    if (newProjId) {
      router.push(`/portfolio/admin/projects/${newProjId}`)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto bg-background">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 shrink-0 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Create Studio Project
          </h1>
          <p className="text-xs text-muted-foreground">
            Register a client contract, set up service phases, and seed execution logs.
          </p>
        </div>
      </div>

      {/* ── Main Form Layout ── */}
      <form onSubmit={handleProjectSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-2">
        
        {/* Left Columns: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2 border-b pb-2">
              <Briefcase className="size-4 text-violet-500" />
              Contract Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Title */}
              <Field>
                <Label required>Project Name / Title</Label>
                <Input
                  placeholder="e.g. Modern Villa Interior Design"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-lg shadow-none"
                  required
                />
              </Field>

              {/* Client Selector with Quick Add */}
              <Field>
                <div className="flex justify-between items-center">
                  <Label required>Client</Label>
                  <button
                    type="button"
                    onClick={() => setClientModalOpen(true)}
                    className="text-[10px] font-bold text-violet-600 hover:text-violet-800 hover:underline flex items-center gap-1 leading-none"
                  >
                    <Plus className="size-3" /> New Client
                  </button>
                </div>
                <NativeSelect
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-lg shadow-none"
                >
                  <NativeSelectOption value="">Select Client...</NativeSelectOption>
                  {clients.map(c => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              {/* Project Category */}
              <Field>
                <Label required>Project Category</Label>
                <NativeSelect
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg shadow-none"
                >
                  {PROJECT_TYPES.map(t => (
                    <NativeSelectOption key={t.value} value={t.value}>
                      {t.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              {/* Site Location Address */}
              <Field>
                <Label>Site Address / Location</Label>
                <Input
                  placeholder="e.g. Plot 24, Vaishali Nagar"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-lg shadow-none"
                />
              </Field>

              {/* City */}
              <Field>
                <Label>City</Label>
                <Input
                  placeholder="e.g. Jodhpur"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-lg shadow-none"
                />
              </Field>

              {/* State */}
              <Field>
                <Label>State</Label>
                <Input
                  placeholder="e.g. Rajasthan"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="rounded-lg shadow-none"
                />
              </Field>
            </div>
          </div>

          {/* Pricing & Dimensions Card */}
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2 border-b pb-2">
              <Sparkles className="size-4 text-amber-500" />
              Dimensions & Financials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sqft area */}
              <Field>
                <Label>Area (Sqft)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2400"
                  value={areaSqft}
                  onChange={(e) => setAreaSqft(e.target.value)}
                  className="rounded-lg shadow-none"
                />
              </Field>

              {/* Rate per sqft */}
              <Field>
                <Label>Rate (₹/Sqft)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 150"
                  value={rateSqft}
                  onChange={(e) => setRateSqft(e.target.value)}
                  className="rounded-lg shadow-none"
                />
              </Field>

              {/* Negotiated Fee */}
              <Field>
                <Label required>Agreed Contract Fee (₹)</Label>
                <Input
                  type="number"
                  placeholder="Calculated or Negotiated fee"
                  value={agreedFee}
                  onChange={(e) => setAgreedFee(e.target.value)}
                  className="rounded-lg font-bold text-foreground bg-violet-50/20 dark:bg-violet-950/10 border-violet-100 dark:border-violet-900"
                  required
                />
              </Field>
            </div>

            {/* Scope Notes */}
            <Field>
              <Label>Scope Brief / Client Brief</Label>
              <Textarea
                placeholder="List key elements included in the design scope (visible on documents)..."
                value={scopeNotes}
                onChange={(e) => setScopeNotes(e.target.value)}
                className="rounded-lg min-h-[80px]"
              />
            </Field>

            {/* Private Notes */}
            <Field>
              <Label>Internal Private Notes</Label>
              <Textarea
                placeholder="Referrals, private comments, construction constraints (never shown on prints)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="rounded-lg min-h-[60px]"
              />
            </Field>
          </div>
        </div>

        {/* Right Column: Services Scope & Actions */}
        <div className="space-y-6">
          {/* Services Selector Card */}
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground border-b pb-2">
              Included Services
            </h3>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Selecting services automatically allocates timeline templates and generates stage tasks.
            </p>

            <div className="space-y-3 pt-2">
              {SERVICES_OPTS.map(opt => {
                const isSelected = selServices.includes(opt.value)
                return (
                  <label
                    key={opt.value}
                    onClick={() => handleServiceToggle(opt.value)}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors select-none",
                      isSelected ? "border-violet-200 bg-violet-50/20 dark:border-violet-900 dark:bg-violet-950/10" : ""
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="size-4 rounded border-input text-violet-600 focus:ring-violet-500 shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground/90">{opt.label}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Catalog Tool Quick-Add button */}
          <div className="border rounded-xl p-5 bg-card text-center space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Catalog Tool</h4>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Register construction materials, structural elements, or rendering assets to the ERP products table inline.
            </p>
            <Button
              type="button"
              onClick={() => setProductModalOpen(true)}
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1 shadow-none"
            >
              <PackagePlus className="size-3.5" />
              Quick-Add ERP Asset
            </Button>
          </div>

          {/* Form Actions */}
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-bold shadow-xs py-5"
            >
              {submitting ? 'Creating Project & Stages...' : 'Save & Initialize Project'}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/portfolio/admin/projects')}
              variant="outline"
              className="w-full text-xs shadow-none"
            >
              Cancel
            </Button>
          </div>
        </div>

      </form>

      {/* ── Dialog 1: Quick-Add Client Form ── */}
      <Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <UserPlus className="size-4 text-violet-500" />
              Quick-Add Client
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleClientSubmit} className="space-y-4 my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field>
                <Label required>Client Name</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                />
              </Field>
              <Field>
                <Label required>Phone Number</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </Field>
              <Field>
                <Label>Email</Label>
                <Input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. rajesh@gmail.com"
                  type="email"
                />
              </Field>
              <Field>
                <Label>GSTIN</Label>
                <Input
                  value={clientGstin}
                  onChange={(e) => setClientGstin(e.target.value)}
                  placeholder="e.g. 08AAAAA1111A1Z1"
                />
              </Field>
              <Field>
                <Label>City</Label>
                <Input
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  placeholder="e.g. Jaipur"
                />
              </Field>
              <Field>
                <Label>State</Label>
                <Input
                  value={clientState}
                  onChange={(e) => setClientState(e.target.value)}
                  placeholder="e.g. Rajasthan"
                />
              </Field>
            </div>
            <Field>
              <Label>Address</Label>
              <Input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="e.g. Mansarovar"
              />
            </Field>
            <Field>
              <Label>Referral / Project Notes</Label>
              <Textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Referral source, special client briefs..."
                className="min-h-[50px]"
              />
            </Field>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setClientModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingClient}>
                {addingClient ? 'Registering...' : 'Register Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog 2: Quick-Add Product Asset Form ── */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <PackagePlus className="size-4 text-amber-500" />
              Register ERP Asset / Material
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4 my-2">
            <Field>
              <Label required>Asset / Item Name</Label>
              <Input
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. 12mm TMT Steel bar"
                required
              />
            </Field>
            <Field>
              <Label>SKU / Model Code</Label>
              <Input
                value={prodSku}
                onChange={(e) => setProdSku(e.target.value)}
                placeholder="e.g. TMT-12"
              />
            </Field>
            <Field>
              <Label>Asset Category</Label>
              <Input
                value={prodCategory}
                onChange={(e) => setProdCategory(e.target.value)}
                placeholder="e.g. Construction Material"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Selling Price (₹)</Label>
                <Input
                  type="number"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="e.g. 450"
                />
              </Field>
              <Field>
                <Label>Purchase Cost (₹)</Label>
                <Input
                  type="number"
                  value={prodCost}
                  onChange={(e) => setProdCost(e.target.value)}
                  placeholder="e.g. 380"
                />
              </Field>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setProductModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingProduct}>
                {addingProduct ? 'Registering...' : 'Register Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
