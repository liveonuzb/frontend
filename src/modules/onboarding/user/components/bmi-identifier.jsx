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

  return (
    <motion.div
      key={`${title}-${meta.key}-${meta.bmi.toFixed(1)}`}
      className={cn(
        "mx-auto mt-4 w-full max-w-md rounded-[28px] border bg-gradient-to-br px-4 py-3 text-center backdrop-blur md:mt-6 md:px-5 md:py-4",
        meta.border,
        meta.cardTone,
      )}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground md:text-xs">
        {title}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <p className="text-3xl font-black leading-none tabular-nums md:text-4xl">
          {meta.bmi.toFixed(1)}
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold md:text-xs",
            meta.badgeTone,
          )}
        >
          {meta.label}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
        {Number.isFinite(numericHeight) && numericHeight > 0 ? (
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-muted-foreground">
            Based on {numericHeight} cm
          </span>
        ) : null}
        {note ? <span className={cn("rounded-full px-3 py-1", meta.badgeTone)}>{note}</span> : null}
      </div>
    </motion.div>
  );
};

export default BmiIdentifier;
