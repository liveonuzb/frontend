import React from "react";
import { cn } from "@/lib/utils";

export default function NutritionLayout({
  header,
  children,
  sidebar,
  bottomActions,
  className,
  mainClassName,
  sidebarClassName,
}) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {header ? <div>{header}</div> : null}
      <div
        className={cn(
          "grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]",
          !sidebar && "xl:grid-cols-1",
        )}
      >
        <main className={cn("min-w-0 space-y-5", mainClassName)}>
          {children}
        </main>
        {sidebar ? (
          <aside className={cn("min-w-0 space-y-5", sidebarClassName)}>
            {sidebar}
          </aside>
        ) : null}
      </div>
      {bottomActions ? <div>{bottomActions}</div> : null}
    </div>
  );
}

