'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { FieldDescription, FieldError } from '@/components/ui/field'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from '@/components/ui/table'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import {
  Plus, Trash2, AlertCircle, X, Package, AlertTriangle, ShoppingCart,
} from 'lucide-react'
import type { SaleDraftLineItem, SaleProduct } from '../../_components/types'
import {
  computeBaseUnits, computeLineTotal, normalized, num, rupee,
} from './helpers'

function ProductSearch({
  value, options, usedProductIds, onSelect, onQuickAdd,
}: {
  value: SaleProduct | null
  options: SaleProduct[]
  usedProductIds: string[]
  onSelect: (p: SaleProduct | null) => void
  onQuickAdd: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = normalized(query.trim())
    const filtered = q
      ? options.filter(p => normalized(p.name).includes(q) || normalized(p.sku).includes(q))
      : options
    return filtered.slice(0, 18)
  }, [options, query])

  const showQuickAdd = useMemo(() => {
    const q = normalized(query.trim())
    return q.length > 1 && !options.some(p => normalized(p.name) === q)
  }, [options, query])

  if (value) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/40 px-3 ring-1 ring-foreground/5">
        <Package className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-4">{value.name}</p>
          <p className="truncate text-[11px] leading-4 text-muted-foreground">
            {value.unit_name} · {rupee(value.selling_price)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => { onSelect(null); setQuery('') }}
          className="shrink-0 text-muted-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <Combobox
      value=""
      onValueChange={val => {
        if (!val) {
          onSelect(null)
          setQuery('')
        } else {
          onSelect(options.find(o => o.id === val) ?? null)
          setQuery('')
        }
      }}
      open={open}
      onOpenChange={setOpen}
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxInput placeholder="Search product…" showClear={false} showTrigger className="w-full" />
      <ComboboxContent align="start" sideOffset={6} className="w-full min-w-80">
        <ComboboxList>
          {results.map(p => {
            const alreadyUsed = usedProductIds.includes(p.id)
            return (
              <ComboboxItem key={p.id} value={p.id} disabled={alreadyUsed} className="flex items-center justify-between">
                <div className="min-w-0 flex-1 py-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.sku ? `${p.sku} · ` : ''}{p.unit_name} · {rupee(p.selling_price)}
                    {alreadyUsed && ' · already added'}
                  </p>
                </div>
                {alreadyUsed && <Badge variant="secondary" className="text-[10px]">Added</Badge>}
              </ComboboxItem>
            )
          })}
        </ComboboxList>
        {showQuickAdd && (
          <div className="border-t p-1 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false)
                onQuickAdd(query.trim())
                setQuery('')
              }}
              className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-muted"
            >
              <Plus className="size-3.5" />
              Quick Add &quot;{query.trim()}&quot;
            </Button>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  )
}

function StockIndicator({ product, requestedUnits }: { product: SaleProduct; requestedUnits: number }) {
  if (!product.track_inventory || requestedUnits <= 0) return null
  const stock = product.current_stock
  if (stock <= 0) {
    return (
      <FieldError className="mt-0.5 flex items-center gap-1 text-[10px]">
        <AlertCircle className="size-3" />Out of stock
      </FieldError>
    )
  }
  if (requestedUnits > stock) {
    return (
      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-3" />Only {stock} in stock
      </p>
    )
  }
  return null
}

