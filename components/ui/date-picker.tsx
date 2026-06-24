"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (dateString: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  // Convert YYYY-MM-DD string to local Date object
  const date = React.useMemo(() => {
    if (!value) return undefined
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, month - 1, day)
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!onChange) return
    if (!selectedDate) {
      onChange("")
      return
    }
    // format as YYYY-MM-DD in local time
    const yyyy = selectedDate.getFullYear()
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const dd = String(selectedDate.getDate()).padStart(2, "0")
    onChange(`${yyyy}-${mm}-${dd}`)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            data-empty={!date}
            className={cn(
              "w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground",
              className
            )}
          />
        }
      >
        {date ? format(date, "PPP") : <span>{placeholder}</span>}
        <CalendarIcon className="size-4 opacity-50 shrink-0 ml-2" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
