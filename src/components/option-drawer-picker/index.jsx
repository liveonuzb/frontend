import React from "react";
import {
  filter,
  find,
  get,
  includes,
  isArray,
  map,
  toLower,
  trim,
} from "lodash";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const getResponseItems = (response) => {
  const payload = get(response, "data.data", get(response, "data", []));
  if (isArray(payload)) return payload;
  return get(payload, "data", []);
};

const OptionDrawerPicker = ({
  value,
  onChange,
  onValueChange,
  onOptionChange,
  url,
  queryKey,
  params,
  options = [],
  valueKey = "value",
  labelKey = "label",
  descriptionKey = "description",
  getOptionValue,
  getOptionLabel,
  getOptionDescription,
  className,
  title = "Tanlang",
  description,
  placeholder = "Tanlang",
  triggerClassName,
  searchPlaceholder = "Qidirish...",
  disabled,
  enabled = true,
  loadingText = "Yuklanmoqda...",
  emptyText = "Ma'lumot topilmadi",
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { data, isLoading } = useGetQuery({
    url: url || "__option-drawer-picker-disabled__",
    params,
    queryProps: {
      queryKey: queryKey || [url, params],
      enabled: Boolean(url) && enabled,
    },
  });

  const sourceOptions = url ? getResponseItems(data) : options;
  const getValue = React.useCallback(
    (option) => getOptionValue?.(option) ?? get(option, valueKey),
    [getOptionValue, valueKey],
  );
  const getLabel = React.useCallback(
    (option) => String(getOptionLabel?.(option) ?? get(option, labelKey, "")),
    [getOptionLabel, labelKey],
  );
  const getDescription = React.useCallback(
    (option) =>
      getOptionDescription?.(option) ?? get(option, descriptionKey, ""),
    [descriptionKey, getOptionDescription],
  );

  const selectedOption = find(
    sourceOptions,
    (option) => getValue(option) === value,
  );
  const normalizedSearch = toLower(trim(search));
  const filteredOptions = normalizedSearch
    ? filter(sourceOptions, (option) => {
        const searchableText = toLower(
          [
            getLabel(option),
            getDescription(option),
            getValue(option),
          ].join(" "),
        );

        return includes(searchableText, normalizedSearch);
      })
    : sourceOptions;

  const handleSelect = React.useCallback(
    (nextValue, option) => {
      onChange?.(nextValue);
      onValueChange?.(nextValue);
      onOptionChange?.(option);
      setOpen(false);
    },
    [onChange, onOptionChange, onValueChange],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
      direction="bottom"
    >
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between gap-3 text-left font-normal",
          triggerClassName,
          className,
        )}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? getLabel(selectedOption) : placeholder}
        </span>
        <ChevronDownIcon data-icon="inline-end" />
      </Button>

      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader className="items-center text-center">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
          <InputGroup className="mt-3 h-11">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </InputGroup>
        </DrawerHeader>
        <div className="no-scrollbar flex h-96 max-h-96 flex-col gap-2 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loadingText}
            </p>
          ) : filteredOptions.length ? (
            map(filteredOptions, (option) => {
              const optionValue = getValue(option);
              const optionDescription = getDescription(option);
              const isSelected = optionValue === value;

              return (
                <button
                  key={String(optionValue)}
                  type="button"
                  className="block w-full text-left"
                  onClick={() => handleSelect(optionValue, option)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border p-4",
                      isSelected && "border-primary",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{getLabel(option)}</p>
                      {optionDescription ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {optionDescription}
                        </p>
                      ) : null}
                    </div>
                    {isSelected ? (
                      <CheckIcon className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </div>
                </button>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default OptionDrawerPicker;
