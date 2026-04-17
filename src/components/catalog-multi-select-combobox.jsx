import React from "react";
import { isArray, trim } from "lodash";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";

const fallbackOption = (value) => ({
  value,
  label: value,
  isActive: false,
});

export function CatalogMultiSelectCombobox({
  label,
  description,
  options,
  values,
  onChange,
  emptyText,
}) {
  const containerRef = React.useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);

  const selectedValues = React.useMemo(
    () =>
      (isArray(values) ? values : [])
        .map((value) => trim(String(value)))
        .filter(Boolean),
    [values],
  );

  const normalizedOptions = React.useMemo(() => {
    const baseOptions = isArray(options) ? options : [];
    const knownValues = new Set(baseOptions.map((option) => option.value));
    const nextOptions = [...baseOptions];

    selectedValues.forEach((value) => {
      if (!knownValues.has(value)) {
        nextOptions.push(fallbackOption(value));
        knownValues.add(value);
      }
    });

    return nextOptions;
  }, [options, selectedValues]);

  const optionMap = React.useMemo(
    () => new Map(normalizedOptions.map((option) => [option.value, option])),
    [normalizedOptions],
  );

  const items = React.useMemo(
    () => normalizedOptions.map((option) => option.value),
    [normalizedOptions],
  );

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = trim(deferredQuery).toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      const option = optionMap.get(item) ?? fallbackOption(item);
      return (
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.value.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [deferredQuery, items, optionMap]);

  return (
    <div
      ref={containerRef}
      className="space-y-3"
      onFocusCapture={() => setIsOpen(true)}
      onBlurCapture={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) {
          setIsOpen(false);
          setQuery("");
        }
      }}
    >
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {items.length ? (
        <Combobox
          inline
          multiple
          autoHighlight
          items={items}
          filteredItems={filteredItems}
          value={selectedValues}
          inputValue={query}
          onInputValueChange={setQuery}
          isItemEqualToValue={(item, value) => item === value}
          itemToStringLabel={(item) => optionMap.get(item)?.label ?? item}
          onValueChange={(nextValue) =>
            onChange(isArray(nextValue) ? nextValue : [])
          }
        >
          <ComboboxChips className="w-full">
            <ComboboxValue>
              {(nextValues) => (
                <>
                  {nextValues.map((item) => (
                    <ComboboxChip key={item}>
                      {optionMap.get(item)?.label ?? item}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    placeholder={`${label} bo'yicha qidiring`}
                  />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>

          {isOpen ? (
            <div className="rounded-2xl border">
              {filteredItems.length ? (
                <ComboboxList className="max-h-56 p-1">
                  {(item) => {
                    const option = optionMap.get(item) ?? fallbackOption(item);

                    return (
                      <ComboboxItem key={item} value={item}>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{option.label}</p>
                          {!option.isActive ? (
                            <p className="text-xs text-muted-foreground">
                              Faol emas
                            </p>
                          ) : null}
                        </div>
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {emptyText || "Mos natija topilmadi."}
                </div>
              )}
            </div>
          ) : null}
        </Combobox>
      ) : (
        <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </div>
  );
}
