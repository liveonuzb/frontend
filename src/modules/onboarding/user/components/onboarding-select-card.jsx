import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const getActiveCardTone = (tone) => {
  if (!tone) return "border-primary/30 bg-primary/10";
  const gradient = tone.cardTone ?? tone.accent;
  return gradient
    ? `bg-gradient-to-br ${gradient} ${tone.border}`
    : `${tone.border} bg-primary/10`;
};

const getInactiveMediaTone = (variant) =>
  variant === "compact" || variant === "drawer"
    ? "border-border/70 bg-background text-muted-foreground"
    : "border-border/70 bg-muted/40 text-muted-foreground";

const variantClassName = {
  row: "flex min-h-[76px] w-full items-center gap-3 rounded-2xl border bg-background/90 px-4 py-3 text-left shadow-sm backdrop-blur transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:min-h-[84px]",
  image:
    "relative flex min-h-[112px] w-full flex-col items-start gap-2 rounded-2xl border bg-background/90 px-3 py-3 text-left shadow-sm backdrop-blur transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:min-h-[148px] md:gap-4 md:rounded-3xl md:px-4",
  compact:
    "flex min-h-[52px] w-full items-center gap-3 rounded-xl border bg-background px-3 py-2 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  drawer:
    "flex min-h-[52px] w-full items-center gap-3 rounded-xl border bg-background px-3 py-2 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
};

const mediaClassName = {
  row: "flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-2xl border px-2 text-sm font-black",
  image:
    "flex size-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black md:size-16",
  compact:
    "flex size-8 shrink-0 items-center justify-center rounded-xl border text-xs font-black",
  drawer:
    "flex size-8 shrink-0 items-center justify-center rounded-xl border text-xs font-black",
};

const imageClassName = {
  row: "size-11 shrink-0 rounded-2xl",
  image: "size-11 rounded-2xl md:size-16",
  compact: "size-8 shrink-0 rounded-lg",
  drawer: "size-8 shrink-0 rounded-lg",
};

const imageFitClassName = {
  contain: "object-contain",
  cover: "object-cover",
};

const titleClassName = {
  row: "text-base font-black leading-tight",
  image: "text-sm font-bold leading-tight md:text-base",
  compact: "text-sm font-semibold leading-tight",
  drawer: "text-sm font-semibold leading-tight",
};

const descriptionClassName = {
  row: "mt-1 block text-xs font-medium leading-5 text-muted-foreground",
  image: "mt-1 block text-xs text-muted-foreground md:text-sm",
  compact: "mt-0.5 block text-xs text-muted-foreground",
  drawer: "mt-0.5 block text-xs text-muted-foreground",
};

const indicatorClassName = {
  row: "size-5",
  image: "size-5",
  compact: "size-4",
  drawer: "size-4",
};

export const OnboardingSelectCard = ({
  active = false,
  badge,
  className,
  description,
  disabled = false,
  imageAlt = "",
  imageClassName: imageClassNameProp,
  imageFit = "cover",
  imageUrl,
  icon: Icon,
  metaBadge,
  onClick,
  recommendedLabel,
  selectionMode = "single",
  title,
  tone = {},
  transitionDelay = 0,
  variant = "row",
}) => (
  <motion.button
    type="button"
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      variantClassName[variant] ?? variantClassName.row,
      active ? getActiveCardTone(tone) : "border-border/70",
      disabled && "cursor-not-allowed opacity-50 hover:border-border/70",
      className,
    )}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: transitionDelay }}
    whileTap={{ scale: 0.98 }}
  >
    {imageUrl ? (
      <img
        loading="lazy"
        src={imageUrl}
        alt={imageAlt}
        className={cn(
          imageClassName[variant] ?? imageClassName.row,
          imageFitClassName[imageFit] ?? imageFitClassName.cover,
          imageClassNameProp,
        )}
      />
    ) : (
      <span
        className={cn(
          mediaClassName[variant] ?? mediaClassName.row,
          active
            ? `${tone.badgeTone ?? ""} ${tone.border ?? ""}`
            : getInactiveMediaTone(variant),
        )}
        aria-hidden={Icon ? "true" : undefined}
      >
        {Icon ? <Icon className="size-5" aria-hidden="true" /> : badge}
      </span>
    )}
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className={titleClassName[variant] ?? titleClassName.row}>
          {title}
        </span>
        {recommendedLabel ? (
          <span className="rounded-full border border-border/60 bg-background/75 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {recommendedLabel}
          </span>
        ) : null}
      </span>
      {description ? (
        <span
          className={
            descriptionClassName[variant] ?? descriptionClassName.row
          }
        >
          {description}
        </span>
      ) : null}
      {metaBadge ? (
        <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {metaBadge}
        </span>
      ) : null}
    </span>
    {active ? (
      <CheckCircle2Icon
        className={cn(
          indicatorClassName[variant] ?? indicatorClassName.row,
          "shrink-0",
          variant === "image" ? "absolute right-3 top-3" : "",
          tone.textTone,
        )}
        aria-hidden="true"
      />
    ) : selectionMode === "multi" ? (
      <span
        className={cn(
          "shrink-0 rounded-full border border-border bg-background",
          variant === "compact" || variant === "drawer" ? "size-4" : "size-5",
          variant === "image" ? "absolute right-3 top-3" : "",
        )}
        aria-hidden="true"
      />
    ) : null}
  </motion.button>
);

export default OnboardingSelectCard;
