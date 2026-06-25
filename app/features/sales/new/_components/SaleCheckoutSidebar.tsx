'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldTitle,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field'
import { Item, ItemContent } from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2, Eye, Banknote, Smartphone, CreditCard, Building2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiscountMode, PaymentMethod } from '../../_components/types'
import { PAYMENT_METHOD_LABELS, STATUS_CONFIG } from '../../_components/types'
import { rupee } from './helpers'

const REFERENCE_METHODS: PaymentMethod[] = ['upi', 'card', 'bank_transfer']

const PAYMENT_ICONS: Record<PaymentMethod, ReactNode> = {
  cash: <Banknote className="size-4" />,
  upi: <Smartphone className="size-4" />,
  card: <CreditCard className="size-4" />,
  bank_transfer: <Building2 className="size-4" />,
  credit: <Clock className="size-4" />,
}

interface Props {
  subtotal: number
  taxAmount: number
  discount: string
  discountMode: DiscountMode
  discountVal: number
  grandTotal: number
  amountPaid: string
  balanceDue: number
  paymentStatus: 'paid' | 'partial' | 'pending'
  paymentMethod: PaymentMethod
  referenceNumber: string
  dueDate: string
  headerErrors: Partial<Record<string, string>>
  saving: boolean
  onDiscountChange: (v: string) => void
  onDiscountModeChange: (m: DiscountMode) => void
  onAmountPaidChange: (v: string) => void
  onPaymentMethodChange: (m: PaymentMethod) => void
  onReferenceChange: (v: string) => void
  onDueDateChange: (v: string) => void
  onPayFull: () => void
  onPreview: () => void
  onCancel: () => void
}

export function SaleCheckoutSidebar({
  subtotal, taxAmount, discount, discountMode, discountVal, grandTotal,
  amountPaid, balanceDue, paymentStatus, paymentMethod, referenceNumber, dueDate,
  headerErrors, saving,
  onDiscountChange, onDiscountModeChange, onAmountPaidChange,
  onPaymentMethodChange, onReferenceChange, onDueDateChange,
  onPayFull, onPreview, onCancel,
}: Props) {
  const statusCfg = STATUS_CONFIG[paymentStatus]
  const showReference = REFERENCE_METHODS.includes(paymentMethod)
  const showDueDate = paymentMethod === 'credit'

  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      <Card>
        <CardHeader>
          <CardDescription>Bill summary</CardDescription>
          <CardTitle>Amount Due</CardTitle>
        </CardHeader>
        <CardContent>
          <Item variant="muted" className="flex-col items-stretch">
            <ItemContent className="gap-0 p-0">
              <SummaryRow label="Subtotal" value={rupee(subtotal)} />
              <Separator className="my-2.5" />
              <SummaryRow label="GST" value={rupee(taxAmount)} />
              <Separator className="my-2.5" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <ButtonGroup className="h-6">
                    <Button
                      type="button"
                      variant={discountMode === 'flat' ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => onDiscountModeChange('flat')}
                      className="h-full px-2 text-[10px]"
                    >
                      ₹
                    </Button>
                    <Button
                      type="button"
                      variant={discountMode === 'percent' ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => onDiscountModeChange('percent')}
                      className="h-full px-2 text-[10px]"
                    >
                      %
                    </Button>
                  </ButtonGroup>
                </div>
                <div className="flex items-center gap-2">
                  <InputGroup className="h-8 w-24">
                    <InputGroupAddon>
                      <InputGroupText className="text-xs">{discountMode === 'flat' ? '₹' : '%'}</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      type="number"
                      value={discount}
                      onChange={e => onDiscountChange(e.target.value)}
                      placeholder="0"
                      className="text-xs"
                    />
                  </InputGroup>
                  <span className="w-20 text-right text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
                    {discountVal > 0 ? `−${rupee(discountVal)}` : '—'}
                  </span>
                </div>
              </div>
              <Separator className="my-2.5" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Grand Total</span>
                <span className="text-xl font-bold tabular-nums tracking-tight">{rupee(grandTotal)}</span>
              </div>
            </ItemContent>
          </Item>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Collection</CardDescription>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <FieldSet>
              <FieldLegend variant="label">Payment method</FieldLegend>
              <RadioGroup
                value={paymentMethod}
                onValueChange={v => onPaymentMethodChange(v as PaymentMethod)}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([val, label]) => (
                  <FieldLabel key={val} htmlFor={`pay-${val}`}>
                    <Field orientation="horizontal" className="rounded-lg border border-transparent pb-2.5 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary/5">
                      <RadioGroupItem value={val} id={`pay-${val}`} />
                      <FieldContent className="flex-row items-center gap-2">
                        <span className="text-muted-foreground">{PAYMENT_ICONS[val]}</span>
                        <div>
                          <FieldTitle className="text-sm">{label}</FieldTitle>
                          {val === 'credit' && (
                            <FieldDescription className="text-[11px]">Pay later</FieldDescription>
                          )}
                        </div>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldSet>

            {showReference && (
              <Field>
                <FieldLabel htmlFor="reference_number">Reference no.</FieldLabel>
                <Input
                  id="reference_number"
                  value={referenceNumber}
                  onChange={e => onReferenceChange(e.target.value)}
                  placeholder={paymentMethod === 'upi' ? 'UPI transaction ID' : 'Reference number'}
                />
              </Field>
            )}

            {showDueDate && (
              <Field>
                <FieldLabel>Due date <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                <DatePicker value={dueDate} onChange={onDueDateChange} />
              </Field>
            )}

            <Field data-invalid={!!headerErrors.amount_paid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="amount_paid">Amount paid</FieldLabel>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={onPayFull}
                  disabled={paymentMethod === 'credit'}
                  className="h-auto p-0 text-xs font-semibold"
                >
                  Pay full {rupee(grandTotal)}
                </Button>
              </div>
              <InputGroup>
                <InputGroupAddon><InputGroupText>₹</InputGroupText></InputGroupAddon>
                <InputGroupInput
                  id="amount_paid"
                  type="number"
                  value={amountPaid}
                  onChange={e => onAmountPaidChange(e.target.value)}
                  placeholder="0.00"
                  className="tabular-nums"
                  disabled={paymentMethod === 'credit'}
                  aria-invalid={!!headerErrors.amount_paid}
                />
              </InputGroup>
              {headerErrors.amount_paid && <FieldError>{headerErrors.amount_paid}</FieldError>}
            </Field>

            <Item variant="muted" className="flex-col items-stretch">
              <ItemContent className="gap-0">
                <SummaryRow
                  label="Balance due"
                  value={rupee(balanceDue)}
                  valueClassName={balanceDue > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}
                />
                <Separator className="my-2.5" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={cn('font-semibold', statusCfg.color)}>
                    {statusCfg.label}
                  </Badge>
                </div>
              </ItemContent>
            </Item>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col gap-2 border-t pt-(--card-spacing)">
          <Button type="submit" disabled={saving} className="w-full">
            {saving
              ? <><Loader2 className="size-4 animate-spin" />Saving bill…</>
              : 'Save & generate bill'}
          </Button>
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button type="button" variant="outline" onClick={onPreview} disabled={saving}>
              <Eye className="size-3.5" />
              Preview
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

function SummaryRow({
  label, value, valueClassName,
}: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium tabular-nums', valueClassName)}>{value}</span>
    </div>
  )
}
