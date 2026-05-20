import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const getActiveCardClassName = (tone = {}) =>
  `border-transparent bg-gradient-to-br ${tone.cardTone ?? ""} ${
    tone.border ?? ""
  } shadow-[0_18px_42px_rgba(15,23,42,0.10)] ring-1 ring-inset`;

const OnboardingOption = ({
  active = false,
  badge,
  className,
  description,
  onClick,
  recommendedLabel,
  title,
  tone = {},
  transitionDelay = 0,
}) => (
  <motion.button
    type="button"
    data-meal-frequency-option="true"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "group grid min-h-[72px] w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 md:min-h-[80px] md:px-4",
      active
        ? getActiveCardClassName(tone)
        : "border-border/70 bg-background/92 shadow-sm hover:border-primary/30 hover:bg-background hover:shadow-md",
      className,
    )}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: transitionDelay }}
    whileTap={{ scale: 0.98 }}
  >
    <span
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-xl border text-base font-black md:size-12",
        active
          ? `${tone.badgeTone ?? ""} ${tone.border ?? ""}`
          : "border-border/70 bg-muted/45 text-muted-foreground",
      )}
    >
      {badge}
      <span
        className={cn(
          "absolute -bottom-1 -right-1 size-3 rounded-full ring-2 ring-background",
          tone.dotTone ?? "bg-primary",
          active ? "opacity-100" : "opacity-40",
        )}
        aria-hidden="true"
      />
    </span>

    <span className="min-w-0">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-black leading-tight md:text-[15px]">
          {title}
        </span>
        {recommendedLabel ? (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-normal",
              active
                ? `${tone.badgeTone ?? ""} ${tone.border ?? ""}`
                : "border-border/60 bg-muted/55 text-muted-foreground",
            )}
          >
            {recommendedLabel}
          </span>
        ) : null}
      </span>
      {description ? (
        <span className="mt-1 block text-xs font-medium leading-4 text-muted-foreground md:text-[13px]">
          {description}
        </span>
      ) : null}
    </span>

    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border transition",
        active
          ? `${tone.badgeTone ?? ""} ${tone.border ?? ""} ${
              tone.textTone ?? ""
            }`
          : "border-border/60 bg-muted/35 text-muted-foreground/70 group-hover:border-primary/25",
      )}
      aria-hidden="true"
    >
      {active ? (
        <CheckCircle2Icon className="size-5" />
      ) : (
        <span className={cn("size-2 rounded-full", tone.dotTone ?? "bg-primary")} />
      )}
    </span>
  </motion.button>
);

export default OnboardingOption;
