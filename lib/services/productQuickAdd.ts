import type { SupabaseClient } from '@supabase/supabase-js'
import type { QuickProductFormValues } from '@/app/features/purchases/_components/types'

const num = (v: string | number) => Number(v) || 0

/** Returns an error message when invalid, or null when OK. */
export function validateQuickProduct(values: QuickProductFormValues): string | null {
  if (!values.name.trim()) return 'Product name is required'
  if (!values.unit_name.trim()) return 'Unit name is required'
  if (!values.purchase_price || num(values.purchase_price) <= 0) return 'Purchase price must be greater than 0'
  if (!values.selling_price || num(values.selling_price) <= 0) return 'Selling price must be greater than 0'

  if (values.has_box) {
    if (!values.box_name.trim()) return 'Box name is required'
    if (!values.units_per_box || parseInt(values.units_per_box, 10) < 2) return 'Units per box must be at least 2'
    if (!values.box_purchase_price || num(values.box_purchase_price) <= 0) {
      return 'Box purchase price is required when box packaging is enabled'
    }
    if (!values.box_selling_price || num(values.box_selling_price) <= 0) {
      return 'Box selling price is required when box packaging is enabled'
    }
  }

  return null
}

function buildInsertRow(values: QuickProductFormValues) {
  const hasBox = values.has_box
  return {
    name:               values.name.trim(),
    sku:                values.sku.trim() || null,
    category:           values.category.trim() || null,
    unit_name:          values.unit_name.trim() || 'piece',
    purchase_price:     num(values.purchase_price),
    selling_price:      num(values.selling_price),
    gst_rate:           num(values.gst_rate),
    has_box:            hasBox,
    box_name:           hasBox ? values.box_name.trim() || null : null,
    units_per_box:      hasBox ? num(values.units_per_box) || null : null,
    box_purchase_price: hasBox ? num(values.box_purchase_price) : null,
    box_selling_price:  hasBox ? num(values.box_selling_price) : null,
    track_inventory:    values.track_inventory,
    current_stock:      0,
  }
}

export async function insertQuickProduct<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  values: QuickProductFormValues,
  select: string,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const validationError = validateQuickProduct(values)
  if (validationError) return { ok: false, message: validationError }

  const { data, error } = await supabase
    .from('products')
    .insert(buildInsertRow(values))
    .select(select)
    .single()

  if (error) return { ok: false, message: error.message }
  return { ok: true, data: data as T }
}
