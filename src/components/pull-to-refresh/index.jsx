import React from "react";
import { RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import usePullToRefresh from "@/hooks/utils/use-pull-to-refresh";

const PullToRefresh = ({ children, onRefresh, enabled = true }) => {
  const { pullDistance, refreshing, progress } = usePullToRefresh(
    enabled ? onRefresh : null,
    enabled,
  );

  // Only show on mobile (touch devices)
  const isTouchDevice = "ontouchstart" in window;

  if (!isTouchDevice || !enabled) return children;

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-opacity duration-200 z-10",
          pullDistance > 0 ? "opacity-100" : "opacity-0",
        )}
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div
          className={cn(
            "size-10 rounded-full bg-background border shadow-sm flex items-center justify-center",
            refreshing && "animate-spin",
          )}
        >
          <RefreshCwIcon
            className={cn(
              "size-4 text-primary transition-transform",
              progress >= 100 && !refreshing && "text-green-500",
            )}
            style={{
              transform: refreshing
                ? "none"
                : `rotate(${(progress / 100) * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        style={{
          transform:
            pullDistance > 0 ? `translateY(${pullDistance}px)` : "none",
          transition: pullDistance === 0 ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
