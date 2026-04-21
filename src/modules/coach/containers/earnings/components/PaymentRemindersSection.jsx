import React from "react";
import { filter, get, join, map, orderBy, size, slice, split, toUpper } from "lodash";
import {
  AlertCircleIcon,
  BellIcon,
  CheckCircle2Icon,
  ClockIcon,
  MessageCircleIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatMoney = (value, locale = "uz-UZ") => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "—";
  return `${new Intl.NumberFormat(locale).format(Math.round(num))} so'm`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const getInitials = (name = "") =>
  toUpper(slice(join(map(split(String(name), " "), (part) => get(part, "[0]", "")), ""), 0, 2));

const STATUS_META = {
  overdue: {
    label: "Muddati o'tgan",
    color: "border-red-500/20 bg-red-500/10 text-red-600",
    icon: AlertCircleIcon,
    iconColor: "text-red-500",
    priority: 0,
  },
  due: {
    label: "To'lov muddati",
    color: "border-amber-500/20 bg-amber-500/10 text-amber-600",
    icon: ClockIcon,
    iconColor: "text-amber-500",
    priority: 1,
  },
  paid: {
    label: "To'langan",
    color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2Icon,
    iconColor: "text-emerald-500",
    priority: 2,
  },
};

const ReminderSkeleton = () => (
  <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="inline-flex items-center gap-2 text-base">
        <BellIcon className="size-4 text-primary" />
        To&apos;lov eslatmalari
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex items-center gap-4 rounded-2xl border border-border/60 px-4 py-3"
        >
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const PaymentRemindersSection = ({ clients = [], isLoading }) => {
  const navigate = useNavigate();

  const needsAttention = React.useMemo(() => {
    const attention = filter(clients, (client) => {
      const status = get(client, "paymentSummary.status");
      return status === "overdue" || status === "due";
    });

    return orderBy(
      attention,
      [
        (client) =>
          get(STATUS_META, [get(client, "paymentSummary.status"), "priority"], 99),
        (client) => get(client, "paymentSummary.dueDate", ""),
      ],
    );
  }, [clients]);

  if (isLoading) return <ReminderSkeleton />;

  if (size(needsAttention) === 0) {
    return (
      <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <BellIcon className="size-4 text-primary" />
            To&apos;lov eslatmalari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">
              Barcha to&apos;lovlar muddatida. Eslatma kerak emas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <BellIcon className="size-4 text-primary" />
            To&apos;lov eslatmalari
            <Badge
              variant="outline"
              className="ml-1 border-amber-500/20 bg-amber-500/10 text-xs text-amber-700"
            >
              {size(needsAttention)} ta
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Quyidagi mijozlarga to&apos;lov uchun eslatma yuboring
        </p>
        {map(needsAttention, (client) => {
          const status = get(client, "paymentSummary.status", "due");
          const meta = get(STATUS_META, status, STATUS_META.due);
          const StatusIcon = meta.icon;
          const agreedAmount = get(client, "paymentSummary.agreedAmount");
          const dueDate = get(client, "paymentSummary.dueDate");
          const roomId = get(client, "roomId") || get(client, "chatRoomId");

          return (
            <div
              key={get(client, "id")}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/10 px-4 py-3 transition-colors hover:bg-muted/20"
            >
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                  {getInitials(get(client, "name"))}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">
                    {get(client, "name")}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-[10px]", meta.color)}
                  >
                    <StatusIcon className={cn("mr-1 size-2.5", meta.iconColor)} />
                    {meta.label}
                  </Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  {agreedAmount ? (
                    <span className="font-semibold text-foreground">
                      {formatMoney(agreedAmount)}
                    </span>
                  ) : null}
                  {dueDate ? <span>Muddat: {formatDate(dueDate)}</span> : null}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 rounded-xl text-xs"
                onClick={() =>
                  navigate(roomId ? `/coach/chat/${roomId}` : "/coach/clients")
                }
              >
                <MessageCircleIcon className="mr-1.5 size-3.5" />
                Eslatma yubor
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PaymentRemindersSection;
