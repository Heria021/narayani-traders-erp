'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle } from 'lucide-react'
import type { QuickProductFormValues } from './types'
import { EMPTY_QUICK_PRODUCT } from './types'

interface Props {
  open: boolean
  initialName: string
  onClose: () => void
  onSave: (values: QuickProductFormValues) => Promise<boolean>
}

function FieldRow({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" />{error}
        </p>
      )}
    </div>
  )
}

export function ProductQuickAdd({ open, initialName, onClose, onSave }: Props) {
  const [form,   setForm]   = useState<QuickProductFormValues>(EMPTY_QUICK_PRODUCT)
  const [errors, setErrors] = useState<Partial<Record<keyof QuickProductFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_QUICK_PRODUCT, name: initialName })
      setErrors({})
      setSaving(false)
    }
  }, [open, initialName])

  function set<K extends keyof QuickProductFormValues>(key: K, val: QuickProductFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.name.trim())          e.name          = 'Required'
    if (!form.unit_name.trim())     e.unit_name     = 'Required'
    if (!form.purchase_price || parseFloat(form.purchase_price) <= 0)
                                    e.purchase_price= 'Must be > 0'
    if (!form.selling_price  || parseFloat(form.selling_price)  <= 0)
                                    e.selling_price = 'Must be > 0'
    if (form.has_box) {
      if (!form.box_name.trim())    e.box_name      = 'Required'
      if (!form.units_per_box || parseInt(form.units_per_box) < 2)
                                    e.units_per_box = 'Min 2'
      if (!form.box_purchase_price || parseFloat(form.box_purchase_price) <= 0)
                                    e.box_purchase_price = 'Required'
      if (!form.box_selling_price || parseFloat(form.box_selling_price) <= 0)
                                    e.box_selling_price = 'Must be > 0'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await onSave(form)
    if (!ok) setSaving(false)
    // parent closes if ok
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 shrink-0">
          <DialogTitle className="text-base font-bold">Quick Add Product</DialogTitle>
          <DialogDescription className="text-xs">
            This purchase will create the first stock entry. No opening stock needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 [scrollbar-width:thin]">

            {/* Name + Unit */}
            <FieldRow label="Product Name" required error={errors.name}>
              <Input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Pilot Pen V5" aria-invalid={!!errors.name} />
            </FieldRow>

            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Unit Name" required error={errors.unit_name}>
                <Input value={form.unit_name} onChange={e => set('unit_name', e.target.value)}
                  placeholder="piece" aria-invalid={!!errors.unit_name} />
              </FieldRow>
              <FieldRow label="SKU">
                <Input value={form.sku} onChange={e => set('sku', e.target.value.toUpperCase())}
                  placeholder="PLT-V5" className="font-mono" />
              </FieldRow>
            </div>

            <FieldRow label="Category">
              <Input value={form.category} onChange={e => set('category', e.target.value)}
                placeholder="Stationery" />
            </FieldRow>

            <Separator />

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Purchase Price" required error={errors.purchase_price}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input type="number" min="0" step="0.01" value={form.purchase_price}
                    onChange={e => set('purchase_price', e.target.value)}
                    className="pl-7" aria-invalid={!!errors.purchase_price} />
                </div>
              </FieldRow>
              <FieldRow label="Selling Price" required error={errors.selling_price}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input type="number" min="0" step="0.01" value={form.selling_price}
                    onChange={e => set('selling_price', e.target.value)}
                    className="pl-7" aria-invalid={!!errors.selling_price} />
                </div>
              </FieldRow>
            </div>

            <FieldRow label="GST Rate" hint="Default GST %">
              <div className="relative">
                <Input type="number" min="0" max="100" step="0.01" value={form.gst_rate}
                  onChange={e => set('gst_rate', e.target.value)} className="pr-7" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </FieldRow>

            <Separator />

            {/* Box packaging */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Has Box Packaging</p>
                <p className="text-xs text-muted-foreground">Enable if sold/bought in boxes</p>
              </div>
              <Switch checked={form.has_box} onCheckedChange={v => set('has_box', v)} />
            </div>

            {form.has_box && (
              <div className="space-y-3 rounded-lg border border-border/60 p-3">
                <FieldRow label="Box Name" required error={errors.box_name}>
                  <Input value={form.box_name} onChange={e => set('box_name', e.target.value)}
                    placeholder="dozen" aria-invalid={!!errors.box_name} />
                </FieldRow>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Units Per Box" required error={errors.units_per_box}>
                    <Input type="number" min="2" step="1" value={form.units_per_box}
                      onChange={e => set('units_per_box', e.target.value)}
                      aria-invalid={!!errors.units_per_box} />
                  </FieldRow>
                  <FieldRow label="Box Purchase ₹" required error={errors.box_purchase_price}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input type="number" min="0" step="0.01" value={form.box_purchase_price}
                        onChange={e => set('box_purchase_price', e.target.value)} className="pl-7" />
                    </div>
                  </FieldRow>
                </div>
                <FieldRow label="Box Selling Price" required error={errors.box_selling_price}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input type="number" min="0" step="0.01" value={form.box_selling_price}
                      onChange={e => set('box_selling_price', e.target.value)}
                      className="pl-7" aria-invalid={!!errors.box_selling_price} />
                  </div>
                </FieldRow>
              </div>
            )}

            <Separator />

            {/* Track inventory */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Track Inventory</p>
                <p className="text-xs text-muted-foreground">Deduct stock on sale</p>
              </div>
              <Switch checked={form.track_inventory} onCheckedChange={v => set('track_inventory', v)} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? <><Loader2 className="size-4 animate-spin mr-2" />Adding…</>
                : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
