import React from "react";
import { useTranslation } from "react-i18next";
import compact from "lodash/compact";
import filter from "lodash/filter";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import map from "lodash/map";
import size from "lodash/size";
import toNumber from "lodash/toNumber";
import { useNavigate, useParams } from "react-router";
import html2canvas from "html2canvas";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  DumbbellIcon,
  FlameIcon,
  GaugeIcon,
  ImagePlusIcon,
  NavigationIcon,
  PencilIcon,
  RouteIcon,
  Share2Icon,
  TimerIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader, TrackingPageLayout } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDeleteWorkoutSessionHistoryItem,
  useUpdateWorkoutSessionDetails,
  useUploadWorkoutSessionMomentImage,
  useWorkoutSessionHistory,
  useWorkoutSessionHistoryItem,
} from "@/hooks/app/use-workout-sessions";
import useShare from "@/hooks/utils/use-share";
import { formatRunningDistance, formatRunningPace } from "@/lib/running-metrics";
import {
  getWorkoutSessionDistanceMeters,
  getWorkoutSessionPaceSecondsPerKm,
  isOutdoorRunningSession,
} from "@/lib/workout-session-metrics";
import { useBreadcrumbStore } from "@/store";
import RunMapPanel from "../../running/components/run-map-panel.jsx";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDuration = (seconds, t) => {
  const totalMinutes = Math.max(0, Math.round((toNumber(seconds) || 0) / 60));
  return t("user.workout.historyDetail.durationValue", {
    count: totalMinutes,
  });
};

const getRenderableExercises = (session) => {
  const detailedExercises = isArray(get(session, "exercises"))
    ? get(session, "exercises")
    : [];
  const skippedExercises = isArray(get(session, "skippedExercises"))
    ? get(session, "skippedExercises")
    : [];
  const skippedRenderableExercises = map(skippedExercises, (exercise, index) => ({
    key:
      get(exercise, "exerciseKey") ||
      get(exercise, "id") ||
      get(exercise, "exerciseName") ||
      get(exercise, "name") ||
      `skipped-${index}`,
    name: get(exercise, "exerciseName") || get(exercise, "name"),
    equipment: get(exercise, "equipment"),
    completedSets: get(exercise, "completedSets", 0),
    totalSets: get(exercise, "totalSets", 0),
    totalReps: get(exercise, "totalReps", 0),
    totalVolumeKg: get(exercise, "totalVolumeKg", 0),
    distanceMeters: get(exercise, "distanceMeters", 0),
    skipped: true,
    sets: isArray(get(exercise, "sets")) ? get(exercise, "sets") : [],
  }));

  if (detailedExercises.length > 0) {
    const renderableExercises = map(detailedExercises, (exercise, index) => ({
      key:
        get(exercise, "id") ||
        get(exercise, "exerciseKey") ||
        get(exercise, "name") ||
        `exercise-${index}`,
      name: get(exercise, "exerciseName") || get(exercise, "name"),
      equipment: get(exercise, "equipment"),
      completedSets: get(exercise, "completedSets", 0),
      totalSets: get(exercise, "totalSets", 0),
      totalReps: get(exercise, "totalReps", 0),
      totalVolumeKg: get(exercise, "totalVolumeKg", 0),
      distanceMeters: get(exercise, "distanceMeters", 0),
      skipped: Boolean(get(exercise, "skipped")),
      sets: isArray(get(exercise, "sets")) ? get(exercise, "sets") : [],
    }));
    const renderedKeys = new Set(map(renderableExercises, (item) => get(item, "key")));
    const missingSkippedExercises = filter(
      skippedRenderableExercises,
      (item) => !renderedKeys.has(get(item, "key")),
    );

    return [...renderableExercises, ...missingSkippedExercises];
  }

  return [
    ...map(get(session, "exerciseSummaries", []), (item, index) => ({
      key:
        get(item, "exerciseKey") ||
        get(item, "exerciseName") ||
        `summary-${index}`,
      name: get(item, "exerciseName"),
      equipment: null,
      completedSets: get(item, "completedSets", 0),
      totalSets: get(item, "completedSets", 0),
      totalReps: get(item, "totalReps", 0),
      totalVolumeKg: get(item, "totalVolumeKg", 0),
      distanceMeters: get(item, "distanceMeters", 0),
      skipped: false,
      sets: [],
    })),
    ...skippedRenderableExercises,
  ];
};

