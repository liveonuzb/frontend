import React from "react";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { get } from "lodash";

export const AiInsightWidget = ({ insight }) => {
  if (!insight) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
    >
      <div
        className={cn(
          "p-[1px] rounded-2xl bg-gradient-to-b w-full",
          get(insight, "color"),
        )}
      >
        <div className="bg-card w-full rounded-2xl p-4 flex gap-3 items-start shadow-sm border border-muted/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          <div
            className={cn(
              "size-8 rounded-full flex items-center justify-center shrink-0 bg-background shadow-sm border border-border/50",
              get(insight, "textColor"),
            )}
          >
            <SparklesIcon className="size-4" />
          </div>
          <div className="flex-1 mt-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-1">
              AI Tahlil
            </h4>
            <p className="text-sm font-medium text-muted-foreground leading-snug text-balance">
              {get(insight, "message")}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