function LineItemRow({
  row, products, usedProductIds, onUpdate, onRemove, onQuickAdd,
}: {
  row: SaleDraftLineItem
  products: SaleProduct[]
  usedProductIds: string[]
  onUpdate: (id: string, patch: Partial<SaleDraftLineItem>) => void
  onRemove: (id: string) => void
  onQuickAdd: (name: string, rowId: string) => void
}) {
  const lineTotal = computeLineTotal(row)
  const baseUnits = computeBaseUnits(row)

  function selectProduct(p: SaleProduct | null) {
    if (!p) {
      onUpdate(row.id, { product: null, unit_price: '', sell_mode: 'unit', qty_input: '' })
      return
    }
    onUpdate(row.id, {
      product: p,
      sell_mode: 'unit',
      unit_price: String(p.selling_price),
      tax_rate: String(p.gst_rate || 18),
      qty_input: '',
    })
  }

  function toggleMode(mode: 'unit' | 'box') {
    if (!row.product) return
    const price = mode === 'box'
      ? String(row.product.box_selling_price ?? row.product.selling_price)
      : String(row.product.selling_price)
    onUpdate(row.id, { sell_mode: mode, unit_price: price, qty_input: '' })
  }

  const canBox = row.product?.has_box && row.product?.units_per_box

  return (
    <TableRow className="group">
      <TableCell className="min-w-[140px] align-top">
        <div>
          <ProductSearch
            value={row.product}
            options={products}
            usedProductIds={usedProductIds.filter(id => id !== row.product?.id)}
            onSelect={selectProduct}
            onQuickAdd={name => onQuickAdd(name, row.id)}
          />
          {row.product && <StockIndicator product={row.product} requestedUnits={baseUnits} />}
        </div>
      </TableCell>
      <TableCell className="w-[140px] align-middle">
        <ButtonGroup className="h-8">
          <Button
            type="button"
            variant={row.sell_mode === 'unit' ? 'default' : 'outline'}
            size="xs"
            onClick={() => toggleMode('unit')}
            className="h-full px-3 text-xs font-semibold"
          >
            {row.product?.unit_name ?? 'Unit'}
          </Button>
          <Button
            type="button"
            variant={row.sell_mode === 'box' ? 'default' : 'outline'}
            size="xs"
            onClick={() => canBox && toggleMode('box')}
            disabled={!canBox}
            title={!canBox ? 'Product has no box configuration' : undefined}
            className="h-full px-3 text-xs font-semibold"
          >
            {row.product?.box_name ?? 'Box'}
          </Button>
        </ButtonGroup>
      </TableCell>
      <TableCell className="w-[100px] align-middle">
        <div>
          <Input
            min="0"
            value={row.qty_input}
            onChange={e => onUpdate(row.id, { qty_input: e.target.value })}
            placeholder="0"
            className="h-9 text-sm tabular-nums"
          />
          {row.sell_mode === 'box' && row.product?.units_per_box && num(row.qty_input) > 0 && (
            <FieldDescription className="mt-0.5 text-right text-[10px]">
              = {baseUnits} {row.product.unit_name}
            </FieldDescription>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[160px] align-middle">
        <InputGroup>
          <InputGroupAddon><InputGroupText>₹</InputGroupText></InputGroupAddon>
          <InputGroupInput
            value={row.unit_price}
            onChange={e => onUpdate(row.id, { unit_price: e.target.value })}
            placeholder="0"
          />
        </InputGroup>
      </TableCell>
      <TableCell className="w-[120px] align-middle">
        <InputGroup>
          <InputGroupAddon><InputGroupText>%</InputGroupText></InputGroupAddon>
          <InputGroupInput
            value={row.tax_rate}
            onChange={e => onUpdate(row.id, { tax_rate: e.target.value })}
          />
        </InputGroup>
      </TableCell>
      <TableCell className="w-[135px] text-right align-middle">
        <span className="text-sm font-semibold tabular-nums">
          {lineTotal > 0 ? rupee(lineTotal) : <span className="text-muted-foreground/40">—</span>}
        </span>
      </TableCell>
      <TableCell className="w-10 align-middle" onClick={e => e.stopPropagation()}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(row.id)}
          className="size-8 text-muted-foreground opacity-0 transition-all duration-150 hover:text-red-500 hover:bg-red-50 group-hover:opacity-100 dark:hover:bg-red-950/30"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

interface Props {
  rows: SaleDraftLineItem[]
  products: SaleProduct[]
  validCount: number
  subtotal: number
  usedProductIds: string[]
  onAddRow: () => void
  onUpdateRow: (id: string, patch: Partial<SaleDraftLineItem>) => void
  onRemoveRow: (id: string) => void
  onQuickAdd: (name: string, rowId: string) => void
}

export function LineItemsSection({
  rows, products, validCount, subtotal, usedProductIds,
  onAddRow, onUpdateRow, onRemoveRow, onQuickAdd,
}: Props) {
  const hasItems = validCount > 0

  return (
    <Card>
      <CardHeader>
        <CardDescription>Products on this bill</CardDescription>
        <CardTitle className="flex items-center gap-2">
          Line Items
          {validCount > 0 && (
            <Badge variant="secondary" className="text-[10px]">{validCount}</Badge>
          )}
        </CardTitle>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={onAddRow}>
            <Plus className="size-3.5" />
            Add row
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {!hasItems && rows.every(r => !r.product) ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No products added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Search below or add a row to start building the bill</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onAddRow}>
              <Plus className="size-3.5" />
              Add first product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px] pl-6">Product</TableHead>
                  <TableHead className="w-[125px]">Mode</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[125px]">Price</TableHead>
                  <TableHead className="w-[90px]">Tax</TableHead>
                  <TableHead className="w-[135px] text-right">Amount</TableHead>
                  <TableHead className="w-10 pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <LineItemRow
                    key={row.id}
                    row={row}
                    products={products}
                    usedProductIds={usedProductIds}
                    onUpdate={onUpdateRow}
                    onRemove={onRemoveRow}
                    onQuickAdd={onQuickAdd}
                  />
                ))}
                {hasItems && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-right text-muted-foreground pl-6">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium pr-6">
                      {rupee(subtotal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
              {hasItems && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={7} className="pl-6 pr-6">
                      <Button type="button" variant="ghost" size="sm" onClick={onAddRow} className="text-xs">
                        <Plus className="size-3.5" />
                        Add another row
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
