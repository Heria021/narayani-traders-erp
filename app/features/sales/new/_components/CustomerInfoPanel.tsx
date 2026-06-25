'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { FieldDescription } from '@/components/ui/field'
import { Item, ItemContent } from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Customer } from '../../_components/types'
import { rupee } from './helpers'

interface Props {
  customer: Customer
  outstanding: number
}

export function CustomerInfoPanel({ customer, outstanding }: Props) {
  const creditLimit = customer.credit_limit
  const openingBal = customer.opening_balance
  const totalOwed = outstanding + Math.max(0, openingBal)
  const hasAdvance = openingBal < 0
  const noLimit = creditLimit <= 0
  const usageRatio = noLimit ? 0 : totalOwed / creditLimit
  const nearLimit = !noLimit && usageRatio >= 0.8 && usageRatio < 1
  const atLimit = !noLimit && usageRatio >= 1

  return (
    <Item variant="muted" className="flex-col items-stretch">
      <ItemContent className="gap-3 p-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-xs font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">{customer.name}</p>
              {customer.phone && <FieldDescription>{customer.phone}</FieldDescription>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={cn(
              'font-bold tabular-nums text-sm',
              outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
            )}>
              {rupee(outstanding)}
            </p>
          </div>
        </div>

        {!noLimit && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Credit limit {rupee(creditLimit)}</span>
              <span>Available {rupee(Math.max(0, creditLimit - totalOwed))}</span>
            </div>
          </>
        )}

        {hasAdvance && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400 [&>svg]:text-blue-700 dark:[&>svg]:text-blue-400">
            <Info className="size-3.5" />
            <AlertDescription>
              {customer.name} has {rupee(Math.abs(openingBal))} advance credit
            </AlertDescription>
          </Alert>
        )}

        {nearLimit && !atLimit && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400 [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
            <AlertTriangle className="size-3.5" />
            <AlertDescription>
              Nearing credit limit ({rupee(totalOwed)} of {rupee(creditLimit)} used)
            </AlertDescription>
          </Alert>
        )}

        {atLimit && (
          <Alert variant="destructive">
            <AlertCircle className="size-3.5" />
            <AlertDescription>
              Credit limit reached. {rupee(totalOwed)} outstanding.
            </AlertDescription>
          </Alert>
        )}
      </ItemContent>
    </Item>
  )
}
