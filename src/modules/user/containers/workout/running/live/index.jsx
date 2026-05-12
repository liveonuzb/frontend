import React from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  MapIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAppendRunningPoints,
  useCancelRunningSession,
  useFinishRunningSession,
  usePauseRunningSession,
  useResumeRunningSession,
  useRunningActiveSession,
} from "@/hooks/app/use-running-sessions";
import {
  clearActiveRunningSession,
  clearRunningPointQueue,
  enqueueRunningPoints,
  loadRunningPointQueue,
  saveActiveRunningSession,
} from "@/lib/running-offline-queue";
import {
  calculateLiveRunningDuration,
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";

const RunningLivePage = () => {
  const navigate = useNavigate();
  const { workoutSessionId: routeWorkoutSessionId } = useParams();
  const { activeSession } = useRunningActiveSession();
  const { appendPoints } = useAppendRunningPoints();
  const { pauseRunningSession, isPending: isPausing } =
    usePauseRunningSession();
  const { resumeRunningSession, isPending: isResuming } =
    useResumeRunningSession();
  const { finishRunningSession, isPending: isFinishing } =
    useFinishRunningSession();
  const { cancelRunningSession, isPending: isCancelling } =
    useCancelRunningSession();
  const [gpsStatus, setGpsStatus] = React.useState("Waiting for GPS");
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [queuedCount, setQueuedCount] = React.useState(0);
  const sequenceRef = React.useRef(0);
  const workoutSessionId =
    routeWorkoutSessionId ?? activeSession?.workoutSessionId ?? null;
  const isPaused = activeSession?.status === "paused";
  const metrics = activeSession?.metrics ?? {};

  React.useEffect(() => {
    if (activeSession?.workoutSessionId) {
      saveActiveRunningSession(activeSession);
    }
  }, [activeSession]);

  React.useEffect(() => {
    if (!activeSession?.startedAt) {
      return undefined;
    }

    setElapsedSeconds(calculateLiveRunningDuration(activeSession.startedAt));
    const timer = window.setInterval(() => {
      setElapsedSeconds(calculateLiveRunningDuration(activeSession.startedAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeSession?.startedAt]);

  React.useEffect(() => {
    if (!workoutSessionId || isPaused) {
      return undefined;
    }

    if (!("geolocation" in navigator)) {
      setGpsStatus("GPS unavailable");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const point = {
          sequence: (sequenceRef.current += 1),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ?? undefined,
          accuracy: position.coords.accuracy ?? undefined,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined,
          sourceTimestamp: new Date(position.timestamp).toISOString(),
        };

        try {
          const queued = loadRunningPointQueue(workoutSessionId);
          const points = [...queued, point];
          await appendPoints(workoutSessionId, points);
          clearRunningPointQueue(workoutSessionId);
          setQueuedCount(0);
          setGpsStatus("GPS locked");
        } catch {
          enqueueRunningPoints(workoutSessionId, [point]);
          setQueuedCount(loadRunningPointQueue(workoutSessionId).length);
          setGpsStatus("Sync queued");
        }
      },
      () => {
        setGpsStatus("GPS permission needed");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [appendPoints, isPaused, workoutSessionId]);

  const handlePauseResume = async () => {
    if (!workoutSessionId) {
      return;
    }

    if (isPaused) {
      await resumeRunningSession(workoutSessionId);
      return;
    }

    await pauseRunningSession(workoutSessionId);
  };

  const handleFinish = async () => {
    if (!workoutSessionId) {
      return;
    }

    const session = await finishRunningSession(workoutSessionId, {
      finishedAt: new Date().toISOString(),
    });
    clearActiveRunningSession();
    clearRunningPointQueue(workoutSessionId);
    navigate(
      `/user/workout/running/${session?.workoutSessionId ?? workoutSessionId}`,
    );
  };

  const handleCancel = async () => {
    if (!workoutSessionId) {
      return;
    }

    await cancelRunningSession(workoutSessionId, { reason: "user_cancelled" });
    clearActiveRunningSession();
    clearRunningPointQueue(workoutSessionId);
    navigate("/user/workout/running");
  };

  if (!workoutSessionId) {
    return (
      <PageTransition mode="slide-up">
        <Card>
          <CardHeader>
            <CardTitle>No active run</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/user/workout/running")}>
              Start from Running
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Live run</CardTitle>
            <Badge variant="secondary" className="gap-1">
              {gpsStatus === "GPS locked" ? (
                <CheckCircle2Icon className="size-3.5" />
              ) : (
                <AlertTriangleIcon className="size-3.5" />
              )}
              {gpsStatus}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-3xl font-semibold">
                {formatRunningDuration(
                  Math.max(elapsedSeconds, metrics.durationSeconds ?? 0),
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="text-3xl font-semibold">
                {formatRunningDistance(metrics.distanceMeters)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pace</p>
              <p className="text-3xl font-semibold">
                {formatRunningPace(metrics.averagePaceSecondsPerKm)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Queued</p>
              <p className="text-3xl font-semibold">{queuedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex min-h-[280px] items-center justify-center p-6">
            <div className="text-center">
              <MapIcon className="mx-auto size-8 text-primary" />
              <p className="mt-3 text-sm font-medium">Map preview</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Route rendering uses the lazy map provider on detail screens.
                Live GPS points are synced to the running session.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            size="lg"
            variant={isPaused ? "default" : "outline"}
            onClick={handlePauseResume}
            disabled={isPausing || isResuming}
          >
            {isPaused ? (
              <PlayIcon className="size-4" />
            ) : (
              <PauseIcon className="size-4" />
            )}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button size="lg" onClick={handleFinish} disabled={isFinishing}>
            <SquareIcon className="size-4" />
            Finish
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            <XIcon className="size-4" />
            Cancel
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default RunningLivePage;
