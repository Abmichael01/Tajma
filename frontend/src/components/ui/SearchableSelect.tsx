"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchableSelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  loading?: boolean
  disabled?: boolean
  onSearchChange?: (search: string) => void
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  loading = false,
  disabled = false,
  onSearchChange,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = React.useMemo(() => {
    return options.find((option) => option.value === value)
  }, [options, value])

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      onValueChange(selectedValue)
      setOpen(false)
    },
    [onValueChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "relative flex h-12 w-full items-center rounded-full border border-gray-200 bg-white px-5 text-left font-normal text-gray-900 shadow-none transition-all hover:border-gray-300 hover:bg-gray-50 focus:ring-0 focus:ring-offset-0 cursor-pointer select-none",
            disabled && "opacity-50 cursor-not-allowed",
            !selectedOption && "text-gray-400",
            className
          )}
        >
          <div className="flex items-center justify-between w-full min-w-0">
            <span className="truncate font-medium flex-1">
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {selectedOption?.icon && (
                <span className="flex h-6 w-6 items-center justify-center opacity-80">
                  {selectedOption.icon}
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-50 w-[--radix-popover-trigger-width] overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-0 shadow-xl"
      >
        <Command shouldFilter={!onSearchChange} className="bg-white">
          <div className="flex items-center border-b border-gray-200 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={searchPlaceholder}
              onValueChange={onSearchChange}
              className="h-12 border-none focus:ring-0"
            />
            {loading && (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-primary" />
            )}
          </div>

          <CommandList 
            className="custom-scrollbar max-h-[300px] overflow-y-auto p-1 pointer-events-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
              {emptyMessage}
            </CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value

                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-all hover:bg-gray-50 aria-selected:bg-primary/5"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {option.label}
                      </span>

                      {option.description ? (
                        <span className="truncate text-[11px] leading-tight text-gray-400">
                          {option.description}
                        </span>
                      ) : null}
                    </div>

                    {option.icon ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center opacity-90">
                        {option.icon}
                      </span>
                    ) : null}

                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-primary transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}