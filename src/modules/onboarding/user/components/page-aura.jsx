import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PageAura = ({ tone }) => {
  if (!tone) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        key={`wash-${tone.pageTint}`}
        className={cn("absolute inset-0 bg-gradient-to-b opacity-80", tone.pageTint)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      />
      <motion.div
        key={`top-${tone.pageTint}`}
        className={cn(
          "absolute left-1/2 top-[8%] h-[28%] w-[82%] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl md:top-[12%] md:h-[34%] md:w-[64%]",
          tone.pageTint,
        )}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      />
      <motion.div
        key={`bottom-${tone.pageTint}`}
        className={cn(
          "absolute inset-x-[10%] bottom-[-8%] h-[22%] rounded-full bg-gradient-to-t blur-3xl md:bottom-[-4%] md:h-[26%] md:inset-x-[18%]",
          tone.pageTint,
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.04 }}
      />
    </div>
  );
};

export default PageAura;
