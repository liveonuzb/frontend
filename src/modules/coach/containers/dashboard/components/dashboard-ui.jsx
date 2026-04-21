import React from "react";
import { ClockIcon, SaladIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatMoney = (value) => {
  if (!value || Number(value) === 0) return "0 so'm";
  return `${new Intl.NumberFormat("uz-UZ").format(Math.round(Number(value)))} so'm`;
};

export const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return "Xayrli tun";
  if (hour < 12) return "Xayrli tong";
  if (hour < 18) return "Xayrli kun";
  return "Xayrli kech";
};

export const revenueChange = (current, previous) => {
  if (!previous || previous === 0) return null;

  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);

  return { diff, pct, up: diff >= 0 };
};

export const clientBadge = (status) => {
  if (status === "active") {
    return { label: "Faol", cls: "bg-emerald-500/10 text-emerald-600" };
  }
  if (status === "paused") {
    return { label: "Pauza", cls: "bg-amber-500/10 text-amber-600" };
  }
  return { label: "Faolsiz", cls: "bg-muted text-muted-foreground" };
};

export const ListRow = ({ onClick, children, className }) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center justify-between px-4 py-4 transition-all duration-200",
      onClick && "group cursor-pointer hover:bg-muted/50 hover:px-5",
      className,
    )}
  >
    {children}
  </div>
);

export const SectionCard = ({
  title,
  description,
  action,
  badge,
  children,
  className,
}) => (
  <Card
    className={cn(
      "overflow-hidden border-none bg-card/50 shadow-xl backdrop-blur-sm",
      className,
    )}
  >
    <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 py-5">
      <div className="min-w-0">
        <CardTitle className="text-base font-black tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="mt-1 text-xs font-medium text-muted-foreground/70">
            {description}
          </CardDescription>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge != null ? (
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 font-bold tabular-nums text-primary"
          >
            {badge}
          </Badge>
        ) : null}
        {action}
      </div>
    </CardHeader>
    <CardContent className="px-6 pb-6 pt-0">{children}</CardContent>
  </Card>
);

export const EmptyState = ({ text, icon: Icon = SaladIcon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground/40">
      <Icon className="size-6" />
    </div>
    <p className="text-sm font-medium text-muted-foreground/60">{text}</p>
  </div>
);

export const ListSkeleton = () => (
  <div className="flex flex-col divide-y">
    {[1, 2, 3].map((item) => (
      <div key={item} className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    ))}
  </div>
);

export const ClockHint = ({ children }) => (
  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60">
    <ClockIcon className="size-3" />
    {children}
  </p>
);
