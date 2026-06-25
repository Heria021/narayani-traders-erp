'use client'

import React, { useState, useEffect } from 'react'
import { usePortfolio } from '../../_components/usePortfolio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  Sliders,
  MessageCircle,
  Plus,
  X,
  Database
} from 'lucide-react'

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)
import { toast } from 'sonner'

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-foreground/80">
      {children}
    </label>
  )
}

export default function StudioSettingsPage() {
  const { settings, loading, isDbMissing, updateSettings, refresh } = usePortfolio()

  // ── Form Input States ──
  const [tagline,      setTagline]      = useState('')
  const [bio,          setBio]          = useState('')
  const [instagram,    setInstagram]    = useState('')
  const [facebook,     setFacebook]     = useState('')
  const [pinterest,    setPinterest]    = useState('')
  const [whatsapp,     setWhatsapp]     = useState('')
  const [services,     setServices]     = useState<string[]>([])
  
  const [newService,   setNewService]   = useState('')
  const [saving,       setSaving]       = useState(false)

  // Populate form fields when settings load
  useEffect(() => {
    if (settings) {
      setTagline(settings.tagline || '')
      setBio(settings.biography || '')
      setInstagram(settings.social_instagram || '')
      setFacebook(settings.social_facebook || '')
      setPinterest(settings.social_pinterest || '')
      setWhatsapp(settings.whatsapp_number || '')
      setServices(settings.services || [])
    }
  }, [settings])

  // Handle service tag additions
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newService.trim()
    if (!trimmed) return
    if (services.includes(trimmed)) {
      toast.error('Service offering already added')
      return
    }
    setServices([...services, trimmed])
    setNewService('')
  }

  // Handle service tag removal
  const handleRemoveService = (serviceToRemove: string) => {
    setServices(services.filter(s => s !== serviceToRemove))
  }

  // Submit Settings Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const success = await updateSettings({
      tagline: tagline.trim() || null,
      biography: bio.trim() || null,
      social_instagram: instagram.trim() || null,
      social_facebook: facebook.trim() || null,
      social_pinterest: pinterest.trim() || null,
      whatsapp_number: whatsapp.trim() || null,
      services: services
    })
    setSaving(false)
    if (success) {
      toast.success('Studio settings saved successfully')
    }
  }

  if (isDbMissing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background min-h-[500px]">
        <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <Sliders className="size-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Database Setup Warning</h2>
        <p className="text-sm text-muted-foreground max-w-sm mt-2 leading-relaxed">
          Please run the schema SQL script in your Supabase SQL Editor first.
        </p>
        <Button onClick={() => refresh()} className="mt-8">
          Verify Database Tables
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-6 overflow-y-auto [scrollbar-width:thin] bg-background">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            Studio Profile Configuration
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure taglines, contact numbers, and service offerings displayed on your public architectural portfolio.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full animate-pulse" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mt-2 pb-12">
          
          {/* Left panel: Biography & taglines */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-xl p-5 bg-card space-y-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground border-b pb-2 flex items-center gap-1.5">
                <Sparkles className="size-4 text-violet-500" />
                Biography & Profile Text
              </h3>

              <div className="space-y-4">
                {/* Tagline */}
                <Field>
                  <Label>Professional Tagline</Label>
                  <Input
                    placeholder="e.g. Designing Spaces, Crafting Experiences"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="rounded-lg shadow-none"
                  />
                </Field>

                {/* Biography */}
                <Field>
                  <Label>Studio Biography / About Details</Label>
                  <Textarea
                    placeholder="Describe your design style, history, tools, and visual brief..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="rounded-lg min-h-[140px]"
                  />
                </Field>
              </div>
            </div>

            {/* Social media links */}
            <div className="border rounded-xl p-5 bg-card space-y-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground border-b pb-2 flex items-center gap-1.5">
                <Instagram className="size-4 text-rose-500" />
                Social Channels & Click-to-Chat
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instagram */}
                <Field>
                  <Label>Instagram Link</Label>
                  <div className="relative">
                    <Instagram className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      placeholder="https://instagram.com/studio"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="pl-9 rounded-lg shadow-none"
                    />
                  </div>
                </Field>

                {/* Facebook */}
                <Field>
                  <Label>Facebook Link</Label>
                  <div className="relative">
                    <Facebook className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      placeholder="https://facebook.com/studio"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="pl-9 rounded-lg shadow-none"
                    />
                  </div>
                </Field>

                {/* Pinterest */}
                <Field>
                  <Label>Pinterest Link</Label>
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50 font-bold font-mono text-center text-xs">P</div>
                    <Input
                      placeholder="https://pinterest.com/studio"
                      value={pinterest}
                      onChange={(e) => setPinterest(e.target.value)}
                      className="pl-9 rounded-lg shadow-none"
                    />
                  </div>
                </Field>

                {/* WhatsApp Click-to-Chat */}
                <Field>
                  <Label>WhatsApp Number (with country code)</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
                    <Input
                      placeholder="e.g. 919876543210 (No spaces or +)"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="pl-9 rounded-lg shadow-none"
                    />
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Right panel: dynamic Service Offerings Tags list */}
          <div className="space-y-6">
            <div className="border rounded-xl p-5 bg-card space-y-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground border-b pb-2 flex items-center gap-1.5">
                <Sliders className="size-4 text-amber-500" />
                Service Offerings List
              </h3>
              <p className="text-[10px] text-muted-foreground leading-normal">
                These are tags displayed under your public catalog pages.
              </p>

              {/* Tag Editor Form */}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Structural Drawing"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="rounded-lg shadow-none h-8 text-xs"
                />
                <Button type="button" onClick={handleAddService} size="sm" className="h-8 px-2">
                  <Plus className="size-3.5" />
                </Button>
              </div>

              {/* Services badges list */}
              <div className="flex flex-wrap gap-2 pt-2">
                {services.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">No custom services listed</span>
                ) : (
                  services.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs font-semibold px-2 py-1 gap-1 border">
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(s)}
                        className="text-muted-foreground hover:text-foreground text-[10px] shrink-0"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="space-y-3">
              <Button type="submit" disabled={saving} className="w-full font-bold shadow-xs py-5">
                {saving ? 'Saving Configurations...' : 'Save Profile Config'}
              </Button>
            </div>
          </div>

        </form>
      )}

    </div>
  )
}
