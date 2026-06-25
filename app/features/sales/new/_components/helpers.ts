import type { SaleDraftLineItem } from '../../_components/types'

export const num = (v: string | number) => Number(v) || 0

export const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(n)

export const today = () => new Date().toISOString().slice(0, 10)

export function localId() {
  return Math.random().toString(36).slice(2)
}

export function normalized(value: string | null | undefined) {
  return (value ?? '').toLocaleLowerCase('en-IN')
}

export function computeLineTotal(row: SaleDraftLineItem): number {
  return parseFloat((num(row.qty_input) * num(row.unit_price)).toFixed(2))
}

export function computeBaseUnits(row: SaleDraftLineItem): number {
  const qty = num(row.qty_input)
  if (row.sell_mode === 'box' && row.product?.units_per_box) return qty * row.product.units_per_box
  return qty
}

export function emptyRow(): SaleDraftLineItem {
  return {
    id: localId(),
    product: null,
    sell_mode: 'unit',
    qty_input: '',
    unit_price: '',
    tax_rate: '18',
    base_units: 0,
    line_total: 0,
  }
}
