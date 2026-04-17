import React, { useState } from "react";
import { defaultTo, find } from "lodash";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

const intervals = [
  { label: "30 daqiqa", value: "30 min" },
  { label: "1 soat", value: "1 hour" },
  { label: "1.5 soat", value: "1.5 hours" },
  { label: "2 soat", value: "2 hours" },
  { label: "3 soat", value: "3 hours" },
];

export default function IntervalDrawer({ children }) {
  const {
    goals: { waterNotifInterval },
    setGoal,
  } = useHealthGoals();
  const [open, setOpen] = useState(false);
  const [tempVal, setTempVal] = useState(defaultTo(waterNotifInterval, "1 hour"));

  const handleSave = async () => {
    if (tempVal) {
      try {
        await setGoal("waterNotifInterval", tempVal);
        setOpen(false);
      } catch {
        // noop
      }
    }
  };

  React.useEffect(() => {
    if (open) {
      setTempVal(defaultTo(waterNotifInterval, "1 hour"));
    }
  }, [open, waterNotifInterval]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Intervalni tanlang</DrawerTitle>
          <DrawerDescription>
            Har qancha vaqtda suv ichishni eslatishini tanlang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {intervals.map((interval) => {
              const isSelected = tempVal === find(intervals, { value: interval.value })?.value;
              return (
                <button
                  key={interval.value}
                  onClick={() => setTempVal(interval.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold transition-all border-2",
                    isSelected
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-card border-transparent hover:border-border hover:bg-muted/50 text-foreground shadow-sm",
                  )}
                >
                  <span className={cn(isSelected && "text-primary text-base")}>
                    {interval.label}
                  </span>
                  <div
                    className={cn(
                      "size-5 rounded-full flex items-center justify-center border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 bg-transparent",
                    )}
                  >
                    {isSelected && (
                      <CheckIcon className="size-3 text-white stroke-[3]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DrawerBody>

        <DrawerFooter className="mt-4">
          <Button
            onClick={handleSave}
            disabled={!tempVal}
            className="w-full h-12 rounded-xl text-md font-bold"
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
