'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertCircle, Info, PackageOpen } from 'lucide-react'
import { useProducts } from '@/lib/services/useProducts'
import type { ProductFormValues } from '@/app/features/products/_components/types'
import { EMPTY_FORM } from '@/app/features/products/_components/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

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

const GST_RATES = ['0', '5', '12', '18', '28']

interface Props {
  onSuccess?: () => void
}

export function ProductFormSlide({ onSuccess }: Props) {
  const { categories, addProduct } = useProducts()
  const [form, setForm] = useState<ProductFormValues>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({})
  const [warnBelowCost, setWarnBelowCost] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Reset form when slide becomes active
  useEffect(() => {
    setForm({ ...EMPTY_FORM })
    setErrors({})
    setWarnBelowCost(false)
    setSubmitted(false)
  }, [])

  const set = useCallback(<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if ((key === 'units_per_box' || key === 'purchase_price') && next.has_box) {
        const upb = parseInt(next.units_per_box)
        const pp = parseFloat(next.purchase_price)
        if (upb > 0 && pp > 0 && !next.box_purchase_price) {
          next.box_purchase_price = String((upb * pp).toFixed(2))
        }
      }
      if (key === 'selling_price' || key === 'purchase_price') {
        const sp = parseFloat(next.selling_price)
        const pp = parseFloat(next.purchase_price)
        setWarnBelowCost(sp > 0 && pp > 0 && sp < pp)
      }
      return next
    })
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }, [])

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.unit_name.trim()) e.unit_name = 'Required'
    if (!form.purchase_price || parseFloat(form.purchase_price) <= 0) e.purchase_price = 'Must be > 0'
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) e.selling_price = 'Must be > 0'
    if (form.has_box) {
      if (!form.box_name.trim()) e.box_name = 'Required'
      const upb = parseInt(form.units_per_box)
      if (!upb || upb < 2) e.units_per_box = 'Must be ≥ 2'
      if (!form.box_selling_price || parseFloat(form.box_selling_price) <= 0) e.box_selling_price = 'Must be > 0'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const ok = await addProduct(form)
    setSaving(false)
    if (ok) {
      setSubmitted(true)
      setForm({ ...EMPTY_FORM })
      setErrors({})
      setWarnBelowCost(false)
      setTimeout(() => setSubmitted(false), 2000)
      onSuccess?.()
    }
  }

  function FieldError({ field }: { field: keyof ProductFormValues }) {
    const msg = errors[field]
    if (!msg) return null
    return (
      <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
        <AlertCircle className="size-3 shrink-0" />
        {msg}
      </p>
    )
  }

  return (
    <form id="instant-product-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
      {submitted && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          Product added successfully! Form ready for another entry.
        </div>
      )}

      {/* Section 1: Basic Info */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
          <p className="text-xs text-muted-foreground">General details and identifiers for this product.</p>
        </div>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="ip-name">Product Name</FieldLabel>
            <Input
              id="ip-name"
              value={form.name}
              onChange={e => {
                set('name', e.target.value)
                if (!form.sku) set('sku', autoSku(e.target.value))
              }}
              placeholder="e.g. Blue Pen"
              aria-invalid={!!errors.name}
            />
            <FieldError field="name" />
          </Field>

          <Field>
            <FieldLabel htmlFor="ip-sku">SKU</FieldLabel>
            <FieldDescription>Leave blank to use the auto-suggested value. Must be unique.</FieldDescription>
            <Input
              id="ip-sku"
              value={form.sku}
              onChange={e => set('sku', e.target.value.toUpperCase())}
              placeholder="e.g. BLU-PEN"
              className="font-mono"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="ip-category">Category</FieldLabel>
            <Input
              id="ip-category"
              list="ip-category-suggestions"
              value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="e.g. Stationery"
            />
            <datalist id="ip-category-suggestions">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </Field>

          <Field>
            <FieldLabel htmlFor="ip-description">Description</FieldLabel>
            <Textarea
              id="ip-description"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Optional short note about this product"
              className="resize-none"
            />
          </Field>

          <FieldSeparator />

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="ip-is-active">Active</FieldLabel>
              <FieldDescription>Inactive products are hidden from Sales and Purchases.</FieldDescription>
            </FieldContent>
            <Switch
              id="ip-is-active"
              checked={form.is_active}
              onCheckedChange={v => set('is_active', v)}
            />
          </Field>
        </FieldGroup>
      </div>

      <Separator />

      {/* Section 2: Pricing */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Pricing</h3>
          <p className="text-xs text-muted-foreground">Define your base unit pricing, cost, and tax rates.</p>
        </div>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="ip-unit-name">Unit Name</FieldLabel>
            <FieldDescription>The base unit used for pricing and stock — e.g. piece, kg, litre, bottle.</FieldDescription>
            <Input
              id="ip-unit-name"
              value={form.unit_name}
              onChange={e => set('unit_name', e.target.value)}
              placeholder="piece"
              aria-invalid={!!errors.unit_name}
            />
            <FieldError field="unit_name" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="ip-purchase-price">Purchase Price</FieldLabel>
              <InputGroup>
                <InputGroupAddon><InputGroupText>₹</InputGroupText></InputGroupAddon>
                <InputGroupInput
                  id="ip-purchase-price"
                  type="number" min="0" step="0.01"
                  value={form.purchase_price}
                  onChange={e => set('purchase_price', e.target.value)}
                  aria-invalid={!!errors.purchase_price}
                />
              </InputGroup>
              <FieldError field="purchase_price" />
            </Field>

            <Field>
              <FieldLabel htmlFor="ip-selling-price">Selling Price</FieldLabel>
              <InputGroup>
                <InputGroupAddon><InputGroupText>₹</InputGroupText></InputGroupAddon>
                <InputGroupInput
                  id="ip-selling-price"
                  type="number" min="0" step="0.01"
                  value={form.selling_price}
                  onChange={e => set('selling_price', e.target.value)}
                  aria-invalid={!!errors.selling_price}
                />
              </InputGroup>
              <FieldError field="selling_price" />
              {warnBelowCost && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
                  <Info className="size-3 shrink-0" />
                  Selling below purchase cost
                </p>
              )}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="ip-gst-rate">GST Rate</FieldLabel>
            <FieldDescription>Default GST percentage applied to this product.</FieldDescription>
            <Select value={form.gst_rate} onValueChange={v => set('gst_rate', v ?? '0')}>
              <SelectTrigger id="ip-gst-rate" className="w-full">
                <SelectValue placeholder="Select GST rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {GST_RATES.map(rate => (
                    <SelectItem key={rate} value={rate}>{rate}%</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </div>

      <Separator />

      {/* Section 3: Box Packaging */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Box Packaging</h3>
          <p className="text-xs text-muted-foreground">Enable box sizing if you buy or sell in bulk packages.</p>
        </div>
        <FieldGroup className="gap-4">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="ip-has-box">Has Box Packaging</FieldLabel>
              <FieldDescription>Enable if this product is sold or purchased in boxes.</FieldDescription>
            </FieldContent>
            <Switch
              id="ip-has-box"
              checked={form.has_box}
              onCheckedChange={v => set('has_box', v)}
            />
          </Field>

          {form.has_box && (
            <>
              <FieldSeparator />
              <div className="rounded-lg border bg-muted/30 px-4 py-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PackageOpen className="size-4" />
                  Box details
                </div>
                <FieldGroup className="gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="ip-box-name">Box Name</FieldLabel>
                      <FieldDescription>e.g. dozen, carton, pack</FieldDescription>
                      <Input
                        id="ip-box-name"
                        value={form.box_name}
                        onChange={e => set('box_name', e.target.value)}
                        placeholder="dozen"
                        aria-invalid={!!errors.box_name}
                      />
                      <FieldError field="box_name" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="ip-units-per-box">Units Per Box</FieldLabel>
                      <FieldDescription>Min. 2 base units per box</FieldDescription>
                      <Input
                        id="ip-units-per-box"
                        type="number" min="2" step="1"
                        value={form.units_per_box}
                        onChange={e => set('units_per_box', e.target.value)}
                        aria-invalid={!!errors.units_per_box}
                      />
                      <FieldError field="units_per_box" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="ip-box-purchase-price">Box Purchase Price</FieldLabel>
                      <FieldDescription>Auto-calculated. You can override.</FieldDescription>
                      <InputGroup>
                        <InputGroupAddon><InputGroupText>₹</InputGroupText></InputGroupAddon>
                        <InputGroupInput
                          id="ip-box-purchase-price"
                          type="number" min="0" step="0.01"
                          value={form.box_purchase_price}
                          onChange={e => set('box_purchase_price', e.target.value)}
                        />
                      </InputGroup>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="ip-box-selling-price">Box Selling Price</FieldLabel>
                      <InputGroup>
                        <InputGroupAddon><InputGroupText>₹</InputGroupText></InputGroupAddon>
                        <InputGroupInput
                          id="ip-box-selling-price"
                          type="number" min="0" step="0.01"
                          value={form.box_selling_price}
                          onChange={e => set('box_selling_price', e.target.value)}
                          aria-invalid={!!errors.box_selling_price}
                        />
                      </InputGroup>
                      <FieldError field="box_selling_price" />
                    </Field>
                  </div>
                </FieldGroup>
              </div>
            </>
          )}
        </FieldGroup>
      </div>

      <Separator />

      {/* Section 4: Inventory */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Inventory</h3>
          <p className="text-xs text-muted-foreground">Configure stock tracking and low-stock alerts.</p>
        </div>
        <FieldGroup className="gap-4">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="ip-track-inventory">Track Inventory</FieldLabel>
              <FieldDescription>If off, stock is never decremented on sale.</FieldDescription>
            </FieldContent>
            <Switch
              id="ip-track-inventory"
              checked={form.track_inventory}
              onCheckedChange={v => set('track_inventory', v)}
            />
          </Field>

          {form.track_inventory && (
            <>
              <FieldSeparator />
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="ip-opening-stock">Opening Stock</FieldLabel>
                  <FieldDescription>Creates an opening stock entry.</FieldDescription>
                  <Input
                    id="ip-opening-stock"
                    type="number" min="0" step="0.001"
                    value={form.opening_stock}
                    onChange={e => set('opening_stock', e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ip-minimum-stock">Minimum Stock</FieldLabel>
                  <FieldDescription>Low-stock alert threshold.</FieldDescription>
                  <Input
                    id="ip-minimum-stock"
                    type="number" min="0" step="0.001"
                    value={form.minimum_stock}
                    onChange={e => set('minimum_stock', e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}
        </FieldGroup>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="w-full h-11 text-sm font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Adding Product…
            </>
          ) : 'Add Product'}
        </Button>
      </div>
    </form>
  )
}
