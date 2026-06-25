import type { SupabaseClient } from '@supabase/supabase-js'
import { stockReversalDelta } from './documentRollback'

export type StockMovementType =
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'damage'
  | 'opening_stock'

export interface ApplyStockMovementParams {
  productId: string
  delta: number
  movementType: StockMovementType
  referenceId?: string | null
  notes?: string | null
}

/** Calls apply_stock_movement RPC — movement + stock update in one DB transaction. */
export async function applyStockMovement(
  supabase: SupabaseClient,
  params: ApplyStockMovementParams,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.rpc('apply_stock_movement', {
    p_product_id: params.productId,
    p_delta: params.delta,
    p_movement_type: params.movementType,
    p_reference_id: params.referenceId ?? null,
    p_notes: params.notes ?? null,
  })

  if (error) {
    return { ok: false, message: error.message }
  }
  return { ok: true }
}

export interface StockRollbackLine {
  productId: string
  baseUnits: number
  trackInventory: boolean
}

/** Removes reference-linked movements and reverses stock for tracked lines. */
export async function rollbackReferencedStock(
  supabase: SupabaseClient,
  params: {
    referenceId: string
    movementType: 'purchase' | 'sale'
    lines: StockRollbackLine[]
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: delErr } = await supabase
    .from('stock_movements')
    .delete()
    .eq('reference_id', params.referenceId)
    .eq('movement_type', params.movementType)

  if (delErr) {
    return { ok: false, message: delErr.message }
  }

  for (const line of params.lines) {
    if (!line.trackInventory) continue
    const { error } = await supabase.rpc('increment_stock', {
      p_product_id: line.productId,
      p_delta: stockReversalDelta(params.movementType, line.baseUnits),
    })
    if (error) {
      return { ok: false, message: error.message }
    }
  }

  return { ok: true }
}
