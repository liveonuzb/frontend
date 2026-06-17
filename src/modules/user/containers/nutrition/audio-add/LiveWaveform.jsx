import React from "react";
import { cn } from "@/lib/utils";

const fallbackBars = Array.from({ length: 18 }, (_, index) => {
  const center = Math.abs(index - 8.5);
  return Math.max(0.16, 0.58 - center * 0.045);
});

const LiveWaveform = ({ levels = fallbackBars, active = false, className }) => {
  const bars = levels?.length ? levels : fallbackBars;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-12 items-center justify-center gap-1.5 rounded-3xl bg-emerald-50/60 px-4 motion-reduce:transition-none",
        active && "bg-emerald-100/70 shadow-[0_0_30px_rgba(16,185,129,0.18)]",
        className,
      )}
    >
      {bars.map((level, index) => (
        <span
          key={`wave-${index}`}
          className={cn(
            "block w-1.5 rounded-full bg-emerald-500/45 transition-[height,opacity] duration-100 motion-reduce:transition-none",
            active && "bg-emerald-600/80",
            !active && "opacity-55",
          )}
          style={{
            height: `${Math.max(8, Math.round((level || 0.15) * 42))}px`,
            animationDelay: `${index * 35}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default LiveWaveform;
