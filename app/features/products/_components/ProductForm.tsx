'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Loader2, AlertCircle, Info } from 'lucide-react'
import type { Product, ProductFormValues } from './types'
import { EMPTY_FORM } from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function toForm(p: Product): ProductFormValues {
  return {
    name:               p.name,
    sku:                p.sku ?? '',
    description:        p.description ?? '',
    category:           p.category ?? '',
    unit_name:          p.unit_name,
    selling_price:      String(p.selling_price),
    purchase_price:     String(p.purchase_price),
    gst_rate:           String(p.gst_rate),
    is_active:          p.is_active,
    has_box:            p.has_box,
    box_name:           p.box_name ?? '',
    units_per_box:      p.units_per_box != null ? String(p.units_per_box) : '',
    box_purchase_price: p.box_purchase_price != null ? String(p.box_purchase_price) : '',
    box_selling_price:  p.box_selling_price  != null ? String(p.box_selling_price)  : '',
    track_inventory:    p.track_inventory,
    opening_stock:      '',   // never pre-filled on edit
    minimum_stock:      String(p.minimum_stock),
  }
}

function autoSku(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.slice(0, 3))
    .join('-')
    .slice(0, 20)
}

// ─── sub-components ───────────────────────────────────────────────────────────

function FieldRow({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
      </Label>
      <div className="space-y-1">
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

function SwitchRow({ label, checked, onCheckedChange, description }: {
  label: string; checked: boolean; onCheckedChange: (v: boolean) => void; description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

// ─── main form ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  product: Product | null   // null = add mode
  categories: string[]
  onClose: () => void
  onSubmit: (values: ProductFormValues) => Promise<boolean>
}

export function ProductForm({ open, product, categories, onClose, onSubmit }: Props) {
  const isEdit = !!product
  const [form,    setForm]    = useState<ProductFormValues>(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState<Partial<Record<keyof ProductFormValues, string>>>({})
  const [warnBelowCost, setWarnBelowCost] = useState(false)

  // Populate form when product changes
  useEffect(() => {
    if (open) {
      setForm(product ? toForm(product) : { ...EMPTY_FORM })
      setErrors({})
      setWarnBelowCost(false)
    }
  }, [open, product])

  const set = useCallback(<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }

      // Auto-suggest box_purchase_price when units_per_box or purchase_price changes
      if ((key === 'units_per_box' || key === 'purchase_price') && next.has_box) {
        const upb = parseInt(next.units_per_box)
        const pp  = parseFloat(next.purchase_price)
        if (upb > 0 && pp > 0 && !next.box_purchase_price) {
          next.box_purchase_price = String((upb * pp).toFixed(2))
        }
      }

      // Warn if selling below cost
      if (key === 'selling_price' || key === 'purchase_price') {
        const sp = parseFloat(next.selling_price)
        const pp = parseFloat(next.purchase_price)
        setWarnBelowCost(sp > 0 && pp > 0 && sp < pp)
      }

      return next
    })
    // Clear field error on change
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }, [])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.name.trim())                            e.name           = 'Required'
    if (!form.unit_name.trim())                       e.unit_name      = 'Required'
    if (!form.purchase_price || parseFloat(form.purchase_price) <= 0)
                                                      e.purchase_price = 'Must be > 0'
    if (!form.selling_price  || parseFloat(form.selling_price)  <= 0)
                                                      e.selling_price  = 'Must be > 0'
    if (form.has_box) {
      if (!form.box_name.trim())                      e.box_name       = 'Required'
      const upb = parseInt(form.units_per_box)
      if (!upb || upb < 2)                            e.units_per_box  = 'Must be ≥ 2'
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
    const ok = await onSubmit(form)
    setSaving(false)
    if (ok) onClose()
  }

  function err(key: keyof ProductFormValues) {
    return errors[key]
      ? <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" />{errors[key]}</p>
      : null
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-[98vw] lg:w-[900px] lg:max-w-[900px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden">
  <SheetHeader className="px-6 py-4 border-b shrink-0 bg-background">
          <SheetTitle>{isEdit ? 'Edit Product' : 'Add Product'}</SheetTitle>
          <SheetDescription>
            {isEdit ? `Editing "${product.name}"` : 'Create a new product in your catalog'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ── Section 1: Basic Info ─────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Basic Info</p>

              <FieldRow label="Product Name" required>
                <Input
                  value={form.name}
                  onChange={e => {
                    set('name', e.target.value)
                    // Auto-suggest SKU only on add and if SKU is still empty
                    if (!isEdit && !form.sku) set('sku', autoSku(e.target.value))
                  }}
                  placeholder="e.g. Blue Pen"
                  aria-invalid={!!errors.name}
                />
                {err('name')}
              </FieldRow>

              <FieldRow label="SKU" hint="Leave blank to use the auto-suggested value. Must be unique.">
                <Input
                  value={form.sku}
                  onChange={e => set('sku', e.target.value.toUpperCase())}
                  placeholder="e.g. BLU-PEN"
                  className="font-mono"
                />
              </FieldRow>

              <FieldRow label="Category">
                <Input
                  list="category-suggestions"
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  placeholder="e.g. Stationery"
                />
                <datalist id="category-suggestions">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </FieldRow>

              <FieldRow label="Description">
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={2}
                  placeholder="Optional short note"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                />
              </FieldRow>

              <SwitchRow
                label="Active"
                description="Inactive products are hidden from Sales and Purchases"
                checked={form.is_active}
                onCheckedChange={v => set('is_active', v)}
              />
            </div>

            <Separator />

            {/* ── Section 2: Pricing ───────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing</p>

              <FieldRow label="Unit Name" required hint="e.g. piece, kg, litre, bottle">
                <Input
                  value={form.unit_name}
                  onChange={e => set('unit_name', e.target.value)}
                  placeholder="piece"
                  aria-invalid={!!errors.unit_name}
                />
                {err('unit_name')}
              </FieldRow>

              <FieldRow label="Purchase Price" required hint="Cost per single unit">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.purchase_price}
                    onChange={e => set('purchase_price', e.target.value)}
                    className="pl-7"
                    aria-invalid={!!errors.purchase_price}
                  />
                </div>
                {err('purchase_price')}
              </FieldRow>

              <FieldRow label="Selling Price" required hint="Price per single unit">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.selling_price}
                    onChange={e => set('selling_price', e.target.value)}
                    className="pl-7"
                    aria-invalid={!!errors.selling_price}
                  />
                </div>
                {err('selling_price')}
                {warnBelowCost && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Info className="size-3" /> Selling below purchase cost
                  </p>
                )}
              </FieldRow>

              <FieldRow label="GST Rate" hint="Default GST % for this product">
                <div className="relative">
                  <Input
                    type="number" min="0" max="100" step="0.01"
                    value={form.gst_rate}
                    onChange={e => set('gst_rate', e.target.value)}
                    className="pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </FieldRow>
            </div>

            <Separator />

            {/* ── Section 3: Box Packaging ─────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Box Packaging</p>

              <SwitchRow
                label="Has Box Packaging"
                description="Enable if this product is sold or bought in boxes"
                checked={form.has_box}
                onCheckedChange={v => set('has_box', v)}
              />

              {form.has_box && (
                <div className="space-y-3 rounded-lg border p-3">
                  <FieldRow label="Box Name" required hint="e.g. dozen, carton, pack">
                    <Input
                      value={form.box_name}
                      onChange={e => set('box_name', e.target.value)}
                      placeholder="dozen"
                      aria-invalid={!!errors.box_name}
                    />
                    {err('box_name')}
                  </FieldRow>

                  <FieldRow label="Units Per Box" required hint="How many base units fit in one box (min 2)">
                    <Input
                      type="number" min="2" step="1"
                      value={form.units_per_box}
                      onChange={e => set('units_per_box', e.target.value)}
                      aria-invalid={!!errors.units_per_box}
                    />
                    {err('units_per_box')}
                  </FieldRow>

                  <FieldRow label="Box Purchase Price" hint="Auto-calculated from units × purchase price. You can override.">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        type="number" min="0" step="0.01"
                        value={form.box_purchase_price}
                        onChange={e => set('box_purchase_price', e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </FieldRow>

                  <FieldRow label="Box Selling Price" required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        type="number" min="0" step="0.01"
                        value={form.box_selling_price}
                        onChange={e => set('box_selling_price', e.target.value)}
                        className="pl-7"
                        aria-invalid={!!errors.box_selling_price}
                      />
                    </div>
                    {err('box_selling_price')}
                  </FieldRow>
                </div>
              )}
            </div>

            <Separator />

            {/* ── Section 4: Inventory Tracking ────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inventory</p>

              <SwitchRow
                label="Track Inventory"
                description="If off, stock is never decremented on sale"
                checked={form.track_inventory}
                onCheckedChange={v => set('track_inventory', v)}
              />

              {form.track_inventory && (
                <>
                  {!isEdit && (
                    <FieldRow label="Opening Stock" hint="Creates an opening_stock movement entry">
                      <Input
                        type="number" min="0" step="0.001"
                        value={form.opening_stock}
                        onChange={e => set('opening_stock', e.target.value)}
                        placeholder="0"
                      />
                    </FieldRow>
                  )}

                  <FieldRow label="Minimum Stock" hint="Low-stock alert threshold">
                    <Input
                      type="number" min="0" step="0.001"
                      value={form.minimum_stock}
                      onChange={e => set('minimum_stock', e.target.value)}
                    />
                  </FieldRow>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2 bg-background">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : isEdit ? 'Save Changes' : 'Add Product'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
