import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftIcon, GaugeIcon, RouteIcon } from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRunningSessionDetail } from "@/hooks/app/use-running-sessions";
import {
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import RunMapPanel from "../components/run-map-panel.jsx";

const detailDateFormatter = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatGpsQualityPercent = (score) => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore <= 0) {
    return "--";
  }

  return `${Math.round(numericScore * 100)}%`;
};

const RunningDetailPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { workoutSessionId } = useParams();
  const { session, isLoading } = useRunningSessionDetail(workoutSessionId);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t("user.workout.running.detail.notFound", "Yugurish topilmadi")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/user/workout/running/history")}>
            {t(
              "user.workout.running.detail.backToHistory",
              "Tarixga qaytish",
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t(
              "user.workout.running.detail.backToHistory",
              "Tarixga qaytish",
            )}
            onClick={() => navigate("/user/workout/running/history")}
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">
                {t(
                  "user.workout.running.detail.title",
                  "Ochiq yugurish",
                )}
              </h1>
              <Badge variant="secondary" className="gap-1">
                <RouteIcon className="size-3" aria-hidden="true" />
                {t("user.workout.running.detail.gps", "GPS")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {detailDateFormatter.format(new Date(session.startedAt))}
            </p>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t("user.workout.running.detail.distance", "Masofa")}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatRunningDistance(session.metrics.distanceMeters)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t("user.workout.running.detail.time", "Vaqt")}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatRunningDuration(session.metrics.durationSeconds)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pace</p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatRunningPace(session.metrics.averagePaceSecondsPerKm)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t("user.workout.running.detail.calories", "Kaloriya")}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {session.metrics.caloriesBurned}
              </p>
            </CardContent>
          </Card>
        </section>

        <RunMapPanel
          points={session.points}
          polyline={session.route?.polyline}
          emptyLabel={t(
            "user.workout.running.detail.noRoute",
            "Route yozilmagan",
          )}
        />

        <section className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GaugeIcon className="size-4 text-primary" aria-hidden="true" />
                {t("user.workout.running.detail.gpsQuality", "GPS sifati")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {formatGpsQualityPercent(session.metrics.gpsQualityScore)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  "user.workout.running.detail.gpsQualityDescription",
                  "Route hisobida past aniqlikdagi nuqtalar filtrlanadi.",
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("user.workout.running.detail.splits", "Splitlar")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {session.splits?.length ? (
                session.splits.map((split) => (
                  <div
                    key={split.index}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2"
                  >
                    <span className="font-medium">
                      {t(
                        "user.workout.running.detail.splitLabel",
                        "{{index}}-km",
                        { index: split.index },
                      )}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatRunningPace(split.paceSecondsPerKm)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t(
                    "user.workout.running.detail.noSplits",
                    "Splitlar uchun yetarli masofa yozilmagan.",
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </PageTransition>
  );
};

export default RunningDetailPage;
