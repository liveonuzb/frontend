import React, { useEffect, useState } from "react";
import { LeafIcon, PalmtreeIcon, TargetIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppModeStore, APP_MODES } from "@/store";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";

/* ─────────────────────────────────────────────
   MODE SELECTION BOTTOM DRAWER
   Shared between auth layout and profile drawer.
   ───────────────────────────────────────────── */

export const MODE_OPTIONS = [
  {
    value: APP_MODES.FOCUS,
    title: "Focus mode",
    description: "Clean, minimal and distraction-free.",
    icon: TargetIcon,
    accent: "from-slate-500/16 via-zinc-400/9 to-transparent",
    pageTint: "from-slate-500/18 via-zinc-400/10 to-transparent",
    border: "border-slate-400/25",
    iconTone: "bg-gradient-to-br from-slate-500 to-zinc-600 text-white",
    dotTone: "bg-gradient-to-br from-slate-500 to-zinc-600",
    buttonTone:
      "from-slate-600 to-zinc-700 hover:from-slate-600/90 hover:to-zinc-700/90 text-white shadow-[0_18px_44px_rgba(71,85,105,0.22)]",
  },
  {
    value: APP_MODES.ZEN,
    title: "Zen mode",
    description: "Soft, calm and nature-inspired.",
    icon: LeafIcon,
    accent: "from-teal-500/15 via-green-400/8 to-transparent",
    pageTint: "from-teal-500/18 via-green-400/10 to-transparent",
    border: "border-teal-600/22",
    iconTone: "bg-gradient-to-br from-teal-500 to-green-600 text-white",
    dotTone: "bg-gradient-to-br from-teal-500 to-green-600",
    buttonTone:
      "from-teal-600 to-green-700 hover:from-teal-600/90 hover:to-green-700/90 text-white shadow-[0_18px_44px_rgba(20,148,122,0.22)]",
  },
  {
    value: APP_MODES.MADAGASCAR,
    title: "Madagascar mode",
    description: "Wild, playful and energetic.",
    icon: PalmtreeIcon,
    accent: "from-amber-500/18 via-orange-400/10 to-transparent",
    pageTint: "from-amber-500/20 via-orange-400/10 to-transparent",
    border: "border-amber-500/25",
    iconTone: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    dotTone: "bg-gradient-to-br from-amber-500 to-orange-500",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.26)]",
  },
];

export function ModeDrawer({ open, onOpenChange }) {
  const { mode, setMode } = useAppModeStore();
  const [selected, setSelected] = useState(mode || APP_MODES.FOCUS);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(mode || APP_MODES.FOCUS);
    }
  }, [open, mode]);

  const active =
    MODE_OPTIONS.find((m) => m.value === selected) ?? MODE_OPTIONS[0];

  const handleApply = () => {
    setMode(selected);
    onOpenChange(false);
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
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
          {MODE_OPTIONS.map((item) => {
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
                    <div
                      className={cn("size-2.5 rounded-full", item.dotTone)}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Apply button */}
        <div className="relative z-10 px-4 pb-6 pt-3">
          <DrawerClose asChild>
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
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ModeDrawer;
