import { clamp } from "lodash";
import React from "react";
import { cn } from "@/lib/utils";

const CircularProgress = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color,
  trackColor,
  children,
  className,
  animated = true,
}) => {
  const pct = clamp((value / max) * 100, 0, 100);
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackColor || "currentColor"}
          strokeWidth={strokeWidth}
          className={!trackColor ? "text-muted" : undefined}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color || "hsl(var(--primary))"}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={animated ? "transition-all duration-700" : undefined}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
