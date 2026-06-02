import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppModeStore, APP_MODES } from "@/store";
import { MODE_OPTIONS } from "@/components/mode-options";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";

import find from "lodash/find";
import map from "lodash/map";

/* Shared between auth layout and profile drawer. */

export function ModeDrawer({ open, onOpenChange }) {
  const { mode, setMode } = useAppModeStore();
  const [selected, setSelected] = useState(mode || APP_MODES.MADAGASCAR);

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      setSelected(mode || APP_MODES.MADAGASCAR);
    }
    onOpenChange(nextOpen);
  };

  const active =
    find(MODE_OPTIONS, (m) => m.value === selected) ?? MODE_OPTIONS[0];

  const handleApply = () => {
    setMode(selected);
    onOpenChange(false);
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        {/* Animated bg tint */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-[28px]">
          <AnimatePresence mode="sync">
            <motion.div
              key={`drawer-tint-${active.value}`}
              className={cn(
                "absolute inset-0 bg-gradient-to-b opacity-60",
                active.pageTint,
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            />
          </AnimatePresence>
        </div>

        {/* Header */}
        <div className="relative z-10 px-5 pb-1 pt-4 text-center">
          <p className="text-base font-bold">Pick your mood</p>
          <p className="text-xs text-muted-foreground">
            Choose the vibe that suits you today.
          </p>
        </div>

        {/* Mode cards */}
        <div className="relative z-10 flex flex-col gap-2.5 px-4 pt-3">
          {map(MODE_OPTIONS, (item) => {
            const isActive = selected === item.value;
            return (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => setSelected(item.value)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-[18px] border bg-background/90 px-3.5 py-3 text-left transition-all",
                  isActive
                    ? `bg-gradient-to-br ${item.accent} ${item.border}`
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    item.iconTone,
                  )}
                >
                  <item.icon className="size-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isActive
                      ? `${item.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  {isActive && (
                    <div className={cn("size-2.5 rounded-full", item.dotTone)} />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Apply button */}
        <div className="relative z-10 px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={handleApply}
            className="relative h-11 w-full overflow-hidden rounded-2xl text-sm font-semibold text-white"
          >
            <AnimatePresence mode="sync">
              <motion.span
                key={`apply-btn-${active.value}`}
                className={cn(
                  "absolute inset-0 bg-gradient-to-r",
                  active.buttonTone,
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              />
            </AnimatePresence>
            <span className="relative z-10">Apply</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ModeDrawer;
