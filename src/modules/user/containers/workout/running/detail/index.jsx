import React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeftIcon } from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRunningSessionDetail } from "@/hooks/app/use-running-sessions";
import {
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import RunMapPanel from "../components/run-map-panel.jsx";

const RunningDetailPage = () => {
  const navigate = useNavigate();
  const { workoutSessionId } = useParams();
  const { session, isLoading } = useRunningSessionDetail(workoutSessionId);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Run not found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/user/workout/running/history")}>
            Back to history
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
            onClick={() => navigate("/user/workout/running/history")}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Outdoor run</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(session.startedAt).toLocaleString("uz-UZ")}
            </p>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="text-2xl font-semibold">
                {formatRunningDistance(session.metrics.distanceMeters)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-semibold">
                {formatRunningDuration(session.metrics.durationSeconds)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pace</p>
              <p className="text-2xl font-semibold">
                {formatRunningPace(session.metrics.averagePaceSecondsPerKm)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Calories</p>
              <p className="text-2xl font-semibold">
                {session.metrics.caloriesBurned}
              </p>
            </CardContent>
          </Card>
        </section>

        <RunMapPanel
          points={session.points}
          polyline={session.route?.polyline}
          emptyLabel="No route recorded"
        />
      </div>
    </PageTransition>
  );
};

export default RunningDetailPage;
