import React from "react";
import { map, toNumber, trim } from "lodash";
import { useNavigate } from "react-router";
import {
  ArrowLeftIcon,
  HistoryIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";

import PageTransition from "@/components/page-transition";
import PageLoader from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetQuery } from "@/hooks/api";
import { GAMIFICATION_XP_HISTORY_QUERY_KEY } from "@/modules/user/lib/gamification-query-keys";
import { getApiResponseData } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";

const XP_HISTORY_LIMIT = 20;

const XP_TYPE_LABELS = {
  ACHIEVEMENT: "Yutuq",
  MEAL_LOG: "Ovqat",
  WATER_LOG: "Suv",
  WORKOUT_SESSION: "Mashg'ulot",
  FRIEND_ACCEPTED: "Do'st",
  CHALLENGE_JOINED: "Challenge",
  REFERRAL_REGISTRATION: "Referral",
  REFERRAL_SUBSCRIPTION: "Referral premium",
  CHALLENGE_REWARD: "Challenge mukofoti",
  ADMIN_GRANT: "Admin",
  STREAK_BONUS: "Streak bonus",
  XP_SPEND: "XP sarflandi",
  WITHDRAWAL: "Yechib olish",
  OTHER: "Boshqa",
};

const formatXp = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(toNumber(value) || 0);

const formatDateTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getTypeLabel = (type) => {
  const normalized = trim(String(type ?? ""));
  return XP_TYPE_LABELS[normalized] ?? normalized.replaceAll("_", " ");
};

const XpHistoryRow = ({ item }) => {
  const amount = toNumber(item?.amount) || 0;
  const isPositive = amount >= 0;
  const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card px-4 py-3">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          isPositive
            ? "bg-primary/10 text-primary"
            : "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-black">
            {item?.note || getTypeLabel(item?.type)}
          </p>
          <Badge variant="outline" className="shrink-0 rounded-full text-[10px]">
            {getTypeLabel(item?.type)}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-muted-foreground">
          <span>{formatDateTime(item?.createdAt)}</span>
          <span>Balans: {formatXp(item?.balance)} XP</span>
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 text-sm font-black",
          isPositive ? "text-primary" : "text-destructive",
        )}
      >
        {amount > 0 ? "+" : ""}
        {formatXp(amount)} XP
      </span>
    </div>
  );
};

const XpHistoryPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [page, setPage] = React.useState(0);
  const offset = page * XP_HISTORY_LIMIT;

  const { data, isLoading, isFetching } = useGetQuery({
    url: "/user/gamification/xp/history",
    params: { limit: XP_HISTORY_LIMIT, offset },
    queryProps: {
      queryKey: [...GAMIFICATION_XP_HISTORY_QUERY_KEY, page, XP_HISTORY_LIMIT],
      keepPreviousData: true,
    },
  });

  const payload = getApiResponseData(data, {});
  const items = payload?.items ?? [];
  const total = toNumber(payload?.total) || 0;
  const hasNextPage = offset + XP_HISTORY_LIMIT < total;
  const hasPreviousPage = page > 0;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Dashboard" },
      { url: "/user/xp-history", title: "XP tarixi" },
    ]);
  }, [setBreadcrumbs]);

  if (isLoading && page === 0) {
    return <PageLoader />;
  }

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-24">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            aria-label="Orqaga"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight">
              XP tarixi
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Barcha XP ishlagan va sarflagan loglaringiz.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border-border/70 bg-gradient-to-br from-primary/15 via-card to-card shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <WalletCardsIcon className="size-6" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                  Barcha loglar
                </p>
                <p className="text-2xl font-black">{formatXp(total)} ta</p>
              </div>
            </div>
            <HistoryIcon className="size-7 text-primary/70" />
          </CardContent>
        </Card>

        {items.length > 0 ? (
          <div className="space-y-2">
            {map(items, (item) => (
              <XpHistoryRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed shadow-none">
            <CardContent className="px-5 py-10 text-center">
              <HistoryIcon className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-base font-black">Hali XP loglari yo'q</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ovqat, suv, mashg'ulot va yutuqlar orqali XP yig'ishni boshlang.
              </p>
            </CardContent>
          </Card>
        )}

        {hasPreviousPage || hasNextPage ? (
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full"
              disabled={!hasPreviousPage || isFetching}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Oldingi
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">
              {offset + 1}-{Math.min(offset + XP_HISTORY_LIMIT, total)} /{" "}
              {formatXp(total)}
            </span>
            <Button
              type="button"
              className="h-11 rounded-full"
              disabled={!hasNextPage || isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Ko'proq ko'rish
            </Button>
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
};

export default XpHistoryPage;
