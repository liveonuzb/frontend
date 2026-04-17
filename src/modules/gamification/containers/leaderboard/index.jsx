import { find, map, filter, take, clamp, split, join } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { useGetQuery } from "@/hooks/api";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import PageLoader from "@/components/page-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CrownIcon,
  MedalIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const podiumOrder = [1, 0, 2];

const getInitials = (value = "") =>
  (join(
    take(
      map(split(String(value).trim(), /\s+/), (part) => part[0]),
      2,
    ),
    "",
  ).toUpperCase()) || "U";

const formatXp = (value) =>
  new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getPodiumTone = (rank) => {
  if (rank === 1) {
    return {
      border: "border-amber-500/40",
      ring: "ring-amber-500/30",
      badge: "bg-amber-500 text-amber-950",
      icon: "text-amber-500",
      progress: "bg-amber-500/30",
    };
  }
  if (rank === 2) {
    return {
      border: "border-slate-400/40",
      ring: "ring-slate-400/30",
      badge: "bg-slate-400 text-slate-900",
      icon: "text-slate-400",
      progress: "bg-slate-400/30",
    };
  }
  return {
    border: "border-orange-600/40",
    ring: "ring-orange-600/30",
    badge: "bg-orange-600 text-white",
    icon: "text-orange-600",
    progress: "bg-orange-600/30",
  };
};

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Haftalik" },
  { value: "monthly", label: "Oylik" },
  { value: "all", label: "Barcha vaqt" },
];

const SCOPE_OPTIONS = [
  { value: "global", label: "Global" },
  { value: "friends", label: "Do'stlar" },
];

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { user } = useAuthStore();
  const [period, setPeriod] = React.useState("weekly");
  const [scope, setScope] = React.useState("global");

  const { data: leaderboardData, isLoading } = useGetQuery({
    url: "/gamification/leaderboard",
    params: { period, scope },
    queryProps: {
      queryKey: ["gamification", "leaderboard", period, scope],
    },
  });

  const { data: xpHistoryData } = useGetQuery({
    url: "/gamification/xp/history",
    params: { limit: 10 },
    queryProps: { queryKey: ["gamification", "xp-history"] },
  });

  const xpHistory = xpHistoryData?.data?.items ?? [];

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/dashboard", title: "Reyting" },
    ]);
  }, [setBreadcrumbs]);

  if (isLoading) return <PageLoader />;

  const users = Array.isArray(leaderboardData?.data) ? leaderboardData.data : [];
  const meEntry = find(users, (item) => item.id === user?.id) ?? null;
  const champion = users[0] ?? null;
  const podium = map(
    filter(
      map(podiumOrder, (index) => users[index]),
      Boolean,
    ),
    (item) => ({ ...item, position: item.rank }),
  );
  const list = take(users, 10);

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-24">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-500/20 via-primary/5 to-background">
          <CardContent className="grid gap-4 px-5 py-6 md:grid-cols-[1fr_auto] md:items-end md:px-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold">
                <SparklesIcon className="size-3.5 text-primary" />
                {PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Leaderboard"}
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Eng kuchli 10 talik
              </h1>
              <p className="text-sm text-muted-foreground">
                XP reyting bo&apos;yicha{" "}
                {scope === "friends" ? "do'stlar orasida" : "global"} liderlar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Card className="rounded-2xl border bg-background/70 py-4 shadow-none">
                <CardContent className="space-y-1 px-4">
                  <p className="text-xs text-muted-foreground">Ishtirokchi</p>
                  <p className="text-xl font-black">{users.length}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border bg-background/70 py-4 shadow-none">
                <CardContent className="space-y-1 px-4">
                  <p className="text-xs text-muted-foreground">1-o&apos;rin XP</p>
                  <p className="text-xl font-black">{formatXp(champion?.xp)}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border bg-background/70 py-4 shadow-none">
                <CardContent className="space-y-1 px-4">
                  <p className="text-xs text-muted-foreground">Sizning o&apos;rningiz</p>
                  <p className="text-xl font-black">
                    {meEntry?.rank ? `#${meEntry.rank}` : "Top 10 emas"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1.5 rounded-xl border bg-card p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                  period === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 rounded-xl border bg-card p-1">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                  scope === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {podium.length > 0 ? (
          <Card className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top 3 podium</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {podium.map((item) => {
                const tone = getPodiumTone(item.position);
                const progressValue = clamp(Number(item.level || 1) * 8, 8, 100);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative rounded-2xl border bg-card p-4 ring-1",
                      tone.border,
                      tone.ring,
                    )}
                  >
                    {item.position === 1 ? (
                      <CrownIcon className="absolute right-3 top-3 size-5 text-amber-500" />
                    ) : null}
                    <div className="flex items-center justify-between">
                      <Badge className={cn("border-0", tone.badge)}>
                        #{item.rank}
                      </Badge>
                      <MedalIcon className={cn("size-4", tone.icon)} />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar className="size-12 border">
                        <AvatarImage src={item.avatar} alt={item.name} />
                        <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Lvl {item.level}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">XP</span>
                        <span className="font-semibold">{formatXp(item.xp)}</span>
                      </div>
                      <Progress value={progressValue} className={cn("h-1.5", tone.progress)} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">To&apos;liq ro&apos;yxat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((item) => {
              const isMe = item.id === user?.id;
              const isTopThree = item.rank <= 3;
              const aheadXp =
                item.rank > 1 ? Number(list[item.rank - 2]?.xp ?? item.xp) - Number(item.xp) : 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors",
                    isMe
                      ? "border-primary/30 bg-primary/10"
                      : "border-border/60 hover:bg-muted/40",
                  )}
                >
                  <div className="w-9 text-center text-sm font-bold text-muted-foreground">
                    {isTopThree ? (
                      <TrophyIcon className="mx-auto size-4 text-amber-500" />
                    ) : (
                      `#${item.rank}`
                    )}
                  </div>
                  <Avatar className="size-10 border">
                    <AvatarImage src={item.avatar} alt={item.name} />
                    <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.name}
                      {isMe ? " (Siz)" : ""}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Lvl {item.level}</span>
                      <span>•</span>
                      <span>{formatXp(item.xp)} XP</span>
                      {!isMe && aheadXp > 0 ? (
                        <>
                          <span>•</span>
                          <span>{formatXp(aheadXp)} XP qoldi</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {isMe ? (
                    <Badge className="border-0 bg-primary text-primary-foreground">
                      Siz
                    </Badge>
                  ) : (
                    <StarIcon className="size-4 text-amber-500" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {xpHistory.length > 0 ? (
          <Card className="rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ZapIcon className="size-4 text-primary" />
                XP tarixi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {xpHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.note || item.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-bold",
                      item.amount > 0 ? "text-emerald-600" : "text-destructive",
                    )}
                  >
                    {item.amount > 0 ? "+" : ""}{item.amount} XP
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {!meEntry ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-base font-semibold">
                Siz hali Top 10 ga kirmagansiz
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Daily vazifalarni muntazam bajarib, XP to&apos;plang va reytingda
                ko&apos;tariling.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/user/challenges")}
                >
                  Challenge&apos;larga o&apos;tish
                </Button>
                <Button onClick={() => navigate("/user/dashboard")}>
                  XP yig&apos;ishni boshlash
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageTransition>
  );
};

export default LeaderboardPage;
