import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BmiIdentifier = ({
  meta,
  heightValue,
  title = "BMI",
  note = null,
}) => {
  if (!meta) return null;

  const numericHeight = Number(heightValue);
  const hasHeight = Number.isFinite(numericHeight) && numericHeight > 0;

  return (
    <motion.div
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border bg-gradient-to-br px-3 py-2 backdrop-blur",
        meta.border,
        meta.cardTone,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <p className="text-2xl font-black leading-none tabular-nums">
            {meta.bmi.toFixed(1)}
          </p>
          <div className="flex min-w-0 flex-col">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground leading-tight">
              {title}
            </p>
            <span
              className={cn(
                "mt-0.5 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight",
                meta.badgeTone,
              )}
            >
              {meta.label}
            </span>
          </div>
        </div>
        {hasHeight ? (
          <span className="shrink-0 rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {numericHeight} cm
          </span>
        ) : null}
      </div>
      {note ? (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          {note}
        </p>
      ) : null}
    </motion.div>
  );
};

export default BmiIdentifier;
