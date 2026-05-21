import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRightIcon, RouteIcon } from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRunningSessions } from "@/hooks/app/use-running-sessions";
import {
  formatRunningClockDuration,
  formatRunningDistance,
  formatRunningPace,
} from "@/lib/running-metrics";
import RunMapPanel from "../components/run-map-panel.jsx";

import { map, toNumber } from "lodash";

const runDateFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const formatGpsQuality = (score, t) => {
  const numericScore = toNumber(score);
  if (!Number.isFinite(numericScore) || numericScore <= 0) {
    return t(
      "user.workout.running.history.noGpsQuality",
      "GPS sifati yo'q",
    );
  }

  return `GPS ${Math.round(numericScore * 100)}%`;
};

const formatRunningCalories = (calories = 0) =>
  `${Math.round(Math.max(0, toNumber(calories) || 0))} kcal`;

const RunningHistoryPage = () => {
  const { t } = useTranslation();
  const { sessions, isLoading, isError, refetch } = useRunningSessions();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
        <Card className="py-6">
          <CardHeader>
            <CardTitle>
              {t(
                "user.workout.running.history.errorTitle",
                "Yugurish tarixi yuklanmadi",
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>
              {t("user.workout.running.history.retry", "Qayta urinish")}
            </Button>
          </CardContent>
        </Card>
      );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">
              {t("user.workout.running.history.title", "Yugurish tarixi")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "user.workout.running.history.description",
                "Yakunlangan ochiq yugurishlar va route metrikalari.",
              )}
            </p>
          </div>
          <Button asChild>
            <Link to="/user/workout/running">
              {t("user.workout.running.history.start", "Yugurish")}
            </Link>
          </Button>
        </div>

        {sessions.length === 0 ? (
          <Card className="py-6">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-base font-semibold">
                  {t(
                    "user.workout.running.history.emptyTitle",
                    "Hali yugurishlar yo'q",
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(
                    "user.workout.running.history.emptyDescription",
                    "Birinchi GPS yugurishni boshlang va route, pace hamda masofani shu yerda ko'ring.",
                  )}
                </p>
              </div>
              <Button asChild>
                <Link to="/user/workout/running">
                  {t(
                    "user.workout.running.history.emptyAction",
                    "Birinchi yugurishni boshlash",
                  )}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {map(sessions, (session) => (
              <Link
                key={session.workoutSessionId}
                to={`/user/workout/running/${session.workoutSessionId}`}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={t(
                  "user.workout.running.history.runAriaLabel",
                  "Ochiq yugurish {{date}}",
                  {
                    date: runDateFormatter.format(new Date(session.startedAt)),
                  },
                )}
              >
                <Card className="py-6 transition-colors hover:bg-muted/30">
                  <CardContent className="grid items-center gap-4 p-4 md:grid-cols-[minmax(0,1fr)_8rem_auto]">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <RouteIcon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {t(
                            "user.workout.running.shared.outdoorRunUz",
                            "Ochiq yugurish",
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {runDateFormatter.format(new Date(session.startedAt))}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatGpsQuality(
                            session.metrics.gpsQualityScore,
                            t,
                          )}
                        </p>
                      </div>
                    </div>
                    {session.route?.polyline || session.route?.segments?.length ? (
                      <div className="hidden h-20 overflow-hidden rounded-2xl md:block">
                        <RunMapPanel
                          title={null}
                          variant="preview"
                          provider="none"
                          polyline={session.route.polyline}
                          segments={session.route.segments}
                          showQuality={false}
                          emptyLabel={t(
                            "user.workout.running.history.noRoute",
                            "Route yozilmagan",
                          )}
                          loadingLabel=""
                          errorLabel=""
                          className="h-full"
                          surfaceClassName="h-20 min-h-20 rounded-2xl"
                        />
                      </div>
                    ) : (
                      <div className="hidden h-20 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-3 text-center text-xs text-muted-foreground md:flex">
                        <div>
                          <RouteIcon
                            className="mx-auto mb-1 size-4 text-primary"
                            aria-hidden="true"
                          />
                          {t(
                            "user.workout.running.history.noRoute",
                            "Route yozilmagan",
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex shrink-0 items-center justify-between gap-3 text-sm md:justify-end md:text-right">
                      <div>
                        <p className="font-semibold tabular-nums">
                          {formatRunningDistance(session.metrics.distanceMeters)}
                        </p>
                        <p className="text-muted-foreground">
                          {formatRunningClockDuration(
                            session.metrics.durationSeconds,
                          )}{" "}
                          ·{" "}
                          {formatRunningPace(
                            session.metrics.averagePaceSecondsPerKm,
                          )}{" "}
                          · {formatRunningCalories(session.metrics.caloriesBurned)}
                        </p>
                      </div>
                      <ArrowRightIcon
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default RunningHistoryPage;
