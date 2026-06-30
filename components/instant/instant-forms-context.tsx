'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type InstantFormKey =
  | 'product'
  | 'supplier'
  | 'customer'
  | 'purchase'
  | 'sale'

// Ordered list used to compute prev/next
export const FORM_ORDER: InstantFormKey[] = [
  'product',
  'supplier',
  'customer',
  'purchase',
  'sale',
]

interface InstantFormsState {
  isOpen: boolean
  activeKey: InstantFormKey
  open: () => void
  close: () => void
  goTo: (key: InstantFormKey) => void
  next: () => void
  prev: () => void
}

const InstantFormsContext = createContext<InstantFormsState>({
  isOpen: false,
  activeKey: 'product',
  open: () => {},
  close: () => {},
  goTo: () => {},
  next: () => {},
  prev: () => {},
})

export function InstantFormsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<InstantFormKey>('product')

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const goTo = useCallback((key: InstantFormKey) => {
    setActiveKey(key)
    setIsOpen(true)
  }, [])

  const next = useCallback(() => {
    setActiveKey(prev => {
      const idx = FORM_ORDER.indexOf(prev)
      return FORM_ORDER[(idx + 1) % FORM_ORDER.length]
    })
  }, [])

  const prev = useCallback(() => {
    setActiveKey(prev => {
      const idx = FORM_ORDER.indexOf(prev)
      return FORM_ORDER[(idx - 1 + FORM_ORDER.length) % FORM_ORDER.length]
    })
  }, [])

  return (
    <InstantFormsContext.Provider value={{ isOpen, activeKey, open, close, goTo, next, prev }}>
      {children}
    </InstantFormsContext.Provider>
  )
}

export function useInstantForms() {
  return useContext(InstantFormsContext)
}
