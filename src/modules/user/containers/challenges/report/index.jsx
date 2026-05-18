import React from "react";
import { useNavigate } from "react-router";
import {
  BarChart3Icon,
  FlameIcon,
  MedalIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";
import { formatChallengeDateRange, getMetricMeta } from "../challenge-utils.js";

import { isArray, map, toLower, toNumber } from "lodash";

const StatCard = ({ label, value, icon: Icon }) => (
  <Card size="sm">
    <CardHeader>
      <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      <CardDescription>{label}</CardDescription>
      <CardAction>
        <Icon />
      </CardAction>
    </CardHeader>
  </Card>
);

export default function ChallengeReportContainer() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const statsQuery = useGetQuery({
    url: "/challenges/stats",
    queryProps: { queryKey: ["challenge-stats"] },
  });
  const historyQuery = useGetQuery({
    url: "/challenges/history",
    queryProps: { queryKey: ["challenge-history"] },
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges/report", title: "Challenge statistikasi" },
    ]);
  }, [setBreadcrumbs]);

  const stats = statsQuery.data?.data || {};
  const history = isArray(historyQuery.data?.data)
    ? historyQuery.data.data
    : [];
  const metricBreakdown = isArray(stats.metricBreakdown)
    ? stats.metricBreakdown
    : [];
  const isLoading = statsQuery.isLoading || historyQuery.isLoading;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 pb-24">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Statistika</h1>
          <p className="text-sm text-muted-foreground">
            Chellenj tarixingiz va asosiy ko'rsatkichlar.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {map(Array.from({ length: 4 }), (_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Jami qatnashgan"
              value={toNumber(stats.totalJoined || 0)}
              icon={TrophyIcon}
            />
            <StatCard
              label="G'olib bo'lgan"
              value={toNumber(stats.wonCount || 0)}
              icon={MedalIcon}
            />
            <StatCard
              label="Yakunlangan"
              value={toNumber(stats.completedCount || 0)}
              icon={BarChart3Icon}
            />
            <StatCard
              label="Yig'ilgan XP"
              value={toNumber(stats.xpEarned || 0).toLocaleString("uz-UZ")}
              icon={ZapIcon}
            />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Eng yaxshi natijalar</CardTitle>
              <CardDescription>
                Reyting, seriya va umumiy progress bo'yicha xulosa.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-xl border p-3">
                <p className="text-sm font-medium">Eng yuqori o'rin</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.bestRank
                    ? `${stats.bestRank.rank}-o'rin (${stats.bestRank.title})`
                    : "Hali reyting natijasi yo'q"}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                    <FlameIcon />
                    Eng uzun seriya
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {toNumber(stats.longestCompletedStreak || 0)
                    ? `${stats.longestCompletedStreak} ta yakunlangan chellenj`
                    : "Seriya hali boshlanmagan"}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-sm font-medium">O'rtacha progress</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {toNumber(stats.averageProgress || 0)}% umumiy bajarilish
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metric breakdown</CardTitle>
              <CardDescription>
                Chellenjlaringiz o'lchov turi bo'yicha taqsimoti.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {metricBreakdown.length ? (
                map(metricBreakdown, (item) => {
                  const meta = getMetricMeta(item.metricType);
                  return (
                    <div key={item.metricType} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {meta.emoji} {meta.label}
                        </span>
                        <span className="text-muted-foreground">
                          {item.percent}%
                        </span>
                      </div>
                      <Progress value={toNumber(item.percent) || 0} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Breakdown uchun hali ma'lumot yo'q.
                </p>
              )}
            </CardContent>
            {stats.topMetric ? (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                Siz ko'proq{" "}
                {toLower(getMetricMeta(stats.topMetric.metricType).label)}{" "}
                chellenjlarida qatnashasiz.
                </p>
              </CardContent>
            ) : null}
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chellenj tarixi</CardTitle>
            <CardDescription>Tugallangan chellenjlar va natijalar.</CardDescription>
            <CardAction>
              <Badge variant="outline">{history.length} ta</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {map(Array.from({ length: 3 }), (_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </div>
          ) : history.length ? (
            <div className="divide-y divide-border/60">
              {map(history, (challenge) => (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => navigate(`/user/challenges/${challenge.id}`)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{challenge.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatChallengeDateRange(
                        challenge.startDate,
                        challenge.endDate,
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black">
                      {challenge.rank
                        ? `${challenge.rank}-o'rin`
                        : `${Math.round(toNumber(challenge.progress || 0))}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {toNumber(challenge.rewardXp || 0).toLocaleString("uz-UZ")}{" "}
                      XP
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Hali tugallangan chellenjlar yo'q.
            </p>
          )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
