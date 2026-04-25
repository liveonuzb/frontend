import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router";
import { ChevronRight, LeafIcon, PalmtreeIcon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppModeStore, APP_MODES } from "@/store";

const MODES = [
  {
    value: APP_MODES.FOCUS,
    label: "Focus",
    title: "Focus mode",
    description:
      "Clean, minimal and distraction-free. Pure defaults, pure clarity.",
    icon: TargetIcon,
    accent: "from-slate-500/16 via-zinc-400/9 to-transparent",
    pageTint: "from-slate-500/18 via-zinc-400/10 to-transparent",
    border: "border-slate-400/25",
    iconTone: "bg-gradient-to-br from-slate-500 to-zinc-600 text-white",
    badgeTone: "bg-slate-500/10 text-slate-700",
    dotTone: "bg-gradient-to-br from-slate-500 to-zinc-600",
    buttonTone:
      "from-slate-600 to-zinc-700 hover:from-slate-600/90 hover:to-zinc-700/90 text-white shadow-[0_18px_44px_rgba(71,85,105,0.22)]",
  },
  {
    value: APP_MODES.ZEN,
    label: "Zen",
    title: "Zen mode",
    description:
      "Soft, calm and nature-inspired. A gentle green space for steady progress.",
    icon: LeafIcon,
    accent: "from-teal-500/15 via-green-400/8 to-transparent",
    pageTint: "from-teal-500/18 via-green-400/10 to-transparent",
    border: "border-teal-600/22",
    iconTone: "bg-gradient-to-br from-teal-500 to-green-600 text-white",
    badgeTone: "bg-teal-500/10 text-teal-700",
    dotTone: "bg-gradient-to-br from-teal-500 to-green-600",
    buttonTone:
      "from-teal-600 to-green-700 hover:from-teal-600/90 hover:to-green-700/90 text-white shadow-[0_18px_44px_rgba(20,148,122,0.22)]",
  },
  {
    value: APP_MODES.MADAGASCAR,
    label: "Madagascar",
    title: "Madagascar mode",
    description:
      "Wild, playful and energetic. Turn your routine into an adventure.",
    icon: PalmtreeIcon,
    accent: "from-amber-500/18 via-orange-400/10 to-transparent",
    pageTint: "from-amber-500/20 via-orange-400/10 to-transparent",
    border: "border-amber-500/25",
    iconTone: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    badgeTone: "bg-amber-500/10 text-amber-700",
    dotTone: "bg-gradient-to-br from-amber-500 to-orange-500",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.26)]",
  },
];

const SelectModePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, setMode } = useAppModeStore();
  const [selected, setSelected] = useState(mode || MODES[0].value);

  const active = MODES.find((m) => m.value === selected) ?? MODES[0];
  const returnTo = location.state?.returnTo;

  const handleContinue = () => {
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }
    navigate("/auth");
  };

  return (
    <div className="relative flex h-svh min-h-svh w-full flex-col overflow-hidden bg-background px-5 pb-6 pt-8 md:pt-12">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          key={`mode-wash-${active.value}`}
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-80",
            active.pageTint,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        />
        <motion.div
          key={`mode-aura-top-${active.value}`}
          className={cn(
            "absolute left-1/2 top-[6%] h-[30%] w-[82%] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl",
            active.pageTint,
          )}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
        />
        <motion.div
          key={`mode-aura-bottom-${active.value}`}
          className={cn(
            "absolute inset-x-[10%] bottom-[-6%] h-[22%] rounded-full bg-gradient-to-t blur-3xl",
            active.pageTint,
          )}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.04 }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-1 flex-col justify-center">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">
            Pick your mood
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
            Choose the vibe that suits you today.
          </p>
        </div>

        <div className="relative mt-4 flex min-h-[110px] flex-1 items-center justify-center overflow-hidden md:mt-6 md:min-h-[150px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`mode-hero-${active.value}`}
              className={cn(
                "flex size-24 items-center justify-center rounded-[28px] shadow-xl md:size-36 md:rounded-[40px]",
                active.iconTone,
              )}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <active.icon className="size-12 md:size-20" strokeWidth={1.5} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-2.5 md:gap-3">
          {MODES.map((item) => {
            const isActive = selected === item.value;
            return (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => {
                  setSelected(item.value);
                  setMode(item.value);
                }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-start gap-3 rounded-[20px] border bg-background/90 px-4 py-3 text-left transition-all md:gap-4 md:rounded-3xl md:px-5 md:py-4",
                  isActive
                    ? `bg-gradient-to-br ${item.accent} ${item.border}`
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl md:size-11 md:rounded-2xl",
                    item.iconTone,
                  )}
                >
                  <item.icon className="size-5 md:size-5.5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold md:text-base">
                      {item.title}
                    </p>
                    {item.value === APP_MODES.FOCUS ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold md:text-[11px]",
                          item.badgeTone,
                        )}
                      >
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                    {item.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 md:size-6",
                    isActive
                      ? `${item.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  <div
                    className={cn(
                      "size-2.5 rounded-full transition-all md:size-3",
                      isActive ? item.dotTone : "scale-0 opacity-0",
                    )}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        <Button
          type="button"
          size="lg"
          className={cn(
            "mt-4 h-12 w-full border-transparent bg-gradient-to-r transition-all md:mt-5",
            active.buttonTone,
          )}
          onClick={handleContinue}
        >
          Continue <ChevronRight />
        </Button>
      </div>
    </div>
  );
};

export default SelectModePage;
