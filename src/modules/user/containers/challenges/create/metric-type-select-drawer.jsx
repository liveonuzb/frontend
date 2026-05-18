import React from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { getMetricMeta, METRIC_TYPE_OPTIONS } from "../challenge-utils.js";

import { map } from "lodash";

const MetricTypeSelectTrigger = ({ value, onClick }) => {
  const selected = getMetricMeta(value);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-left text-sm transition hover:bg-muted/40"
    >
      <span className="flex items-center gap-3 font-medium">
        <span className="text-lg">{selected.emoji}</span>
        {selected.title}
      </span>
      <span className="text-xs text-muted-foreground">{selected.unit}</span>
    </button>
  );
};

export const MetricTypeSelectDrawer = ({ open, onOpenChange, value, onChange }) => {
  const [draft, setDraft] = React.useState(value || "STEPS");

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) setDraft(value || "STEPS");
  }, [open, value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleApply = () => {
    onChange(draft);
    onOpenChange(false);
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <DrawerHeader className="text-center">
          <DrawerTitle>O'lchov turini tanlang</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-2">
          {map(METRIC_TYPE_OPTIONS, (option) => {
            const active = draft === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraft(option.value)}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                  )}
                >
                  {active ? <CheckIcon className="size-3" /> : null}
                </span>
                <span className="text-2xl">{option.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{option.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {option.unit}
                  </span>
                </span>
              </button>
            );
          })}
        </DrawerBody>
        <DrawerFooter>
          <Button onClick={handleApply} className="h-10 font-medium">
            Tanlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MetricTypeSelectTrigger;
