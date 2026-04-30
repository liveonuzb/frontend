import React from "react";
import {
  filter,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const getResponseItems = (response) => {
  const payload = get(response, "data.data", get(response, "data", []));
  if (isArray(payload)) return payload;
  return get(payload, "data", []);
};

const MultipleDrawerPicker = ({
  value = [],
  onChange,
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
  title = "Tanlang",
  description,
  placeholder = "Tanlang",
  searchPlaceholder = "Qidirish...",
  triggerClassName,
  className,
  disabled,
  loadingText = "Yuklanmoqda...",
  emptyText = "Ma'lumot topilmadi",
  doneLabel = "Tanlash",
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { data, isLoading } = useGetQuery({
    url: url || "__multiple-drawer-picker-disabled__",
    params,
    queryProps: {
      queryKey: queryKey || [url, params],
      enabled: Boolean(url),
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

  const selectedOptions = filter(sourceOptions, (option) =>
    includes(value, getValue(option)),
  );
  const selectedLabel = selectedOptions.length
    ? map(selectedOptions, getLabel).join(", ")
    : placeholder;
  const normalizedSearch = toLower(trim(search));
  const filteredOptions = normalizedSearch
    ? filter(sourceOptions, (option) =>
        includes(
          toLower(
            [
              getLabel(option),
              getDescription(option),
              getValue(option),
            ].join(" "),
          ),
          normalizedSearch,
        ),
      )
    : sourceOptions;

  const toggleValue = React.useCallback(
    (nextValue, checked) => {
      onChange?.(
        checked
          ? [...value, nextValue]
          : filter(value, (item) => item !== nextValue),
      );
    },
    [onChange, value],
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
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{selectedLabel}</span>
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
              const checked = includes(value, optionValue);
              const optionDescription = getDescription(option);

              return (
                <label
                  key={String(optionValue)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4",
                    checked && "border-primary",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{getLabel(option)}</p>
                    {optionDescription ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {optionDescription}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {checked ? <CheckIcon className="size-4 text-primary" /> : null}
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        toggleValue(optionValue, Boolean(nextChecked))
                      }
                    />
                  </div>
                </label>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          )}
        </div>

        <DrawerFooter className="border-t bg-muted/5 px-5 py-4">
          <Button type="button" onClick={() => setOpen(false)}>
            {doneLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MultipleDrawerPicker;
