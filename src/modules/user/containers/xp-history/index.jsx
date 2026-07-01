import React from "react";
import {
  get,
  map,
  replace,
  size,
  toNumber,
  trim,
  unionBy,
} from "lodash";
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
import {
  getUserSurfaceClassName,
  userAccentCardClassName,
} from "@/modules/user/lib/card-styles";

const XP_HISTORY_LIMIT = 20;
const EMPTY_XP_HISTORY_ITEMS = [];

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
  return XP_TYPE_LABELS[normalized] ?? replace(normalized, /_/g, " ");
};

const XpHistoryRow = ({ item }) => {
  const amount = toNumber(item?.amount) || 0;
  const isPositive = amount >= 0;
  const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div
      className={getUserSurfaceClassName(
        "flex items-center gap-3 border border-border/50 bg-card px-4 py-3",
      )}
    >
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

const usePagedXpHistory = () => {
  const [offset, setOffset] = React.useState(0);
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const loadedOffsetsRef = React.useRef(new Set());
  const { data, isLoading, isFetching } = useGetQuery({
    url: "/user/gamification/xp/history",
    params: { limit: XP_HISTORY_LIMIT, offset },
    queryProps: {
      queryKey: [
        ...GAMIFICATION_XP_HISTORY_QUERY_KEY,
        offset,
        XP_HISTORY_LIMIT,
      ],
      keepPreviousData: true,
    },
  });

  const payload = getApiResponseData(data, {});
  const pageItems = get(
    payload,
    "items",
    get(payload, "data.items", EMPTY_XP_HISTORY_ITEMS),
  );
  const pageTotal =
    toNumber(get(payload, "total", get(payload, "data.total"))) || 0;

  React.useEffect(() => {
    if (!data || loadedOffsetsRef.current.has(offset)) {
      return;
    }

    loadedOffsetsRef.current.add(offset);
    setTotal(pageTotal);
    setItems((currentItems) =>
      offset === 0 ? pageItems : unionBy([...currentItems, ...pageItems], "id"),
    );
  }, [data, offset, pageItems, pageTotal]);

  const hasNextPage = size(items) < total || offset + XP_HISTORY_LIMIT < total;
  const loadNextPage = React.useCallback(() => {
    if (!hasNextPage || isFetching || isLoading) {
      return;
    }

    setOffset((currentOffset) => currentOffset + XP_HISTORY_LIMIT);
  }, [hasNextPage, isFetching, isLoading]);

  return {
    items,
    total,
    isFetching,
    isInitialLoading: isLoading && offset === 0 && size(items) === 0,
    hasNextPage,
    loadNextPage,
  };
};

export const XpHistoryContent = ({
  embedded = false,
  className,
}) => {
  const {
    items,
    total,
    isFetching,
    isInitialLoading,
    hasNextPage,
    loadNextPage,
  } = usePagedXpHistory();

  const handleScroll = React.useCallback(
    (event) => {
      const target = event.currentTarget;
      const distanceToBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (distanceToBottom <= 96) {
        loadNextPage();
      }
    },
    [loadNextPage],
  );

  if (isInitialLoading) {
    return <PageLoader />;
  }

  return (
    <div
      onScroll={handleScroll}
      className={cn(
        "flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain",
        embedded ? "max-h-[min(68vh,34rem)] pr-1" : "pb-24",
        className,
      )}
    >
      <Card className={cn(userAccentCardClassName, "overflow-hidden bg-primary/5")}>
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

      {size(items) > 0 ? (
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

      {isFetching && size(items) > 0 ? (
        <p className="py-3 text-center text-xs font-semibold text-muted-foreground">
          Yana loglar yuklanmoqda...
        </p>
      ) : null}

      {!hasNextPage && size(items) > 0 ? (
        <p className="py-3 text-center text-xs font-semibold text-muted-foreground">
          Barcha XP loglari ko'rsatildi.
        </p>
      ) : null}
    </div>
  );
};

const XpHistoryPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Dashboard" },
      { url: "/user/xp-history", title: "XP tarixi" },
    ]);
  }, [setBreadcrumbs]);

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

        <XpHistoryContent />
      </div>
    </PageTransition>
  );
};

export default XpHistoryPage;
