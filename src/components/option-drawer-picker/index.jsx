import React from "react";
import { find, map } from "lodash";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedOption =
    find(options, (option) => option.value === value) ?? options[0] ?? null;

  const handleSelect = React.useCallback(
    (nextValue) => {
      onValueChange?.(nextValue);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
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
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </Button>

      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>
        <div className="space-y-2 px-4 pb-4">
          {map(options, (option) => {
            const isSelected = option.value === selectedOption?.value;

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
                  {isSelected ? <CheckIcon className="size-4 text-primary" /> : null}
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
