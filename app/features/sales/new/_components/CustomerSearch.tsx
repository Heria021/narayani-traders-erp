'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox'
import { Plus } from 'lucide-react'
import type { Customer } from '../../_components/types'
import { normalized } from './helpers'

interface Props {
  value: Customer | null
  options: Customer[]
  onSelect: (c: Customer | null) => void
  onAddCustomerClick: () => void
}

export function CustomerSearch({ value, options, onSelect, onAddCustomerClick }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = normalized(query.trim())
    const filtered = q
      ? options.filter(c => normalized(c.name).includes(q) || normalized(c.phone).includes(q))
      : options
    return filtered.slice(0, 12)
  }, [options, query])

  return (
    <Combobox
      value={value?.id ?? ''}
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
      inputValue={value ? value.name : query}
      onInputValueChange={(q, details) => {
        if (details.reason === 'input-change') {
          if (value) onSelect(null)
          setQuery(q)
        } else if (details.reason === 'input-clear' || details.reason === 'clear-press') {
          onSelect(null)
          setQuery('')
        }
      }}
    >
      <ComboboxInput
        placeholder="Search customer by name or phone…"
        showClear={!!value}
        showTrigger={!value}
        className="w-full"
      />
      <ComboboxContent align="start" sideOffset={6} className="w-full min-w-80">
        <ComboboxList>
          {results.map(c => (
            <ComboboxItem key={c.id} value={c.id}>
              <div className="flex items-center gap-2 py-1">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
                </div>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <div className="border-t p-1 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false)
              onAddCustomerClick()
            }}
            className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-muted"
          >
            <Plus className="size-3.5" />
            Add New Customer
          </Button>
        </div>
      </ComboboxContent>
    </Combobox>
  )
}
