import React from "react";
import DateNav from "@/components/date-nav";
import { cn } from "@/lib/utils";

export const TrackingPageHeader = ({
  title,
  subtitle,
  date,
  onDateChange,
  dateFormat = "long",
  actions,
  hideTitleOnMobile = true,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className={cn("min-w-0", hideTitleOnMobile && "hidden sm:block")}>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {date && onDateChange ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:self-center">
          <DateNav
            date={date}
            onChange={onDateChange}
            format={dateFormat}
            className="justify-between rounded-[1.25rem] border px-2 py-1 sm:hidden"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {actions}
            <DateNav
              date={date}
              onChange={onDateChange}
              className="hidden sm:flex"
            />
          </div>
        </div>
      ) : actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:self-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
};

export const TrackingPageLayout = ({
  aside,
  children,
  className,
  asideClassName,
  contentClassName,
  stickyAside = true,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-8",
        aside && "lg:grid-cols-[380px_1fr]",
        className,
      )}
    >
      {aside ? (
        <div
          className={cn(
            stickyAside && "lg:sticky lg:top-4 lg:self-start",
            asideClassName,
          )}
        >
          {aside}
        </div>
      ) : null}
      <div className={cn("flex flex-col gap-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
};

