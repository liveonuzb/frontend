"use client";
import { map, filter, find, some, reduce, includes } from "lodash";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertCircleIcon, XIcon, CheckIcon, PlusIcon } from "lucide-react"

// Default English i18n configuration
export const DEFAULT_I18N = {
  // UI Labels
  addFilter: "Filter",
  searchFields: "Filter...",
  noFieldsFound: "No filters found.",
  noResultsFound: "No results found.",
  select: "Select...",
  true: "True",
  false: "False",
  min: "Min",
  max: "Max",
  to: "to",
  typeAndPressEnter: "Type and press Enter to add tag",
  selected: "selected",
  selectedCount: "selected",
  percent: "%",
  defaultCurrency: "$",
  defaultColor: "#000000",
  addFilterTitle: "Add filter",

  // Operators
  operators: {
    is: "is",
    isNot: "is not",
    isAnyOf: "is any of",
    isNotAnyOf: "is not any of",
    includesAll: "includes all",
    excludesAll: "excludes all",
    before: "before",
    after: "after",
    between: "between",
    notBetween: "not between",
    contains: "contains",
    notContains: "does not contain",
    startsWith: "starts with",
    endsWith: "ends with",
    isExactly: "is exactly",
    equals: "equals",
    notEquals: "not equals",
    greaterThan: "greater than",
    lessThan: "less than",
    overlaps: "overlaps",
    includes: "includes",
    excludes: "excludes",
    includesAllOf: "includes all of",
    includesAnyOf: "includes any of",
    empty: "is empty",
    notEmpty: "is not empty",
  },

  // Placeholders
  placeholders: {
    enterField: (fieldType) => `Enter ${fieldType}...`,
    selectField: "Select...",
    searchField: (fieldName) => `Search ${fieldName.toLowerCase()}...`,
    enterKey: "Enter key...",
    enterValue: "Enter value...",
  },

  // Helper functions
  helpers: {
    formatOperator: (operator) => operator.replace(/_/g, " "),
  },

  // Validation
  validation: {
    invalidEmail: "Invalid email format",
    invalidUrl: "Invalid URL format",
    invalidTel: "Invalid phone format",
    invalid: "Invalid input format",
  },
}

const FilterContext = createContext({
  variant: "default",
  size: "default",
  radius: "default",
  i18n: DEFAULT_I18N,
  className: undefined,
  showSearchInput: true,
  trigger: undefined,
  allowMultiple: true,
})

const useFilterContext = () => useContext(FilterContext)

