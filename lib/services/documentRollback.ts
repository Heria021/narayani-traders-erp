import type { SupabaseClient } from '@supabase/supabase-js'
import { rollbackReferencedStock, type StockRollbackLine } from './stockMovement'

/** 5 minutes — initial payment rows are inserted in the same save request as the sale header. */
export const AUTO_PAYMENT_WINDOW_MS = 5 * 60 * 1000

/** RPC delta applied on save: purchase +units, sale −units. Reversal uses the opposite sign. */
export function stockReversalDelta(
  movementType: 'purchase' | 'sale',
  baseUnits: number,
): number {
  const rounded = parseFloat(baseUnits.toFixed(3))
  return movementType === 'purchase' ? -rounded : rounded
}

export function canDeleteSameDaySale(params: {
  payments: Array<{ created_at: string; amount: number }>
  saleCreatedAt: string
}): { ok: true } | { ok: false; message: string } {
  const { payments, saleCreatedAt } = params

  if (payments.length > 1) {
    return {
      ok: false,
      message: 'Cannot delete — multiple payments recorded against this bill',
    }
  }

  if (payments.length === 1) {
    const pay = payments[0]
    const saleMs = new Date(saleCreatedAt).getTime()
    const payMs = new Date(pay.created_at).getTime()
    if (Number.isNaN(saleMs) || Number.isNaN(payMs)) {
      return { ok: false, message: 'Cannot delete — could not verify payment timing' }
    }
    if (payMs - saleMs > AUTO_PAYMENT_WINDOW_MS) {
      return {
        ok: false,
        message: `Cannot delete — payment of ₹${pay.amount.toFixed(2)} was recorded after this sale was saved`,
      }
    }
  }

  return { ok: true }
}

export async function rollbackFailedDocument(
  supabase: SupabaseClient,
  params: {
    table: 'purchases' | 'sales'
    documentId: string
    documentLabel: string
    movementType: 'purchase' | 'sale'
    stockLines: StockRollbackLine[]
  },
): Promise<boolean> {
  const rev = await rollbackReferencedStock(supabase, {
    referenceId: params.documentId,
    movementType: params.movementType,
    lines: params.stockLines,
  })
  if (!rev.ok) {
    console.error(`${params.table} stock rollback failed:`, rev.message)
    return false
  }

  const { error } = await supabase.from(params.table).delete().eq('id', params.documentId)
  if (error) {
    console.error(`${params.table} header delete failed:`, error.message)
    return false
  }
  return true
}

/** Pure trace of rollback steps — used to verify first-line vs mid-loop failure shapes. */
export function traceDocumentRollback(params: {
  movementType: 'purchase' | 'sale'
  stockLines: StockRollbackLine[]
}): {
  movementDeleteScope: string
  stockReversals: Array<{ productId: string; delta: number }>
  headerDelete: true
} {
  return {
    movementDeleteScope: `reference_id + movement_type=${params.movementType}`,
    stockReversals: params.stockLines
      .filter(l => l.trackInventory)
      .map(l => ({
        productId: l.productId,
        delta: stockReversalDelta(params.movementType, l.baseUnits),
      })),
    headerDelete: true,
  }
}
