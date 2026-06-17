import { cn } from "@/lib/utils";

export const userCardClassName =
  "user-card rounded-2xl border-0 bg-card text-card-foreground shadow-none ring-0";

export const userSurfaceClassName =
  "user-surface rounded-2xl border-0 bg-card text-card-foreground shadow-none ring-0";

export const userInteractiveCardClassName = cn(
  userCardClassName,
  "transition-colors hover:bg-muted/40 active:bg-muted/60",
);

export const userAccentCardClassName = cn(
  userCardClassName,
  "bg-card/95 supports-[backdrop-filter]:bg-card/90",
);

export const userCardScopeClassName =
  "user-card-scope [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:ring-0";

export const getUserCardClassName = (...classNames) =>
  cn(userCardClassName, ...classNames);

export const getUserSurfaceClassName = (...classNames) =>
  cn(userSurfaceClassName, ...classNames);

export const getUserInteractiveCardClassName = (...classNames) =>
  cn(userInteractiveCardClassName, ...classNames);

export const getUserAccentCardClassName = (...classNames) =>
  cn(userAccentCardClassName, ...classNames);
