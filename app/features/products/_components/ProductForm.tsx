'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
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
import type { Product, ProductFormValues } from './types'
import { EMPTY_FORM } from './types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function toForm(p: Product): ProductFormValues {
  return {
    name: p.name,
    sku: p.sku ?? '',
    description: p.description ?? '',
    category: p.category ?? '',
    unit_name: p.unit_name,
    selling_price: String(p.selling_price),
    purchase_price: String(p.purchase_price),
    gst_rate: String(p.gst_rate),
    is_active: p.is_active,
    has_box: p.has_box,
    box_name: p.box_name ?? '',
    units_per_box: p.units_per_box != null ? String(p.units_per_box) : '',
    box_purchase_price: p.box_purchase_price != null ? String(p.box_purchase_price) : '',
    box_selling_price: p.box_selling_price != null ? String(p.box_selling_price) : '',
    track_inventory: p.track_inventory,
    opening_stock: '',
    minimum_stock: String(p.minimum_stock),
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

// ─── types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  product: Product | null
  categories: string[]
  onClose: () => void
  onSubmit: (values: ProductFormValues) => Promise<boolean>
}

// ─── main component ───────────────────────────────────────────────────────────

export function ProductForm({ open, product, categories, onClose, onSubmit }: Props) {
  const isEdit = !!product
  const [form, setForm] = useState<ProductFormValues>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({})
  const [warnBelowCost, setWarnBelowCost] = useState(false)

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
    const ok = await onSubmit(form)
    setSaving(false)
    if (ok) onClose()
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

  const GST_RATES = ['0', '5', '12', '18', '28']

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <SheetHeader className="px-8 py-5 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-lg">
                {isEdit ? 'Edit Product' : 'Add Product'}
              </SheetTitle>
              <SheetDescription>
                {isEdit
                  ? `Editing "${product.name}"`
                  : 'Fill in the details to add a new product to your catalog.'}
              </SheetDescription>
            </div>
            {isEdit && (
              <Badge variant={product.is_active ? 'default' : 'secondary'} className="shrink-0 mt-0.5">
                {product.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* ── Scrollable body ────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
                <p className="text-xs text-muted-foreground">General details and identifiers for this product.</p>
              </div>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Product Name</FieldLabel>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => {
                      set('name', e.target.value)
                      if (!isEdit && !form.sku) set('sku', autoSku(e.target.value))
                    }}
                    placeholder="e.g. Blue Pen"
                    aria-invalid={!!errors.name}
                  />
                  <FieldError field="name" />
                </Field>

                <Field>
                  <FieldLabel htmlFor="sku">SKU</FieldLabel>
                  <FieldDescription>Leave blank to use the auto-suggested value. Must be unique.</FieldDescription>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={e => set('sku', e.target.value.toUpperCase())}
                    placeholder="e.g. BLU-PEN"
                    className="font-mono"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Input
                    id="category"
                    list="category-suggestions"
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    placeholder="e.g. Stationery"
                  />
                  <datalist id="category-suggestions">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    placeholder="Optional short note about this product"
                    className="resize-none"
                  />
                </Field>

                <FieldSeparator />

                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="is-active">Active</FieldLabel>
                    <FieldDescription>Inactive products are hidden from Sales and Purchases.</FieldDescription>
                  </FieldContent>
                  <Switch
                    id="is-active"
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
                  <FieldLabel htmlFor="unit-name">Unit Name</FieldLabel>
                  <FieldDescription>The base unit used for pricing and stock — e.g. piece, kg, litre, bottle.</FieldDescription>
                  <Input
                    id="unit-name"
                    value={form.unit_name}
                    onChange={e => set('unit_name', e.target.value)}
                    placeholder="piece"
                    aria-invalid={!!errors.unit_name}
                  />
                  <FieldError field="unit_name" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="purchase-price">Purchase Price</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>₹</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="purchase-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.purchase_price}
                        onChange={e => set('purchase_price', e.target.value)}
                        aria-invalid={!!errors.purchase_price}
                      />
                    </InputGroup>
                    <FieldError field="purchase_price" />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="selling-price">Selling Price</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>₹</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="selling-price"
                        type="number"
                        min="0"
                        step="0.01"
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
                  <FieldLabel htmlFor="gst-rate">GST Rate</FieldLabel>
                  <FieldDescription>Default GST percentage applied to this product.</FieldDescription>
                  <Select
                    value={form.gst_rate}
                    onValueChange={v => set('gst_rate', v ?? '0')}
                  >
                    <SelectTrigger id="gst-rate" className="w-full">
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
                    <FieldLabel htmlFor="has-box">Has Box Packaging</FieldLabel>
                    <FieldDescription>Enable if this product is sold or purchased in boxes.</FieldDescription>
                  </FieldContent>
                  <Switch
                    id="has-box"
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
                            <FieldLabel htmlFor="box-name">Box Name</FieldLabel>
                            <FieldDescription>e.g. dozen, carton, pack</FieldDescription>
                            <Input
                              id="box-name"
                              value={form.box_name}
                              onChange={e => set('box_name', e.target.value)}
                              placeholder="dozen"
                              aria-invalid={!!errors.box_name}
                            />
                            <FieldError field="box_name" />
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="units-per-box">Units Per Box</FieldLabel>
                            <FieldDescription>Min. 2 base units per box</FieldDescription>
                            <Input
                              id="units-per-box"
                              type="number"
                              min="2"
                              step="1"
                              value={form.units_per_box}
                              onChange={e => set('units_per_box', e.target.value)}
                              aria-invalid={!!errors.units_per_box}
                            />
                            <FieldError field="units_per_box" />
                          </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <FieldLabel htmlFor="box-purchase-price">Box Purchase Price</FieldLabel>
                            <FieldDescription>Auto-calculated. You can override.</FieldDescription>
                            <InputGroup>
                              <InputGroupAddon>
                                <InputGroupText>₹</InputGroupText>
                              </InputGroupAddon>
                              <InputGroupInput
                                id="box-purchase-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.box_purchase_price}
                                onChange={e => set('box_purchase_price', e.target.value)}
                              />
                            </InputGroup>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="box-selling-price">Box Selling Price</FieldLabel>
                            <FieldDescription>&nbsp;</FieldDescription>
                            <InputGroup>
                              <InputGroupAddon>
                                <InputGroupText>₹</InputGroupText>
                              </InputGroupAddon>
                              <InputGroupInput
                                id="box-selling-price"
                                type="number"
                                min="0"
                                step="0.01"
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
                    <FieldLabel htmlFor="track-inventory">Track Inventory</FieldLabel>
                    <FieldDescription>If off, stock is never decremented on sale.</FieldDescription>
                  </FieldContent>
                  <Switch
                    id="track-inventory"
                    checked={form.track_inventory}
                    onCheckedChange={v => set('track_inventory', v)}
                  />
                </Field>

                {form.track_inventory && (
                  <>
                    <FieldSeparator />

                    <div className="grid grid-cols-2 gap-4">
                      {!isEdit && (
                        <Field>
                          <FieldLabel htmlFor="opening-stock">Opening Stock</FieldLabel>
                          <FieldDescription>Creates an opening stock entry.</FieldDescription>
                          <Input
                            id="opening-stock"
                            type="number"
                            min="0"
                            step="0.001"
                            value={form.opening_stock}
                            onChange={e => set('opening_stock', e.target.value)}
                            placeholder="0"
                          />
                        </Field>
                      )}

                      <Field>
                        <FieldLabel htmlFor="minimum-stock">Minimum Stock</FieldLabel>
                        <FieldDescription>
                          Low-stock alert threshold.
                          {Number(form.minimum_stock) === 0 && (
                            <span className="block mt-1 text-amber-600 dark:text-amber-400">
                              0 means you&apos;ll only be alerted once stock is fully out. Consider
                              setting a buffer (e.g. 5–10 units) to reorder in time.
                            </span>
                          )}
                        </FieldDescription>
                        <Input
                          id="minimum-stock"
                          type="number"
                          min="0"
                          step="0.001"
                          value={form.minimum_stock}
                          onChange={e => set('minimum_stock', e.target.value)}
                        />
                      </Field>
                    </div>
                  </>
                )}
              </FieldGroup>
            </div>

          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <SheetFooter className="px-8 py-5 border-t shrink-0 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="ml-auto min-w-32">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? 'Save Changes' : 'Add Product'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}