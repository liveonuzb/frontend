import React from "react";
import { get, groupBy } from "lodash";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";
import {
  formatChallengeDateRange,
  getMetricMeta,
  getMyProgress,
} from "../challenge-utils.js";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border bg-card/80 p-4">
    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-5" />
    </div>
    <p className="text-2xl font-black tabular-nums">{value}</p>
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
  </div>
);

export default function ChallengeReportContainer() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { user } = useAuthStore();
  const { challenges, isLoading, fetchChallenges } = useChallengeStore();

  React.useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges/report", title: "Challenge statistikasi" },
    ]);
  }, [setBreadcrumbs]);

  const challengeList = React.useMemo(
    () => (Array.isArray(challenges) ? challenges : []),
    [challenges],
  );
  const joinedChallenges = React.useMemo(
    () =>
      challengeList.filter((challenge) => {
        const participant = (challenge.participants || []).some(
          (item) => item.userId === user?.id,
        );
        return Boolean(challenge.isJoined || participant);
      }),
    [challengeList, user?.id],
  );
  const completed = joinedChallenges.filter(
    (challenge) => challenge.status === "COMPLETED",
  );
  const wonCount = completed.filter(
    (challenge) =>
      get(challenge, "myRank") === 1 || get(challenge, "myProgress.rank") === 1,
  ).length;
  const xpTotal = completed.reduce(
    (total, challenge) =>
      total +
      Number(
        get(challenge, "myProgress.rewardXp") ||
          get(challenge, "rewardDetails.previewRewardXp") ||
          get(challenge, "rewardXp") ||
          0,
      ),
    0,
  );
  const bestRank = completed.reduce((best, challenge) => {
    const rank = Number(
      get(challenge, "myRank") || get(challenge, "myProgress.rank") || 0,
    );
    if (!rank) return best;
    if (!best || rank < best.rank) return { rank, challenge };
    return best;
  }, null);
  const averageProgress = joinedChallenges.length
    ? Math.round(
        joinedChallenges.reduce(
          (total, challenge) => total + getMyProgress(challenge),
          0,
        ) / joinedChallenges.length,
      )
    : 0;
  const groupedByMetric = groupBy(joinedChallenges, (challenge) => {
    return get(challenge, "metricDetails.type") || challenge.metricType || "STEPS";
  });
  const topMetricEntry = Object.entries(groupedByMetric).sort(
    (a, b) => b[1].length - a[1].length,
  )[0];

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
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Jami qatnashgan"
              value={joinedChallenges.length}
              icon={TrophyIcon}
            />
            <StatCard label="G'olib bo'lgan" value={wonCount} icon={MedalIcon} />
            <StatCard
              label="Yakunlangan"
              value={completed.length}
              icon={BarChart3Icon}
            />
            <StatCard
              label="Yig'ilgan XP"
              value={xpTotal.toLocaleString("uz-UZ")}
              icon={ZapIcon}
            />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[1.75rem] border bg-card/80 p-5">
            <h2 className="text-lg font-black">Eng yaxshi natijalar</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-4">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  Eng yuqori o'rin
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bestRank
                    ? `${bestRank.rank}-o'rin (${bestRank.challenge.title})`
                    : "Hali reyting natijasi yo'q"}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-300">
                  <FlameIcon className="size-4" />
                  Eng uzun seriya
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {completed.length
                    ? `${completed.length} ta yakunlangan chellenj`
                    : "Seriya hali boshlanmagan"}
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-4">
                <p className="text-sm font-bold text-primary">
                  O'rtacha progress
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {averageProgress}% umumiy bajarilish
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border bg-card/80 p-5">
            <h2 className="text-lg font-black">Metric breakdown</h2>
            <div className="mt-5 space-y-3">
              {Object.entries(groupedByMetric).length ? (
                Object.entries(groupedByMetric).map(([metric, items]) => {
                  const percent = Math.round(
                    (items.length / joinedChallenges.length) * 100,
                  );
                  const meta = getMetricMeta(metric);
                  return (
                    <div key={metric} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">
                          {meta.emoji} {meta.label}
                        </span>
                        <span className="text-muted-foreground">{percent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Breakdown uchun hali ma'lumot yo'q.
                </p>
              )}
            </div>
            {topMetricEntry ? (
              <p className="mt-5 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                Siz ko'proq {getMetricMeta(topMetricEntry[0]).label.toLowerCase()}{" "}
                chellenjlarida qatnashasiz.
              </p>
            ) : null}
          </section>
        </div>

        <section className="rounded-[1.75rem] border bg-card/80 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Chellenj tarixi</h2>
            <Badge variant="outline">{completed.length} ta</Badge>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : completed.length ? (
            <div className="divide-y divide-border/60">
              {completed.map((challenge) => (
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
                      {get(challenge, "myRank")
                        ? `${get(challenge, "myRank")}-o'rin`
                        : `${Math.round(getMyProgress(challenge))}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(
                        get(challenge, "myProgress.rewardXp") ||
                          get(challenge, "rewardXp") ||
                          0,
                      ).toLocaleString("uz-UZ")}{" "}
                      XP
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
              Hali tugallangan chellenjlar yo'q.
            </p>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
