import React from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
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
  loadActiveRunningSession,
  loadRunningPointQueue,
  saveActiveRunningSession,
} from "@/lib/running-offline-queue";
import {
  calculateLiveRunningDuration,
  calculateLiveRunningMetrics,
  formatRunningDistance,
  formatRunningDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import RunMapPanel from "../components/run-map-panel.jsx";

const getMaxPointSequence = (points = []) =>
  points.reduce(
    (maxSequence, point) =>
      Math.max(maxSequence, Number(point?.sequence ?? 0) || 0),
    0,
  );

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
  const [livePoints, setLivePoints] = React.useState([]);
  const sequenceRef = React.useRef(0);
  const localActiveSession = React.useMemo(() => loadActiveRunningSession(), []);
  const workoutSessionId =
    routeWorkoutSessionId ??
    activeSession?.workoutSessionId ??
    localActiveSession?.workoutSessionId ??
    null;
  const effectiveActiveSession =
    activeSession ??
    (localActiveSession?.workoutSessionId === workoutSessionId
      ? localActiveSession
      : null);
  const isPaused = effectiveActiveSession?.status === "paused";
  const metrics = React.useMemo(
    () =>
      calculateLiveRunningMetrics({
        baseMetrics: effectiveActiveSession?.metrics ?? {},
        elapsedSeconds,
        points: livePoints,
      }),
    [effectiveActiveSession?.metrics, elapsedSeconds, livePoints],
  );

  React.useEffect(() => {
    if (activeSession?.workoutSessionId) {
      saveActiveRunningSession(activeSession);
    }
  }, [activeSession]);

  React.useEffect(() => {
    if (!workoutSessionId) {
      return;
    }

    const queuedPoints = loadRunningPointQueue(workoutSessionId);
    sequenceRef.current = Math.max(
      sequenceRef.current,
      Number(effectiveActiveSession?.lastAcceptedSequence ?? 0) || 0,
      getMaxPointSequence(queuedPoints),
    );
    setQueuedCount(queuedPoints.length);
  }, [effectiveActiveSession?.lastAcceptedSequence, workoutSessionId]);

  React.useEffect(() => {
    if (!effectiveActiveSession?.startedAt) {
      return undefined;
    }

    setElapsedSeconds(
      calculateLiveRunningDuration(effectiveActiveSession.startedAt),
    );
    const timer = window.setInterval(() => {
      setElapsedSeconds(
        calculateLiveRunningDuration(effectiveActiveSession.startedAt),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [effectiveActiveSession?.startedAt]);

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
        const nextSequence = sequenceRef.current + 1;
        sequenceRef.current = nextSequence;
        const point = {
          sequence: nextSequence,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude ?? undefined,
          accuracy: position.coords.accuracy ?? undefined,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined,
          sourceTimestamp: new Date(position.timestamp).toISOString(),
        };

        setLivePoints((currentPoints) => [...currentPoints, point].slice(-500));

        try {
          const queued = loadRunningPointQueue(workoutSessionId);
          const points = [...queued, point];
          const result = await appendPoints(workoutSessionId, points);
          sequenceRef.current = Math.max(
            sequenceRef.current,
            Number(result?.lastAcceptedSequence ?? 0) || 0,
          );
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

    const queuedPoints = loadRunningPointQueue(workoutSessionId);
    if (queuedPoints.length > 0) {
      try {
        const result = await appendPoints(workoutSessionId, queuedPoints);
        sequenceRef.current = Math.max(
          sequenceRef.current,
          Number(result?.lastAcceptedSequence ?? 0) || 0,
        );
        clearRunningPointQueue(workoutSessionId);
        setQueuedCount(0);
      } catch {
        setQueuedCount(loadRunningPointQueue(workoutSessionId).length);
        setGpsStatus("Sync queued");
        return;
      }
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

        <RunMapPanel
          title="Live route"
          points={livePoints}
          emptyLabel="Waiting for GPS"
        />

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
