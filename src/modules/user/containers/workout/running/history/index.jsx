import React from "react";
import { useNavigate } from "react-router";
import { RouteIcon } from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRunningSessions } from "@/hooks/app/use-running-sessions";
import {
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";

const RunningHistoryPage = () => {
  const navigate = useNavigate();
  const { sessions, isLoading, isError, refetch } = useRunningSessions();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Running history failed to load</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Running history</h1>
            <p className="text-sm text-muted-foreground">
              Completed outdoor runs from Workout.
            </p>
          </div>
          <Button onClick={() => navigate("/user/workout/running")}>
            Running
          </Button>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No runs yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card
                key={session.workoutSessionId}
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/user/workout/running/${session.workoutSessionId}`)
                }
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <RouteIcon className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Outdoor run</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.startedAt).toLocaleDateString(
                          "uz-UZ",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">
                      {formatRunningDistance(session.metrics.distanceMeters)}
                    </p>
                    <p className="text-muted-foreground">
                      {formatRunningDuration(session.metrics.durationSeconds)} -{" "}
                      {formatRunningPace(
                        session.metrics.averagePaceSecondsPerKm,
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default RunningHistoryPage;
