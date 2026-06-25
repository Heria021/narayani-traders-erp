/**
 * Verifies rollback trace shapes for first-line vs mid-loop failures.
 * Run: npx tsx scripts/verify-rollback-shapes.ts
 */
import { traceDocumentRollback, stockReversalDelta } from '../lib/services/documentRollback'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const line1 = { productId: 'p1', baseUnits: 10, trackInventory: true }
const line2 = { productId: 'p2', baseUnits: 5, trackInventory: true }

// Shape A: failure on first line — no stock applied yet
const shapeA = traceDocumentRollback({ movementType: 'purchase', stockLines: [] })
assert(shapeA.stockReversals.length === 0, 'first-line fail: no stock reversals')
assert(shapeA.headerDelete === true, 'first-line fail: header still deleted')

// Shape B: failure on second line — one line reversed
const shapeB = traceDocumentRollback({ movementType: 'purchase', stockLines: [line1] })
assert(shapeB.stockReversals.length === 1, 'mid-loop fail: one reversal')
assert(shapeB.stockReversals[0].delta === -10, 'purchase reversal negates inbound')

// Sale reversal adds stock back
assert(stockReversalDelta('sale', 10) === 10, 'sale reversal adds stock back')
assert(stockReversalDelta('purchase', 10) === -10, 'purchase reversal removes stock')

console.log('rollback shape A (first line):', JSON.stringify(shapeA, null, 2))
console.log('rollback shape B (after line 1):', JSON.stringify(shapeB, null, 2))
console.log('OK — both rollback shapes verified')