// Container variant for filters wrapper
const filtersContainerVariants = cva("flex flex-wrap items-center", {
  variants: {
    variant: {
      solid: "gap-2",
      default: "",
    },
    size: {
      sm: "gap-1.5",
      default: "gap-2.5",
      lg: "gap-3.5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

function FilterInput(
  {
    field,
    onBlur,
    onKeyDown,
    className,
    ...props
  }
) {
  const context = useFilterContext()
  const [isValid, setIsValid] = useState(true)
  const [validationMessage, setValidationMessage] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    if (props.autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer);
    }
  }, [props.autoFocus])

  // Validation function to check if input matches pattern
  const validateInput = (value, pattern) => {
    if (!pattern || !value) return true
    const regex = new RegExp(pattern)
    return regex.test(value);
  }

  // Get validation message for field type
  const getValidationMessage = () => {
    return context.i18n.validation.invalid
  }

  // Handle blur event - validate when user leaves input
  const handleBlur = (e) => {
    const value = e.target.value
    const pattern = field?.pattern || props.pattern

    // Only validate if there's a value and (pattern or validation function)
    if (value && (pattern || field?.validation)) {
      let valid = true
      let customMessage = ""

      // If there's a custom validation function, use it
      if (field?.validation) {
        const result = field.validation(value)
        // Handle both boolean and object return types
        if (typeof result === "boolean") {
          valid = result
        } else {
          valid = result.valid
          customMessage = result.message || ""
        }
      } else if (pattern) {
        // Use pattern validation
        valid = validateInput(value, pattern)
      }

      setIsValid(valid)
      setValidationMessage(valid ? "" : customMessage || getValidationMessage())
    } else {
      // Reset validation state for empty values or no validation
      setIsValid(true)
      setValidationMessage("")
    }

    // Call the original onBlur if provided
    onBlur?.(e)
  }

  // Handle keydown event - hide validation error when user starts typing
  const handleKeyDown = (e) => {
    // Hide validation error when user starts typing (any key except special keys)
    if (
      !isValid &&
      ![
        "Tab",
        "Escape",
        "Enter",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.key)
    ) {
      setIsValid(true)
      setValidationMessage("")
    }

    // Call the original onKeyDown if provided
    onKeyDown?.(e)
  }

  return (
    <InputGroup className={cn("w-36", className)}>
      {field?.prefix && (
        <InputGroupAddon>
          <InputGroupText>{field.prefix}</InputGroupText>
        </InputGroupAddon>
      )}
      <InputGroupInput
        ref={inputRef}
        aria-invalid={!isValid}
        aria-describedby={
          !isValid && validationMessage
            ? `${field?.key || "input"}-error`
            : undefined
        }
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props} />
      {!isValid && validationMessage && (
        <InputGroupAddon align="inline-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton size="icon-xs">
                  <AlertCircleIcon className="text-destructive size-3.5" />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{validationMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </InputGroupAddon>
      )}
      {field?.suffix && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{field.suffix}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

function FilterRemoveButton(
  {
    className,

    icon = (
      <XIcon />
    ),

    ...props
  }
) {
  const context = useFilterContext()

  const sizeMap = {
    sm: "sm",
    default: "sm",
    lg: "default",
  }

  return (
    <Button
      variant="outline"
      size={
        context.size === "sm"
          ? "icon-sm"
          : context.size === "lg"
            ? "icon-lg"
            : "icon"
      }
      {...props}>
      {icon}
    </Button>
  );
}

// Helper functions to handle both flat and grouped field configurations
const isFieldGroup = item => {
  return "fields" in item && Array.isArray(item.fields);
}

// Helper function to check if a FilterFieldConfig is a group-level configuration
const isGroupLevelField = field => {
  return Boolean(field.group && field.fields);
}

const flattenFields = fields => {
  return reduce(fields, (acc, item) => {
    if (isFieldGroup(item)) {
      return [...acc, ...item.fields]
    }
    // Handle group-level fields (new structure)
    if (isGroupLevelField(item)) {
      return [...acc, ...item.fields];
    }
    return [...acc, item]
  }, []);
}

const getFieldsMap = fields => {
  const flatFields = flattenFields(fields)
  return reduce(flatFields, (acc, field) => {
    // Only add fields that have a key (skip group-level configurations)
    if (field.key) {
      acc[field.key] = field
    }
    return acc
  }, {});
}

// Helper function to create operators from i18n config
const createOperatorsFromI18n = i18n => ({
  select: [
    { value: "is", label: i18n.operators.is },
    { value: "is_not", label: i18n.operators.isNot },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],

  multiselect: [
    { value: "is_any_of", label: i18n.operators.isAnyOf },
    { value: "is_not_any_of", label: i18n.operators.isNotAnyOf },
    { value: "includes_all", label: i18n.operators.includesAll },
    { value: "excludes_all", label: i18n.operators.excludesAll },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],

  text: [
    { value: "contains", label: i18n.operators.contains },
    { value: "not_contains", label: i18n.operators.notContains },
    { value: "starts_with", label: i18n.operators.startsWith },
    { value: "ends_with", label: i18n.operators.endsWith },
    { value: "is", label: i18n.operators.isExactly },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],

  custom: [
    { value: "is", label: i18n.operators.is },
    { value: "after", label: i18n.operators.after },
    { value: "is", label: i18n.operators.is },
    { value: "between", label: i18n.operators.between },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ]
})

// Default operators for different field types (using default i18n)
export const DEFAULT_OPERATORS =
  createOperatorsFromI18n(DEFAULT_I18N)

// Helper function to get operators for a field
const getOperatorsForField = (field, values, i18n) => {
  if (field.operators) return field.operators

  const operators = createOperatorsFromI18n(i18n)

  // Determine field type for operator selection
  let fieldType = field.type || "select"

  // If it's a select field but has multiple values, treat as multiselect
  if (fieldType === "select" && values.length > 1) {
    fieldType = "multiselect"
  }

  // If it's a multiselect field or has multiselect operators, use multiselect operators
  if (fieldType === "multiselect" || field.type === "multiselect") {
    return operators.multiselect
  }

  return operators[fieldType] || operators.select
}

function FilterOperatorDropdown(
  {
    field,
    operator,
    values,
    onChange
  }
) {
  const context = useFilterContext()
  const operators = getOperatorsForField(field, values, context.i18n)

  // Find the operator label, with fallback to formatted operator name
  const operatorLabel =
    find(operators, (op) => op.value === operator)?.label ||
    context.i18n.helpers.formatOperator(operator)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={context.size}
          className="text-muted-foreground hover:text-foreground">
          {operatorLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {map(operators, (op) => (
          <DropdownMenuItem
            key={op.value}
            onClick={() => onChange(op.value)}
            className={cn(
              "data-highlighted:bg-accent data-highlighted:text-accent-foreground flex items-center justify-between"
            )}>
            <span>{op.label}</span>
            <CheckIcon
              className={cn(
                "text-primary ms-auto",
                op.value === operator ? "opacity-100" : "opacity-0"
              )} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SelectOptionsPopover(
  {
    field,
    values,
    onChange,
    onClose,
    inline = false
  }
) {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const context = useFilterContext()
  const baseId = useId()

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [searchInput, open])

  useEffect(() => {
    if (highlightedIndex >= 0 && open) {
      const element = document.getElementById(`${baseId}-item-${highlightedIndex}`)
      element?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex, open, baseId])

  const isMultiSelect = field.type === "multiselect" || values.length > 1
  const effectiveValues =
    (field.value !== undefined ? (field.value) : values) || []

  const selectedOptions =
    filter(field.options, (opt) => includes(effectiveValues, opt.value)) || []
  const unselectedOptions =
    filter(field.options, (opt) => !includes(effectiveValues, opt.value)) || []

  // Filter options based on search input
  const filteredSelectedOptions = selectedOptions // Keep all selected visible
  const filteredUnselectedOptions = filter(unselectedOptions, (opt) =>
    opt.label.toLowerCase().includes(searchInput.toLowerCase()))

  const allFilteredOptions = useMemo(
    () => [...filteredSelectedOptions, ...filteredUnselectedOptions],
    [filteredSelectedOptions, filteredUnselectedOptions]
  )

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  const renderMenuContent = () => (
    <>
      {field.searchable !== false && (
        <>
          <Input
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={true}
            aria-haspopup="listbox"
            aria-controls={`${baseId}-listbox`}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${baseId}-item-${highlightedIndex}`
                : undefined
            }
            placeholder={context.i18n.placeholders.searchField(field.label || "")}
            className={cn(
              "border-input h-8 rounded-none border-0 bg-transparent! px-2 text-sm shadow-none",
              "focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                if (allFilteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev < allFilteredOptions.length - 1 ? prev + 1 : 0)
                }
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                if (allFilteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : allFilteredOptions.length - 1)
                }
              } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                setOpen(false)
              } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault()
                const option = allFilteredOptions[highlightedIndex]
                if (option) {
                  const isSelected = effectiveValues.includes(option.value)
                  const next = isSelected
                    ? (effectiveValues.filter((v) => v !== option.value))
                    : isMultiSelect
                      ? ([...effectiveValues, option.value])
                      : ([option.value])

                  if (
                    !isSelected &&
                    isMultiSelect &&
                    field.maxSelections &&
                    next.length > field.maxSelections
                  ) {
                    return
                  }

                  if (field.onValueChange) {
                    field.onValueChange(next)
                  } else {
                    onChange(next)
                  }
                  if (!isMultiSelect) handleClose()
                }
              }
              e.stopPropagation()
            }} />
          <DropdownMenuSeparator />
        </>
      )}
      <div className="relative flex max-h-full">
        <div
          className="flex max-h-[min(var(--radix-dropdown-menu-content-available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain"
          role="listbox"
          id={`${baseId}-listbox`}>
          <ScrollArea
            className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 **:data-[slot=scroll-area-viewport]:h-full **:data-[slot=scroll-area-viewport]:overscroll-contain">
            {allFilteredOptions.length === 0 && (
              <div className="text-muted-foreground py-2 text-center text-sm">
                {context.i18n.noResultsFound}
              </div>
            )}

            {/* Selected items */}
            {filteredSelectedOptions.length > 0 && (
              <DropdownMenuGroup className="px-1">
                {map(filteredSelectedOptions, (option, index) => {
                  const isHighlighted = highlightedIndex === index
                  const itemId = `${baseId}-item-${index}`

                  return (
                    <DropdownMenuCheckboxItem
                      key={String(option.value)}
                      id={itemId}
                      role="option"
                      aria-selected={isHighlighted}
                      data-highlighted={isHighlighted || undefined}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      checked={true}
                      className={cn(
                        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                        option.className
                      )}
                      onSelect={(e) => {
                        if (isMultiSelect) e.preventDefault()
                      }}
                      onCheckedChange={() => {
                        const next = filter(effectiveValues, (v) => v !== option.value)
                        if (field.onValueChange) {
                          field.onValueChange(next)
                        } else {
                          onChange(next)
                        }
                        if (!isMultiSelect) handleClose()
                      }}>
                      {option.icon && option.icon}
                      <span className="truncate">{option.label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            )}

            {/* Separator */}
            {filteredSelectedOptions.length > 0 &&
              filteredUnselectedOptions.length > 0 && (
                <DropdownMenuSeparator className="mx-0" />
              )}

            {/* Available items */}
            {filteredUnselectedOptions.length > 0 && (
              <DropdownMenuGroup className="px-1">
                {map(filteredUnselectedOptions, (option, index) => {
                  const overallIndex = index + filteredSelectedOptions.length
                  const isHighlighted = highlightedIndex === overallIndex
                  const itemId = `${baseId}-item-${overallIndex}`

                  return (
                    <DropdownMenuCheckboxItem
                      key={String(option.value)}
                      id={itemId}
                      role="option"
                      aria-selected={isHighlighted}
                      data-highlighted={isHighlighted || undefined}
                      onMouseEnter={() => setHighlightedIndex(overallIndex)}
                      checked={false}
                      className={cn(
                        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                        option.className
                      )}
                      onSelect={(e) => {
                        if (isMultiSelect) e.preventDefault()
                      }}
                      onCheckedChange={() => {
                        const next = isMultiSelect
                          ? ([...effectiveValues, option.value])
                          : ([option.value])

                        if (
                          isMultiSelect &&
                          field.maxSelections &&
                          next.length > field.maxSelections
                        ) {
                          return
                        }

                        if (field.onValueChange) {
                          field.onValueChange(next)
                        } else {
                          onChange(next)
                        }
                        if (!isMultiSelect) handleClose()
                      }}>
                      {option.icon && option.icon}
                      <span className="truncate">{option.label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  )

  if (inline) {
    return <div className="w-full">{renderMenuContent()}</div>;
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setTimeout(() => setSearchInput(""), 200)
        }
      }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={context.size}>
          <div className="flex items-center gap-1.5">
            {field.customValueRenderer ? (
              field.customValueRenderer(values, field.options || [])
            ) : (
              <>
                {selectedOptions.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {map(selectedOptions.slice(0, 3), (option) => (
                      <div key={String(option.value)}>{option.icon}</div>
                    ))}
                  </div>
                )}
                {selectedOptions.length === 1
                  ? selectedOptions[0].label
                  : selectedOptions.length > 1
                    ? `${selectedOptions.length} ${context.i18n.selectedCount}`
                    : context.i18n.select}
              </>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn("w-[200px] px-0", field.className)}>
        {renderMenuContent()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterValueSelector(
  {
    field,
    values,
    onChange,
    operator,
    autoFocus
  }
) {
  const context = useFilterContext()

  if (operator === "empty" || operator === "not_empty") {
    return null
  }

  if (field.customRenderer) {
    return (
      <ButtonGroupText
        className="hover:bg-accent aria-expanded:bg-accent text-start whitespace-nowrap outline-hidden">
        {field.customRenderer({ field, values, onChange, operator })}
      </ButtonGroupText>
    );
  }

  if (field.type === "text") {
    return (
      <FilterInput
        type="text"
        value={(values[0]) || ""}
        onChange={(e) => onChange([e.target.value])}
        placeholder={field.placeholder}
        pattern={field.pattern}
        field={field}
        className={cn("w-36", field.className)}
        autoFocus={autoFocus} />
    );
  }

  if (field.type === "select" || field.type === "multiselect") {
    return (<SelectOptionsPopover field={field} values={values} onChange={onChange} />);
  }

  return (<SelectOptionsPopover field={field} values={values} onChange={onChange} />);
}

export const FiltersContent = (
  {
    filters,
    fields,
    onChange
  }
) => {
  const context = useFilterContext()
  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields])

  const updateFilter = useCallback((filterId, updates) => {
    onChange(map(filters, (filter) => {
      if (filter.id === filterId) {
        const updatedFilter = { ...filter, ...updates }
        if (
          updates.operator === "empty" ||
          updates.operator === "not_empty"
        ) {
          updatedFilter.values = []
        }
        return updatedFilter
      }
      return filter
    }))
  }, [filters, onChange])

  const removeFilter = useCallback((filterId) => {
    onChange(filter(filters, (f) => f.id !== filterId))
  }, [filters, onChange])

  return (
    <div
      className={cn(filtersContainerVariants({
        variant: context.variant,
        size: context.size,
      }), context.className)}>
      {map(filters, (filter) => {
        const field = fieldsMap[filter.field]
        if (!field) return null

        return (
          <ButtonGroup key={filter.id}>
            <ButtonGroupText>
              {field.icon && field.icon}
              {field.label}
            </ButtonGroupText>
            <FilterOperatorDropdown
              field={field}
              operator={filter.operator}
              values={filter.values}
              onChange={(operator) => updateFilter(filter.id, { operator })} />
            <FilterValueSelector
              field={field}
              values={filter.values}
              onChange={(values) => updateFilter(filter.id, { values })}
              operator={filter.operator}
              autoFocus={false} />
            <FilterRemoveButton onClick={() => removeFilter(filter.id)} />
          </ButtonGroup>
        );
      })}
    </div>
  );
}

function FilterSubmenuContent(
  {
    field,
    currentValues,
    isMultiSelect,
    onToggle,
    i18n,
    isActive,
    onActive,
    onBack,
    onClose
  }
) {
  const [searchInput, setSearchInput] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const baseId = useId()

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [searchInput])

  useEffect(() => {
    if (highlightedIndex >= 0 && isActive) {
      const element = document.getElementById(`${baseId}-item-${highlightedIndex}`)
      element?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex, isActive, baseId])

  const filteredOptions = useMemo(() => {
    return (filter(field.options, (option) => {
      const isSelected = includes(currentValues, option.value)
      if (isSelected) return true
      if (!searchInput) return true
      return option.label.toLowerCase().includes(searchInput.toLowerCase());
    }) || []);
  }, [field.options, searchInput, currentValues])

  useEffect(() => {
    if (isActive && filteredOptions.length > 0) {
      setHighlightedIndex(0)
    }
  }, [isActive, filteredOptions.length])

  return (
    <div className="flex flex-col" onMouseEnter={onActive}>
      {field.searchable !== false && (
        <>
          <Input
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={true}
            aria-haspopup="listbox"
            aria-controls={`${baseId}-listbox`}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${baseId}-item-${highlightedIndex}`
                : undefined
            }
            placeholder={i18n.placeholders.searchField(field.label || "")}
            className={cn(
              "h-8 rounded-none border-0 bg-transparent! px-2 text-sm shadow-none",
              "focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0)
                }
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1)
                }
              } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                onBack?.()
              } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault()
                const option = filteredOptions[highlightedIndex]
                if (option) {
                  onToggle(option.value, currentValues.includes(option.value))
                  if (!isMultiSelect) {
                    onBack?.()
                  }
                }
              } else if (e.key === "Escape") {
                e.preventDefault()
                onClose?.()
              }
              e.stopPropagation()
            }} />
          <DropdownMenuSeparator />
        </>
      )}
      <div className="relative flex max-h-full">
        <div
          className="flex max-h-[min(var(--radix-dropdown-menu-content-available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain outline-hidden"
          role="listbox"
          id={`${baseId}-listbox`}
          tabIndex={field.searchable === false ? 0 : -1}
          onKeyDown={(e) => {
            if (field.searchable === false) {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0)
                }
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1)
                }
              } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                onBack?.()
              } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault()
                const option = filteredOptions[highlightedIndex]
                if (option) {
                  onToggle(option.value, currentValues.includes(option.value))
                  if (!isMultiSelect) {
                    onBack?.()
                  }
                }
              } else if (e.key === "Escape") {
                e.preventDefault()
                onClose?.()
              }
              e.stopPropagation()
            }
          }}>
          <ScrollArea
            className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 **:data-[slot=scroll-area-viewport]:h-full **:data-[slot=scroll-area-viewport]:overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="text-muted-foreground py-2 text-center text-sm">
                {i18n.noResultsFound}
              </div>
            ) : (
              <DropdownMenuGroup>
                {map(filteredOptions, (option, index) => {
                  const isSelected = includes(currentValues, option.value)
                  const isHighlighted = highlightedIndex === index
                  const itemId = `${baseId}-item-${index}`

                  return (
                    <DropdownMenuCheckboxItem
                      key={String(option.value)}
                      id={itemId}
                      role="option"
                      aria-selected={isHighlighted}
                      data-highlighted={isHighlighted || undefined}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      checked={isSelected}
                      className={cn(
                        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                        option.className
                      )}
                      onSelect={(e) => {
                        if (isMultiSelect) e.preventDefault()
                      }}
                      onCheckedChange={() =>
                        onToggle(option.value, isSelected)
                      }>
                      {option.icon && option.icon}
                      <span className="truncate">{option.label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export function Filters(
  {
    filters,
    fields,
    onChange,
    className,
    variant = "default",
    size = "default",
    radius = "default",
    i18n,
    showSearchInput = true,
    trigger,
    allowMultiple = true,
    menuPopupClassName,
    enableShortcut = false,
    shortcutKey = "f",
    shortcutLabel = "F"
  }
) {
  const [addFilterOpen, setAddFilterOpen] = useState(false)
  const [menuSearchInput, setMenuSearchInput] = useState("")
  const [activeMenu, setActiveMenu] = useState("root")
  const [openSubMenu, setOpenSubMenu] = useState(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [lastAddedFilterId, setLastAddedFilterId] = useState(null)
  const rootInputRef = useRef(null)
  const rootId = useId()

  useEffect(() => {
    if (!enableShortcut) return

    const handleKeyDown = (e) => {
      if (
        e.key.toLowerCase() === shortcutKey.toLowerCase() &&
        !addFilterOpen &&
        !(
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault()
        setAddFilterOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableShortcut, shortcutKey, addFilterOpen])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [menuSearchInput])

  useEffect(() => {
    if (highlightedIndex >= 0 && addFilterOpen) {
      const element = document.getElementById(`${rootId}-item-${highlightedIndex}`)
      element?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex, addFilterOpen, rootId])

  useEffect(() => {
    if (!addFilterOpen) {
      setOpenSubMenu(null)
    }
  }, [addFilterOpen])

  // Track which filter instance is being built in the current Add Filter menu session
  // Maps fieldKey -> unique filterId created during this open session
  const [sessionFilterIds, setSessionFilterIds] = useState({})

  useEffect(() => {
    if (lastAddedFilterId) {
      const timer = setTimeout(() => {
        setLastAddedFilterId(null)
      }, 1000)
      return () => clearTimeout(timer);
    }
  }, [lastAddedFilterId])

  const mergedI18n = {
    ...DEFAULT_I18N,
    ...i18n,
    operators: { ...DEFAULT_I18N.operators, ...i18n?.operators },
    placeholders: { ...DEFAULT_I18N.placeholders, ...i18n?.placeholders },
    validation: { ...DEFAULT_I18N.validation, ...i18n?.validation },
  }

  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields])

  const updateFilter = useCallback((filterId, updates) => {
    onChange(map(filters, (f) => {
      if (f.id === filterId) {
        const updatedFilter = { ...f, ...updates }
        if (
          updates.operator === "empty" ||
          updates.operator === "not_empty"
        ) {
          updatedFilter.values = []
        }
        return updatedFilter
      }
      return f
    }))
  }, [filters, onChange])

  const removeFilter = useCallback((filterId) => {
    onChange(filter(filters, (f) => f.id !== filterId))
  }, [filters, onChange])

  const addFilter = useCallback((fieldKey) => {
    const field = fieldsMap[fieldKey]
    if (field && field.key) {
      const defaultOperator =
        field.defaultOperator ||
        (field.type === "multiselect" ? "is_any_of" : "is")
      const defaultValues = field.type === "text" ? [""] : []
      const newFilter = createFilter(fieldKey, defaultOperator, defaultValues)
      setLastAddedFilterId(newFilter.id)
      onChange([...filters, newFilter])
      setAddFilterOpen(false)
      setMenuSearchInput("")
    }
  }, [fieldsMap, filters, onChange])

  const selectableFields = useMemo(() => {
    const flatFields = flattenFields(fields)
    return filter(flatFields, (field) => {
      if (!field.key || field.type === "separator") return false
      if (allowMultiple) return true
      return !some(filters, (f) => f.field === field.key);
    });
  }, [fields, filters, allowMultiple])

  const filteredFields = useMemo(() => {
    return filter(selectableFields, (f) =>
      !menuSearchInput ||
      f.label?.toLowerCase().includes(menuSearchInput.toLowerCase()));
  }, [selectableFields, menuSearchInput])

  useEffect(() => {
    if (addFilterOpen && filteredFields.length > 0) {
      setHighlightedIndex(0)
    }
  }, [addFilterOpen, filteredFields.length])

  return (
    <FilterContext.Provider
      value={{
        variant,
        size,
        radius,
        i18n: mergedI18n,
        className,
        trigger,
        allowMultiple,
      }}>
      <div className={cn(filtersContainerVariants({ variant, size }), className)}>
        {selectableFields.length > 0 && (
          <DropdownMenu
            open={addFilterOpen}
            onOpenChange={(open) => {
              setAddFilterOpen(open)
              if (!open) {
                setMenuSearchInput("")
                setSessionFilterIds({})
              } else {
                setActiveMenu("root")
              }
            }}>
            <DropdownMenuTrigger asChild>
              {trigger || (
                <Button variant="outline">
                  <PlusIcon />
                  {mergedI18n.addFilter}
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn("w-[220px]", menuPopupClassName)} align="start">
              {showSearchInput && (
                <>
                  <div className="relative">
                    <Input
                      ref={rootInputRef}
                      role="combobox"
                      aria-controls={`${rootId}-listbox`}
                      aria-activedescendant={
                        highlightedIndex >= 0
                          ? `${rootId}-item-${highlightedIndex}`
                          : undefined
                      }
                      placeholder={mergedI18n.searchFields}
                      className={cn(
                        "h-8 rounded-none border-0 bg-transparent! px-2 text-sm shadow-none",
                        "focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
                      )}
                      value={menuSearchInput}
                      onChange={(e) => setMenuSearchInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault()
                          if (filteredFields.length > 0) {
                            setHighlightedIndex((prev) =>
                              prev < filteredFields.length - 1 ? prev + 1 : 0)
                          }
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault()
                          if (filteredFields.length > 0) {
                            setHighlightedIndex((prev) =>
                              prev > 0 ? prev - 1 : filteredFields.length - 1)
                          }
                        } else if (
                          (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
                          highlightedIndex >= 0
                        ) {
                          const field = filteredFields[highlightedIndex]
                          const hasSubMenu =
                            field &&
                            (field.type === "select" ||
                              field.type === "multiselect") &&
                            field.options?.length

                          if (e.key === "ArrowRight" && hasSubMenu) {
                            e.preventDefault()
                            setOpenSubMenu(field.key || null)
                            setActiveMenu(field.key || "root")
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault()
                            if (openSubMenu) {
                              setOpenSubMenu(null)
                              setActiveMenu("root")
                            }
                          }
                        } else if (e.key === "Enter" && highlightedIndex >= 0) {
                          e.preventDefault()
                          const field = filteredFields[highlightedIndex]
                          if (field.key) {
                            const hasSubMenu =
                              (field.type === "select" ||
                                field.type === "multiselect") &&
                              field.options?.length
                            if (!hasSubMenu) {
                              addFilter(field.key)
                            } else {
                              if (openSubMenu === field.key) {
                                setOpenSubMenu(null)
                                setActiveMenu("root")
                              } else {
                                setOpenSubMenu(field.key)
                                setActiveMenu(field.key)
                              }
                            }
                          }
                        } else if (e.key === "Escape") {
                          setAddFilterOpen(false)
                        }
                        e.stopPropagation()
                      }} />
                    {enableShortcut && shortcutLabel && (
                      <Kbd
                        className="bg-background absolute top-1/2 right-2 -translate-y-1/2 border">
                        {shortcutLabel}
                      </Kbd>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              <div className="relative flex max-h-full">
                <div
                  className="flex max-h-[min(var(--radix-dropdown-menu-content-available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain"
                  role="listbox"
                  id={`${rootId}-listbox`}>
                  <ScrollArea className="**:data-[slot=scroll-area-scrollbar]:m-0">
                    {(() => {
                      if (filteredFields.length === 0) {
                        return (
                          <div className="text-muted-foreground py-2 text-center text-sm">
                            {mergedI18n.noFieldsFound}
                          </div>
                        );
                      }

                      return map(filteredFields, (field, index) => {
                        const isHighlighted = highlightedIndex === index
                        const itemId = `${rootId}-item-${index}`
                        const hasSubMenu =
                          (field.type === "select" ||
                            field.type === "multiselect") &&
                          field.options?.length

                        if (hasSubMenu) {
                          const isMultiSelect = field.type === "multiselect"
                          const fieldKey = field.key
                          const sessionFilterId = sessionFilterIds[fieldKey]
                          const sessionFilter = sessionFilterId
                            ? find(filters, (f) => f.id === sessionFilterId)
                            : null
                          const currentValues = sessionFilter?.values || []

                          return (
                            <DropdownMenuSub
                              key={fieldKey}
                              open={openSubMenu === fieldKey}
                              onOpenChange={(open) => {
                                if (open) {
                                  setOpenSubMenu((prev) =>
                                    prev === fieldKey ? prev : fieldKey)
                                } else {
                                  if (openSubMenu === fieldKey) {
                                    setOpenSubMenu(null)
                                    setActiveMenu("root")
                                  }
                                }
                              }}>
                              <DropdownMenuSubTrigger
                                id={itemId}
                                role="option"
                                aria-selected={isHighlighted}
                                data-highlighted={isHighlighted || undefined}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground">
                                {field.icon}
                                <span>{field.label}</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-[200px]">
                                <FilterSubmenuContent
                                  field={field}
                                  currentValues={currentValues}
                                  isMultiSelect={isMultiSelect}
                                  i18n={mergedI18n}
                                  isActive={activeMenu === fieldKey}
                                  onActive={() => {
                                    if (field.searchable !== false) {
                                      setActiveMenu(fieldKey)
                                    }
                                  }}
                                  onBack={() => {
                                    setOpenSubMenu(null)
                                    setActiveMenu("root")
                                  }}
                                  onClose={() => setAddFilterOpen(false)}
                                  onToggle={(value, isSelected) => {
                                    if (isMultiSelect) {
                                      const nextValues = isSelected
                                        ? filter(currentValues, (v) => v !== value)
                                        : ([...currentValues, value])

                                      if (sessionFilter) {
                                        if (nextValues.length === 0) {
                                          onChange(filter(filters, (f) => f.id !== sessionFilter.id))
                                          setSessionFilterIds((prev) => ({
                                            ...prev,
                                            [fieldKey]: "",
                                          }))
                                        } else {
                                          onChange(map(filters, (f) =>
                                            f.id === sessionFilter.id
                                              ? { ...f, values: nextValues }
                                              : f))
                                        }
                                      } else {
                                        const newFilter = createFilter(fieldKey, field.defaultOperator || "is_any_of", nextValues)
                                        onChange([...filters, newFilter])
                                        setSessionFilterIds((prev) => ({
                                          ...prev,
                                          [fieldKey]: newFilter.id,
                                        }))
                                      }
                                    } else {
                                      const newFilter = createFilter(fieldKey, field.defaultOperator || "is", [value])
                                      setLastAddedFilterId(newFilter.id)
                                      onChange([...filters, newFilter])
                                      setAddFilterOpen(false)
                                    }
                                  }} />
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          );
                        }

                        return (
                          <DropdownMenuItem
                            key={field.key}
                            id={itemId}
                            role="option"
                            aria-selected={isHighlighted}
                            data-highlighted={isHighlighted || undefined}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={() => field.key && addFilter(field.key)}
                            className="data-highlighted:bg-accent data-highlighted:text-accent-foreground">
                            {field.icon}
                            <span>{field.label}</span>
                          </DropdownMenuItem>
                        );
                      });
                    })()}
                  </ScrollArea>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {map(filters, (filter) => {
          const field = fieldsMap[filter.field]
          if (!field) return null
          return (
            <ButtonGroup key={filter.id}>
              <ButtonGroupText className="">
                {field.icon && field.icon}
                {field.label}
              </ButtonGroupText>
              <FilterOperatorDropdown
                field={field}
                operator={filter.operator}
                values={filter.values}
                onChange={(operator) => updateFilter(filter.id, { operator })} />
              <FilterValueSelector
                field={field}
                values={filter.values}
                operator={filter.operator}
                onChange={(values) => updateFilter(filter.id, { values })}
                autoFocus={filter.id === lastAddedFilterId} />
              <FilterRemoveButton onClick={() => removeFilter(filter.id)} />
            </ButtonGroup>
          );
        })}
      </div>
    </FilterContext.Provider>
  );
}

export const createFilter = (field, operator, values = []) => ({
  id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  field,
  operator: operator || "is",
  values
})

export const createFilterGroup = (id, label, fields, initialFilters = []) => ({
  id,
  label,
  filters: initialFilters,
  fields
})