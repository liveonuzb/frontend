import React from "react";
import { times } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingSkeleton = ({ rows = 6, className = "" }) => (
  <div
    className={`rounded-[2rem] border border-border/60 bg-card/60 p-4 ${className}`}
  >
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-52 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      <div className="space-y-2">
        {times(rows, (index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border border-border/40 p-3"
          >
            <Skeleton className="h-5 w-2/3 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default LoadingSkeleton;
