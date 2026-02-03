import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
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

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: MultiSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  emptyMessage?: string
}

export function MultiSelect({
  values,
  onValuesChange,
  options,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  emptyMessage = "No se encontraron resultados.",
}: Readonly<MultiSelectProps>) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  React.useEffect(() => {
    if (!open) setSearchValue("")
  }, [open])

  const selectedOptions = options.filter((option) => values.includes(option.value))

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    const lowerSearch = searchValue.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch)
    )
  }, [options, searchValue])

  const toggle = (value: string) => {
    onValuesChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
    )
  }

  const remove = (e: React.MouseEvent, value: string) => {
    e.stopPropagation()
    onValuesChange(values.filter((v) => v !== value))
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full h-8 items-center gap-1.5 rounded-md border bg-transparent px-2 py-1 shadow-xs transition-[color,box-shadow] outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            disabled && "opacity-50 pointer-events-none",
            className
          )}
        >
          <div className="flex flex-1 items-center gap-1 overflow-hidden">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground text-xs">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-0.5 bg-secondary rounded px-1.5 py-0.5 text-xs shrink-0"
                  >
                    {option.label}
                    <X
                      className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={(e) => remove(e, option.value)}
                    />
                  </span>
                ))}
                {selectedOptions.length > 2 && (
                  <span className="bg-secondary rounded px-1.5 py-0.5 text-xs shrink-0">
                    +{selectedOptions.length - 2}
                  </span>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-8 text-xs"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {filteredOptions.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">{emptyMessage}</div>
            )}
            {filteredOptions.length > 0 && (
              <CommandGroup>
                <CommandItem
                  value="__select_all__"
                  onSelect={() => {
                    const allSelected = filteredOptions.every((o) => values.includes(o.value))
                    onValuesChange(
                      allSelected
                        ? values.filter((v) => !filteredOptions.some((o) => o.value === v))
                        : [...new Set([...values, ...filteredOptions.map((o) => o.value)])]
                    )
                  }}
                  className="text-xs font-medium"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filteredOptions.every((o) => values.includes(o.value)) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {filteredOptions.every((o) => values.includes(o.value)) ? "Deseleccionar todos" : "Seleccionar todos"}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = values.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => toggle(option.value)}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
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
