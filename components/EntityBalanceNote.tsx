'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type EntityType = 'customer' | 'supplier'

const VIEW_MAP: Record<EntityType, 'customer_balances' | 'supplier_balances'> = {
  customer: 'customer_balances',
  supplier: 'supplier_balances',
}

const rupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

interface Props {
  entityType: EntityType
  entityId: string | null
}

export function EntityBalanceNote({ entityType, entityId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [amountOwed, setAmountOwed] = useState<number | null>(null)

  useEffect(() => {
    if (!entityId) {
      setAmountOwed(null)
      return
    }
    let active = true
    supabase
      .from(VIEW_MAP[entityType])
      .select('amount_owed')
      .eq('id', entityId)
      .single()
      .then(({ data }) => {
        if (active) setAmountOwed(Number(data?.amount_owed ?? 0))
      })
    return () => { active = false }
  }, [entityId, entityType, supabase])

  if (amountOwed === null) return null

  if (amountOwed > 0) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
        Current balance: {rupee(amountOwed)} owed
      </p>
    )
  }
  if (amountOwed < 0) {
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
        Current balance: {rupee(Math.abs(amountOwed))} credit
      </p>
    )
  }
  return (
    <p className="text-xs text-muted-foreground mt-1">
      Current balance: settled (₹0)
    </p>
  )
}
