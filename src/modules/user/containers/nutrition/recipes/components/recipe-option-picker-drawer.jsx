import React from "react";
import { CheckIcon } from "lucide-react";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils.js";

const RecipeOptionPickerDrawer = ({
  open,
  title,
  description,
  options,
  value,
  onOpenChange,
  onSelect,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md">
      <DrawerHeader className="border-b border-border/40">
        <DrawerTitle>{title}</DrawerTitle>
        {description ? (
          <DrawerDescription>{description}</DrawerDescription>
        ) : null}
      </DrawerHeader>
      <DrawerBody className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          {map(options, (option) => {
            const optionValue = option.value || option;
            const optionLabel = option.label || option;
            const selected = value === optionValue;

            return (
              <button
                key={optionValue}
                type="button"
                className={cn(
                  "flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted/50",
                )}
                onClick={() => {
                  onSelect(optionValue);
                  onOpenChange(false);
                }}
              >
                <span className="min-w-0 truncate">{optionLabel}</span>
                {selected ? <CheckIcon className="size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      </DrawerBody>
      <DrawerFooter className="border-t border-border/40 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Yopish
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

export default RecipeOptionPickerDrawer;
