import React from "react";
import { useNavigate } from "react-router";
import {
  ActivityIcon,
  ClockIcon,
  FlameIcon,
  HistoryIcon,
  PlayIcon,
  RouteIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useRunningActiveSession,
  useRunningStatsSummary,
  useStartRunningSession,
} from "@/hooks/app/use-running-sessions";
import { loadActiveRunningSession } from "@/lib/running-offline-queue";
import {
  formatRunningDistance,
  formatRunningDuration,
} from "@/lib/running-metrics";
import { useBreadcrumbStore } from "@/store";

const statCards = (stats) => [
  {
    label: "Total distance",
    value: formatRunningDistance(stats.totalDistanceMeters),
    icon: RouteIcon,
  },
  {
    label: "Total time",
    value: formatRunningDuration(stats.totalDurationSeconds),
    icon: ClockIcon,
  },
  {
    label: "Runs",
    value: String(Number(stats.totalRuns ?? 0) || 0),
    icon: ActivityIcon,
  },
  {
    label: "Calories",
    value: String(Number(stats.totalCaloriesBurned ?? 0) || 0),
    icon: FlameIcon,
  },
];

const RunningPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { activeSession } = useRunningActiveSession();
  const { stats = {} } = useRunningStatsSummary();
  const { startRunningSession, isPending } = useStartRunningSession();
  const localActiveSession = React.useMemo(() => loadActiveRunningSession(), []);
  const recoverySession = activeSession ?? localActiveSession;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/running", title: "Running" },
    ]);
  }, [setBreadcrumbs]);

  const handleStart = async () => {
    const session = await startRunningSession({
      clientSessionId: `web-${Date.now()}`,
      startedAt: new Date().toISOString(),
    });
    const workoutSessionId = session?.workoutSessionId;
    navigate(
      workoutSessionId
        ? `/user/workout/running/live/${workoutSessionId}`
        : "/user/workout/running/live",
    );
  };

  return (
    <PageTransition mode="slide-up">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border bg-background">
          <div className="grid gap-5 p-5 md:grid-cols-[1.25fr_0.75fr] md:p-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <RouteIcon className="size-4" />
                Running
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-normal">
                  Running
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Track outdoor runs, recover active sessions, and review pace,
                  distance, calories, and route quality inside Workout.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleStart} disabled={isPending}>
                  <PlayIcon className="size-4" />
                  Start run
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/user/workout/running/history")}
                >
                  <HistoryIcon className="size-4" />
                  History
                </Button>
              </div>
            </div>

            {recoverySession ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle>Active run found</CardTitle>
                  <CardDescription>
                    Resume the current run and continue syncing GPS points.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() =>
                      navigate(
                        `/user/workout/running/live/${recoverySession.workoutSessionId}`,
                      )
                    }
                  >
                    Resume
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Ready for a run</CardTitle>
                  <CardDescription>
                    Web tracking works best while the browser stays open.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  For locked-screen background tracking, use the future mobile
                  tracker.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards(stats).map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                  </div>
                  <Icon className="size-5 text-primary" />
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </PageTransition>
  );
};

export default RunningPage;
