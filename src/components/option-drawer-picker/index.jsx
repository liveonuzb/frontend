import React from "react";
import { filter, find, get, includes, map, toLower, trim } from "lodash";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
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

const OptionDrawerPicker = ({
  value,
  onValueChange,
  options = [],
  className,
  title = "Tanlang",
  description,
  placeholder = "Tanlang",
  triggerClassName,
  searchPlaceholder = "Qidirish...",
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = find(options, (option) => option.value === value);
  const normalizedSearch = toLower(trim(search));
  const filteredOptions = normalizedSearch
    ? filter(options, (option) => {
        const searchableText = toLower(
          [
            get(option, "label", ""),
            get(option, "description", ""),
            get(option, "value", ""),
          ].join(" "),
        );

        return includes(searchableText, normalizedSearch);
      })
    : options;

  const handleSelect = React.useCallback(
    (nextValue) => {
      onValueChange?.(nextValue);
      setOpen(false);
    },
    [onValueChange],
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
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon data-icon="inline-end" />
      </Button>

      <DrawerContent>
        <DrawerHeader className="text-left">
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
          {map(filteredOptions, (option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className="block w-full text-left"
                onClick={() => handleSelect(option.value)}
              >
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border p-4",
                    isSelected && "border-primary",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{option.label}</p>
                    {option.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    ) : null}
                  </div>
                  {isSelected ? (
                    <CheckIcon className="size-4 text-primary" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default OptionDrawerPicker;