const getRunningRoutePolyline = (session) =>
  get(session, "route.polyline") ||
  get(session, "runningSession.route.polyline") ||
  get(session, "runningSession.polyline") ||
  null;

const getRunningRoutePoints = (session) => {
  const directPoints = get(session, "points");
  const runningPoints = get(session, "runningSession.points");

  if (isArray(directPoints) && directPoints.length > 0) {
    return directPoints;
  }

  return isArray(runningPoints) ? runningPoints : [];
};

const getRunningRouteSegments = (session) => {
  const directSegments = get(session, "route.segments");
  const runningSegments = get(session, "runningSession.route.segments");

  if (isArray(directSegments) && directSegments.length > 0) {
    return directSegments;
  }

  return isArray(runningSegments) ? runningSegments : [];
};

const ResultMetric = ({ title, value, hint, icon: Icon }) => (
  <div className="rounded-3xl bg-muted/30 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-2 text-xl font-black">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      ) : null}
    </div>
  </div>
);

const MomentEditor = ({
  details,
  imageUrl,
  isSaving,
  isUploading,
  onBlurSave,
  onChangeDetails,
  onUploadPhoto,
  t,
}) => (
  <Card className="rounded-[2rem] py-6">
    <CardHeader>
      <CardTitle className="border-l-4 border-primary pl-3">
        {t("user.workout.historyDetail.trainingMoments", "Training Moments")}
      </CardTitle>
      <CardDescription>
        {t(
          "user.workout.historyDetail.trainingMomentsDescription",
          "Rasm, sarlavha va qisqa eslatma qo'shishingiz mumkin.",
        )}
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-[0.9fr_1.4fr]">
      <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-center text-primary">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <>
            <span className="flex size-20 items-center justify-center rounded-full bg-primary/10">
              <ImagePlusIcon className="size-10" aria-hidden="true" />
            </span>
            <span className="mt-4 text-sm font-semibold uppercase">
              {t("user.workout.historyDetail.addPhoto", "Add a photo")}
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          aria-label="Add a photo input"
          className="sr-only"
          onChange={onUploadPhoto}
          disabled={isUploading || isSaving}
        />
      </label>
      <div className="space-y-3">
        <input
          value={details.momentTitle}
          onChange={(event) =>
            onChangeDetails((current) => ({
              ...current,
              momentTitle: event.target.value,
            }))
          }
          onBlur={() => onBlurSave("momentTitle")}
          placeholder={t("user.workout.historyDetail.addTitle", "Add a title")}
          aria-label={t("user.workout.historyDetail.addTitle", "Add a title")}
          className="h-14 w-full rounded-2xl border bg-background px-4 text-base outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="relative">
          <PencilIcon
            className="pointer-events-none absolute left-4 top-4 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <textarea
            value={details.momentText}
            onChange={(event) =>
              onChangeDetails((current) => ({
                ...current,
                momentText: event.target.value,
              }))
            }
            onBlur={() => onBlurSave("momentText")}
            placeholder={t("user.workout.historyDetail.addText", "Add text")}
            aria-label={t("user.workout.historyDetail.addText", "Add text")}
            className="min-h-[110px] w-full resize-none rounded-2xl border bg-background py-4 pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FeelingEditor = ({ feelingLevel, isSaving, onFeeling, t }) => (
  <Card className="rounded-[2rem] py-6">
    <CardHeader>
      <CardTitle className="border-l-4 border-primary pl-3">
        {t("user.workout.historyDetail.trainingFeeling", "Training Feeling")}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("user.workout.historyDetail.easy", "Easy")}</span>
        <span>{t("user.workout.historyDetail.exhausting", "Exhausting")}</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {map([1, 2, 3, 4], (level) => (
          <Button
            key={level}
            type="button"
            variant={feelingLevel === level ? "default" : "outline"}
            className="h-14 rounded-2xl text-base font-semibold"
            onClick={() => onFeeling(level)}
            disabled={isSaving}
          >
            <FlameIcon className="size-5" aria-hidden="true" />x{level}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

const SessionHistoryDetailPage = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { session, isLoading, isError, refetch } = useWorkoutSessionHistoryItem(sessionId);
  const { sessions } = useWorkoutSessionHistory({ enabled: false });
  const { updateWorkoutSessionDetails, isPending: isSavingDetails } =
    useUpdateWorkoutSessionDetails();
  const {
    deleteWorkoutSessionHistoryItem,
    isPending: isDeletingHistoryItem,
  } = useDeleteWorkoutSessionHistoryItem();
  const {
    uploadWorkoutSessionMomentImage,
    isPending: isUploadingMomentImage,
  } = useUploadWorkoutSessionMomentImage();
  const { share } = useShare();
  const shareCardRef = React.useRef(null);
  const [detailsDraft, setDetailsDraft] = React.useState({
    sessionId: null,
  });
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.workout.plansList.breadcrumbs.home") },
      {
        url: "/user/workout",
        title: t("user.workout.plansList.breadcrumbs.workout"),
      },
      {
        url: "/user/workout/history",
        title: t("user.workout.history.breadcrumb"),
      },
      {
        url: `/user/workout/history/${sessionId}`,
        title: t("user.workout.historyDetail.session"),
      },
    ]);
  }, [sessionId, setBreadcrumbs, t]);

  const relatedPlanPath = React.useMemo(() => {
    const planId = get(session, "planId");
    const dayIndex = get(session, "planDayIndex");
    if (!planId || dayIndex === null || dayIndex === undefined) {
      return null;
    }

    return `/user/workout/plans/${planId}/days/${dayIndex}`;
  }, [session]);

  const previousSessionId = React.useMemo(() => {
    const index = sessions.findIndex((item) => get(item, "id") === sessionId);
    if (index < 0 || index === sessions.length - 1) {
      return null;
    }

    return get(sessions[index + 1], "id") || null;
  }, [sessionId, sessions]);
  const renderableExercises = React.useMemo(
    () => getRenderableExercises(session),
    [session],
  );
  const skippedExerciseCount = Math.max(
    toNumber(get(session, "skippedExerciseCount", 0)) || 0,
    size(filter(renderableExercises, (item) => get(item, "skipped"))),
  );
  const isRunning = isOutdoorRunningSession(session);
  const distanceMeters = getWorkoutSessionDistanceMeters(session);
  const paceSecondsPerKm = getWorkoutSessionPaceSecondsPerKm(session);
  const runningRoutePolyline = getRunningRoutePolyline(session);
  const runningRouteSegments = getRunningRouteSegments(session);
  const runningRoutePoints = getRunningRoutePoints(session);
  const sessionDetailsSnapshot = React.useMemo(
    () => ({
      momentTitle: get(session, "moments.title", "") ?? "",
      momentText: get(session, "moments.text", "") ?? "",
      feelingLevel: toNumber(get(session, "feeling.level", 0)) || 0,
      imageUrl: get(session, "moments.imageUrl", null),
    }),
    [session],
  );
  const hasCurrentDetailsDraft = get(detailsDraft, "sessionId") === sessionId;
  const details = React.useMemo(
    () => ({
      momentTitle:
        hasCurrentDetailsDraft && get(detailsDraft, "momentTitle") !== undefined
          ? get(detailsDraft, "momentTitle")
          : sessionDetailsSnapshot.momentTitle,
      momentText:
        hasCurrentDetailsDraft && get(detailsDraft, "momentText") !== undefined
          ? get(detailsDraft, "momentText")
          : sessionDetailsSnapshot.momentText,
      feelingLevel:
        hasCurrentDetailsDraft && get(detailsDraft, "feelingLevel") !== undefined
          ? get(detailsDraft, "feelingLevel")
          : sessionDetailsSnapshot.feelingLevel,
    }),
    [detailsDraft, hasCurrentDetailsDraft, sessionDetailsSnapshot],
  );
  const imageUrl =
    hasCurrentDetailsDraft && get(detailsDraft, "imageUrl") !== undefined
      ? get(detailsDraft, "imageUrl")
      : sessionDetailsSnapshot.imageUrl;
  const feelingLevel =
    toNumber(details.feelingLevel) ||
    toNumber(get(session, "feeling.level", 0)) ||
    0;

  const updateDetailsDraft = React.useCallback(
    (updater) => {
      setDetailsDraft((current) => {
        const currentValues = {
          sessionId,
          momentTitle:
            get(current, "sessionId") === sessionId &&
            get(current, "momentTitle") !== undefined
              ? get(current, "momentTitle")
              : sessionDetailsSnapshot.momentTitle,
          momentText:
            get(current, "sessionId") === sessionId &&
            get(current, "momentText") !== undefined
              ? get(current, "momentText")
              : sessionDetailsSnapshot.momentText,
          feelingLevel:
            get(current, "sessionId") === sessionId &&
            get(current, "feelingLevel") !== undefined
              ? get(current, "feelingLevel")
              : sessionDetailsSnapshot.feelingLevel,
          imageUrl:
            get(current, "sessionId") === sessionId &&
            get(current, "imageUrl") !== undefined
              ? get(current, "imageUrl")
              : sessionDetailsSnapshot.imageUrl,
        };
        const nextValues =
          typeof updater === "function" ? updater(currentValues) : updater;

        return {
          ...currentValues,
          ...nextValues,
          sessionId,
        };
      });
    },
    [sessionDetailsSnapshot, sessionId],
  );

  const saveDetails = React.useCallback(
    async (patch) => {
      if (!sessionId) {
        return null;
      }

      try {
        const updated = await updateWorkoutSessionDetails(sessionId, patch);
        const updatedImageUrl = get(updated, "moments.imageUrl", undefined);
        if (updatedImageUrl !== undefined) {
          updateDetailsDraft({ imageUrl: updatedImageUrl });
        }
        return updated;
      } catch {
        toast.error(
          t(
            "user.workout.historyDetail.saveDetailsError",
            "Ma'lumotlarni saqlab bo'lmadi.",
          ),
        );
        return null;
      }
    },
    [sessionId, t, updateDetailsDraft, updateWorkoutSessionDetails],
  );

  const handleBlurSave = React.useCallback(
    (field) => {
      void saveDetails({ [field]: get(details, field) });
    },
    [details, saveDetails],
  );

  const handleFeeling = React.useCallback(
    (level) => {
      updateDetailsDraft((current) => ({
        ...current,
        feelingLevel: level,
      }));
      void saveDetails({ feelingLevel: level });
    },
    [saveDetails, updateDetailsDraft],
  );

  const handleUploadPhoto = React.useCallback(
    async (event) => {
      const file = get(event, "target.files.0", null);
      event.target.value = "";

      if (!file) {
        return;
      }

      try {
        const uploaded = await uploadWorkoutSessionMomentImage(file);
        const uploadedId = get(uploaded, "id", null);
        updateDetailsDraft({ imageUrl: get(uploaded, "url", null) });
        if (uploadedId) {
          await saveDetails({ momentImageUploadId: uploadedId });
        }
      } catch {
        toast.error(
          t("user.workout.historyDetail.photoUploadError", "Rasm yuklanmadi."),
        );
      }
    },
    [saveDetails, t, updateDetailsDraft, uploadWorkoutSessionMomentImage],
  );

  const handleShare = React.useCallback(async () => {
    const title = isRunning
      ? t("user.workout.historyDetail.runningShareTitle", "Running activity")
      : t("user.workout.historyDetail.workoutShareTitle", "Workout complete");
    const text = isRunning
      ? join(
          compact([
            formatRunningDistance(distanceMeters),
            formatRunningPace(paceSecondsPerKm),
            `${get(session, "estimatedCalories", 0)} kcal`,
          ]),
          " • ",
        )
      : join(
          compact([
            get(session, "focus") || get(session, "planName"),
            formatDuration(get(session, "durationSeconds"), t),
            `${get(session, "estimatedCalories", 0)} kcal`,
          ]),
          " • ",
        );

    try {
      if (shareCardRef.current) {
        const scale =
          typeof window === "undefined"
            ? 1
            : Math.min(2, window.devicePixelRatio || 1);
        const canvas = await html2canvas(shareCardRef.current, {
          backgroundColor: null,
          scale,
          useCORS: true,
        });
        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, "image/webp", 0.86);
        });

        if (blob) {
          const file = new File([blob], `${sessionId || "workout"}-result.webp`, {
            type: get(blob, "type", "image/webp") || "image/webp",
          });
          if (
            typeof navigator !== "undefined" &&
            navigator.share &&
            navigator.canShare?.({ files: [file] })
          ) {
            await navigator.share({ title, text, files: [file] });
            return;
          }
        }
      }
    } catch {
      // Fallback below covers browsers that cannot capture or share files.
    }

    await share({
      title,
      text,
      url: typeof window === "undefined" ? undefined : window.location.href,
    });
  }, [distanceMeters, isRunning, paceSecondsPerKm, session, sessionId, share, t]);

  const handleDelete = React.useCallback(async () => {
    if (!sessionId) {
      return;
    }

    try {
      await deleteWorkoutSessionHistoryItem(sessionId);
      toast.success(
        t("user.workout.historyDetail.deleteSuccess", "Activity o'chirildi."),
      );
      navigate("/user/workout/history");
    } catch {
      toast.error(
        t("user.workout.historyDetail.deleteError", "Activity o'chirilmadi."),
      );
    }
  }, [deleteWorkoutSessionHistoryItem, navigate, sessionId, t]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !session) {
    return (
      <PageTransition mode="slide-up">
        <Card className="py-6">
          <CardHeader>
            <CardTitle>{t("user.workout.historyDetail.notFoundTitle")}</CardTitle>
            <CardDescription>
              {t("user.workout.historyDetail.notFoundDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => refetch()}>
              {t("user.workout.historyDetail.retry")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
              {t("user.workout.historyDetail.backToHistory")}
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const deleteDialog = (
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("user.workout.historyDetail.deleteTitle", "Activity o'chirilsinmi?")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "user.workout.historyDetail.deleteDescription",
              "Bu activity, workout loglar va bog'liq running data butunlay o'chadi.",
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
            {t("user.workout.historyDetail.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeletingHistoryItem}
          >
            {t("user.workout.historyDetail.delete", "Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isRunning) {
    return (
      <PageTransition mode="slide-up">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <TrackingPageHeader
            title={get(session, "focus") || t("user.workout.historyDetail.outdoorRun")}
            subtitle={t("user.workout.historyDetail.runningSubtitle")}
            hideTitleOnMobile={false}
            actions={
              <>
                <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  {t("user.workout.historyDetail.history")}
                </Button>
                <Button onClick={handleShare}>
                  <Share2Icon data-icon="inline-start" />
                  {t("user.workout.historyDetail.share", "Share")}
                </Button>
              </>
            }
          />

          <TrackingPageLayout
            aside={
              <div className="space-y-4">
                <Card className="rounded-[2rem] py-6">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <RouteIcon />
                        {t("user.workout.historyDetail.running")}
                      </Badge>
                      <Badge variant="secondary">
                        <CheckCircle2Icon />
                        {t("user.workout.historyDetail.completed")}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black">
                      {t("user.workout.historyDetail.gpsRunningSession")}
                    </CardTitle>
                    <CardDescription>
                      {formatDateTime(get(session, "endedAt"))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDaysIcon className="size-4" />
                      {formatDateTime(get(session, "endedAt"))}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <TimerIcon className="size-4" />
                      {formatDuration(get(session, "durationSeconds"), t)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <FlameIcon className="size-4" />
                      {get(session, "estimatedCalories", 0)} kcal
                    </p>
                  </CardContent>
                </Card>

                {previousSessionId ? (
                  <Card className="rounded-[2rem] py-6">
                    <CardHeader className="pb-3">
                    <CardTitle className="text-base font-black">
                      {t("user.workout.historyDetail.previousSession")}
                    </CardTitle>
                    <CardDescription>
                      {t("user.workout.historyDetail.previousDescription")}
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/user/workout/history/${previousSessionId}`)}
                      >
                        {t("user.workout.historyDetail.openPrevious")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            }
          >
            <div ref={shareCardRef} className="space-y-6">
              <Card className="rounded-[2rem] py-6">
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      <RouteIcon />
                      {t("user.workout.historyDetail.running")}
                    </Badge>
                    <Badge variant="secondary">
                      <CheckCircle2Icon />
                      {t("user.workout.historyDetail.completed")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {formatDateTime(get(session, "endedAt"))}
                    </p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-6xl font-black leading-none sm:text-7xl">
                        {formatRunningDistance(distanceMeters).replace(/\s*km$/i, "")}
                      </span>
                      <span className="pb-2 text-2xl font-black text-muted-foreground">
                        KM
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <RunMapPanel
                title={t("user.workout.historyDetail.routeMap", "Route map")}
                polyline={runningRoutePolyline}
                segments={runningRouteSegments}
                points={runningRoutePoints}
                qualityScore={get(
                  session,
                  "metrics.gpsQualityScore",
                  get(session, "runningSession.metrics.gpsQualityScore", null),
                )}
                emptyLabel={t(
                  "user.workout.historyDetail.routeMissing",
                  "Route GPS nuqtalari topilmadi",
                )}
              />

              <Card className="rounded-[2rem] py-6">
                <CardHeader>
                  <CardTitle className="inline-flex items-center gap-2 text-primary">
                    {t("user.workout.historyDetail.trainingData", "Training Data")}
                    <GaugeIcon className="size-5" aria-hidden="true" />
                  </CardTitle>
                  <CardDescription>
                    {t("user.workout.historyDetail.runningSummaryDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <ResultMetric
                    title={t("user.workout.historyDetail.movingTime", "Moving time")}
                    value={formatDuration(
                      get(
                        session,
                        "runningSession.metrics.movingDurationSeconds",
                        get(session, "durationSeconds"),
                      ),
                      t,
                    )}
                    icon={ClockIcon}
                  />
                  <ResultMetric
                    title={t("user.workout.historyDetail.avgPace", "Avg Pace")}
                    value={formatRunningPace(paceSecondsPerKm)}
                    icon={GaugeIcon}
                  />
                  <ResultMetric
                    title={t("user.workout.historyDetail.distance")}
                    value={formatRunningDistance(distanceMeters)}
                    icon={RouteIcon}
                  />
                  <ResultMetric
                    title={t("user.workout.historyDetail.totalTime", "Total Time")}
                    value={formatDuration(get(session, "durationSeconds"), t)}
                    icon={TimerIcon}
                  />
                  <ResultMetric
                    title={t("user.workout.historyDetail.avgSpeed", "Avg speed")}
                    value={`${(
                      toNumber(get(session, "runningSession.metrics.averageSpeedKmh")) ||
                      (distanceMeters > 0 && toNumber(get(session, "durationSeconds")) > 0
                        ? distanceMeters /
                          1000 /
                          (toNumber(get(session, "durationSeconds")) / 3600)
                        : 0)
                    ).toFixed(2)} kph`}
                    icon={NavigationIcon}
                  />
                  <ResultMetric
                    title={t("user.workout.historyDetail.calories")}
                    value={`${get(session, "estimatedCalories", 0)} kcal`}
                    icon={FlameIcon}
                  />
                </CardContent>
              </Card>

              <MomentEditor
                details={details}
                imageUrl={imageUrl}
                isSaving={isSavingDetails}
                isUploading={isUploadingMomentImage}
                onBlurSave={handleBlurSave}
                onChangeDetails={updateDetailsDraft}
                onUploadPhoto={handleUploadPhoto}
                t={t}
              />

              <FeelingEditor
                feelingLevel={feelingLevel}
                isSaving={isSavingDetails}
                onFeeling={handleFeeling}
                t={t}
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon className="size-5" aria-hidden="true" />
              {t("user.workout.historyDetail.deleteActivity", "Delete this activity")}
            </Button>
            {deleteDialog}
          </TrackingPageLayout>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <TrackingPageHeader
          title={
            get(session, "focus") ||
            get(session, "planName") ||
            t("user.workout.historyDetail.workout")
          }
          subtitle={t("user.workout.historyDetail.workoutSubtitle")}
          hideTitleOnMobile={false}
          actions={
            <>
              <Button variant="outline" onClick={() => navigate("/user/workout/history")}>
                <ArrowLeftIcon data-icon="inline-start" />
                {t("user.workout.historyDetail.history")}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2Icon data-icon="inline-start" />
                {t("user.workout.historyDetail.share", "Share")}
              </Button>
              {relatedPlanPath ? (
                <Button onClick={() => navigate(relatedPlanPath)}>
                  {t("user.workout.historyDetail.planDay")}
                </Button>
              ) : null}
            </>
          }
        />

        <TrackingPageLayout
          aside={
            <div className="space-y-4">
              <Card className="rounded-[2rem] py-6">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {t("user.workout.historyDetail.dayBadge", {
                        day: (toNumber(get(session, "planDayIndex")) || 0) + 1,
                      })}
                    </Badge>
                    <Badge variant="secondary">
                      <CheckCircle2Icon />
                      {t("user.workout.historyDetail.completed")}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black">
                    {get(session, "planName") ||
                      t("user.workout.historyDetail.workoutPlan")}
                  </CardTitle>
                  <CardDescription>
                    {formatDateTime(get(session, "endedAt"))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.duration")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {formatDuration(get(session, "durationSeconds"), t)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.calories")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "estimatedCalories", 0)} kcal
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.sets")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "completedSets", 0)}/{get(session, "totalSets", 0)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">
                        {t("user.workout.historyDetail.volume")}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {get(session, "totalVolumeKg", 0)} kg
                      </p>
                    </div>
                    {skippedExerciseCount > 0 ? (
                      <div className="rounded-3xl bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">
                          {t("user.workout.historyDetail.skipped")}
                        </p>
                        <p className="mt-2 text-xl font-black">
                          {t("user.workout.historyDetail.skippedCount", {
                            count: skippedExerciseCount,
                          })}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="inline-flex items-center gap-2">
                      <CalendarDaysIcon className="size-4" />
                      {formatDateTime(get(session, "endedAt"))}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <TimerIcon className="size-4" />
                      {formatDuration(get(session, "durationSeconds"), t)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <FlameIcon className="size-4" />
                      {get(session, "estimatedCalories", 0)} kcal
                    </p>
                  </div>
                </CardContent>
              </Card>

              {previousSessionId ? (
                <Card className="rounded-[2rem] py-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-black">
                      {t("user.workout.historyDetail.previousSession")}
                    </CardTitle>
                    <CardDescription>
                      {t("user.workout.historyDetail.previousDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/user/workout/history/${previousSessionId}`)}
                    >
                      {t("user.workout.historyDetail.openPrevious")}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          }
        >
          <div ref={shareCardRef} className="space-y-6">
            <Card className="rounded-[2rem] py-6">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    <CheckCircle2Icon />
                    {t("user.workout.historyDetail.completed")}
                  </Badge>
                  <Badge variant="outline">
                    <DumbbellIcon />
                    {t("user.workout.historyDetail.strength", "Strength")}
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-black">
                  {t("user.workout.historyDetail.workoutComplete", "Workout complete")}
                </CardTitle>
                <CardDescription>
                  {get(session, "planName") || formatDateTime(get(session, "endedAt"))}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultMetric
                  title={t("user.workout.historyDetail.duration")}
                  value={formatDuration(get(session, "durationSeconds"), t)}
                  icon={TimerIcon}
                />
                <ResultMetric
                  title={t("user.workout.historyDetail.calories")}
                  value={`${get(session, "estimatedCalories", 0)} kcal`}
                  icon={FlameIcon}
                />
                <ResultMetric
                  title={t("user.workout.historyDetail.sets")}
                  value={`${get(session, "completedSets", 0)}/${get(session, "totalSets", 0)}`}
                  icon={CheckCircle2Icon}
                />
                <ResultMetric
                  title={t("user.workout.historyDetail.volume")}
                  value={`${get(session, "totalVolumeKg", 0)} kg`}
                  icon={GaugeIcon}
                />
              </CardContent>
            </Card>

            <MomentEditor
              details={details}
              imageUrl={imageUrl}
              isSaving={isSavingDetails}
              isUploading={isUploadingMomentImage}
              onBlurSave={handleBlurSave}
              onChangeDetails={updateDetailsDraft}
              onUploadPhoto={handleUploadPhoto}
              t={t}
            />

            <FeelingEditor
              feelingLevel={feelingLevel}
              isSaving={isSavingDetails}
              onFeeling={handleFeeling}
              t={t}
            />

            <Card className="rounded-[2rem] py-6">
            <CardHeader>
              <CardTitle>{t("user.workout.historyDetail.completedExercises")}</CardTitle>
              <CardDescription>
                {t("user.workout.historyDetail.completedDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {map(renderableExercises, (item) => (
                <div
                  key={get(item, "key")}
                  className="space-y-3 rounded-3xl border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <DumbbellIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black">{get(item, "name")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {get(item, "equipment") ||
                          t("user.workout.historyDetail.bodyweight")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {t("user.workout.historyDetail.setCount", {
                            completed: get(item, "completedSets", 0),
                            total: get(item, "totalSets", 0),
                          })}
                        </Badge>
                        <Badge variant="outline">
                          {t("user.workout.historyDetail.repsCount", {
                            count: get(item, "totalReps", 0),
                          })}
                        </Badge>
                        {toNumber(get(item, "distanceMeters", 0)) > 0 ? (
                          <Badge variant="outline">
                            {get(item, "distanceMeters", 0)} m
                          </Badge>
                        ) : null}
                        {get(item, "skipped") ? (
                          <Badge variant="secondary">
                            {t("user.workout.historyDetail.skippedBadge")}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="inline-flex items-center gap-1 text-sm font-bold">
                        <GaugeIcon className="size-4 text-muted-foreground" />
                        {get(item, "totalVolumeKg", 0)} kg
                      </p>
                    </div>
                  </div>

                  {isArray(get(item, "sets")) && get(item, "sets.length") > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {map(get(item, "sets", []), (set) => (
                        <div
                          key={get(set, "id") || `${get(item, "key")}-${get(set, "setIndex")}`}
                          className="grid grid-cols-[28px_repeat(4,minmax(0,1fr))] items-center gap-2 rounded-2xl bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="font-black">{toNumber(get(set, "setIndex", 0)) + 1}</span>
                          <span>
                            {t("user.workout.historyDetail.repsCount", {
                              count: get(set, "reps", 0),
                            })}
                          </span>
                          <span>{get(set, "weight", 0)} kg</span>
                          <span>
                            {t("user.workout.historyDetail.secondsCount", {
                              count: get(set, "durationSeconds", 0),
                            })}
                          </span>
                          <span>{get(set, "distanceMeters", 0)} m</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon className="size-5" aria-hidden="true" />
            {t("user.workout.historyDetail.deleteActivity", "Delete this activity")}
          </Button>
          {deleteDialog}
        </TrackingPageLayout>
      </div>
    </PageTransition>
  );
};

export default SessionHistoryDetailPage;
