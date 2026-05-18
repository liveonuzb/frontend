import React from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { get, map, toNumber, toUpper, trim, filter } from "lodash";
import {
  ClockIcon,
  FlameIcon,
  GaugeIcon,
  ImagePlusIcon,
  MountainIcon,
  NavigationIcon,
  PencilIcon,
  Share2Icon,
  TimerIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePostQuery } from "@/hooks/api";
import useMe from "@/hooks/app/use-me";
import {
  useDeleteRunningSession,
  useRunningSessionDetail,
  useUpdateRunningSessionDetails,
} from "@/hooks/app/use-running-sessions";
import useShare from "@/hooks/utils/use-share";
import {
  formatRunningClockDuration,
  formatRunningPace,
} from "@/lib/running-metrics";
import RunMapPanel from "../components/run-map-panel.jsx";

const formatMainDistance = (meters = 0) =>
  (Math.max(0, toNumber(meters) || 0) / 1000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateTimeRange = (startedAt, endedAt) => {
  if (!startedAt) {
    return "";
  }

  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : null;
  const date = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(start);
  const endTime = end
    ? new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(end)
    : null;

  return endTime ? `${date} • ${time} – ${endTime}` : `${date} • ${time}`;
};

const getUserName = (user) => {
  const firstName =
    get(user, "profile.firstName", "") || get(user, "firstName", "");
  const lastName =
    get(user, "profile.lastName", "") || get(user, "lastName", "");
  const fullName = trim(filter([firstName, lastName], Boolean).join(" "));
  return (
    fullName || get(user, "name", "") || get(user, "phone", "LiveOn runner")
  );
};

const getInitial = (name) => toUpper(trim(name).charAt(0)) || "U";

const ResultCard = ({ children, className = "" }) => (
  <Card
    className={`rounded-[1.35rem] border-primary/20 bg-background/95 shadow-sm ${className}`}
  >
    <CardContent className="p-4 sm:p-6">{children}</CardContent>
  </Card>
);

const DataCell = ({ icon: Icon, label, value, suffix }) => (
  <div className="min-w-0 border-border/70 px-1.5 py-3 first:border-l-0 sm:border-l sm:px-2">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
      <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-2 flex items-end gap-1">
      <span className="whitespace-nowrap text-[1.3rem] font-semibold leading-none tabular-nums sm:text-2xl">
        {value}
      </span>
      {suffix ? (
        <span className="text-xs text-muted-foreground sm:text-sm">
          {suffix}
        </span>
      ) : null}
    </div>
  </div>
);

const RunningDetailPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { workoutSessionId } = useParams();
  const { user } = useMe();
  const { share } = useShare();
  const { session, isLoading } = useRunningSessionDetail(workoutSessionId);
  const { updateRunningSessionDetails, isPending: isSavingDetails } =
    useUpdateRunningSessionDetails();
  const { deleteRunningSession, isPending: isDeleting } =
    useDeleteRunningSession();
  const imageUploadMutation = usePostQuery();
  const [details, setDetails] = React.useState({
    momentTitle: "",
    momentText: "",
    feelingLevel: 0,
  });
  const [imageUrl, setImageUrl] = React.useState(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const sessionDetailsSnapshot = React.useMemo(() => {
    if (!session) {
      return null;
    }

    return {
      momentTitle: get(session, "moments.title", "") ?? "",
      momentText: get(session, "moments.text", "") ?? "",
      feelingLevel: toNumber(get(session, "feeling.level", 0)) || 0,
      imageUrl: get(session, "moments.imageUrl", null),
    };
  }, [
    session?.feeling?.level,
    session?.moments?.imageUrl,
    session?.moments?.text,
    session?.moments?.title,
    session?.workoutSessionId,
  ]);

  React.useEffect(() => {
    if (!sessionDetailsSnapshot) {
      return;
    }

    setDetails({
      momentTitle: sessionDetailsSnapshot.momentTitle,
      momentText: sessionDetailsSnapshot.momentText,
      feelingLevel: sessionDetailsSnapshot.feelingLevel,
    });
    setImageUrl(sessionDetailsSnapshot.imageUrl);
  }, [sessionDetailsSnapshot]);

  const saveDetails = React.useCallback(
    async (patch) => {
      if (!workoutSessionId) {
        return;
      }

      try {
        const updated = await updateRunningSessionDetails(
          workoutSessionId,
          patch,
        );
        setImageUrl(get(updated, "moments.imageUrl", imageUrl));
      } catch {
        toast.error(
          t(
            "user.workout.running.detail.saveError",
            "Ma'lumotlarni saqlab bo'lmadi.",
          ),
        );
      }
    },
    [imageUrl, t, updateRunningSessionDetails, workoutSessionId],
  );

  const handleUploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !workoutSessionId) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "running-moments");

    try {
      const response = await imageUploadMutation.mutateAsync({
        url: "/user/media/images",
        attributes: formData,
      });
      const uploaded = get(response, "data.data", get(response, "data"));
      const uploadedUrl = uploaded?.url ?? null;
      setImageUrl(uploadedUrl);
      await saveDetails({
        momentImageUploadId: uploaded?.id,
      });
    } catch {
      toast.error(
        t("user.workout.running.detail.photoError", "Rasm yuklanmadi."),
      );
    }
  };

  const handleBlurSave = (field) => {
    void saveDetails({ [field]: details[field] });
  };

  const handleFeeling = (level) => {
    setDetails((current) => ({
      ...current,
      feelingLevel: level,
    }));
    void saveDetails({ feelingLevel: level });
  };

  const handleShare = () => {
    void share({
      title: t("user.workout.running.detail.shareTitle", "Running activity"),
      text: `${formatMainDistance(session?.metrics?.distanceMeters)} KM`,
      url: window.location.href,
    });
  };

  const handleDelete = async () => {
    if (!workoutSessionId) {
      return;
    }

    try {
      await deleteRunningSession(workoutSessionId);
      toast.success(
        t("user.workout.running.detail.deleteSuccess", "Activity o'chirildi."),
      );
      navigate("/user/workout/running");
    } catch {
      toast.error(
        t("user.workout.running.detail.deleteError", "Activity o'chirilmadi."),
      );
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return (
      <ResultCard>
        <p className="text-lg font-semibold">
          {t("user.workout.running.detail.notFound", "Yugurish topilmadi")}
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate("/user/workout/running")}
        >
          {t("user.workout.running.detail.backToHistory", "Tarixga qaytish")}
        </Button>
      </ResultCard>
    );
  }

  const userName = getUserName(user);
  const metrics = session.metrics ?? {};
  const feelingLevel =
    toNumber(details.feelingLevel) ||
    toNumber(get(session, "feeling.level", 0)) ||
    0;
  const averageSpeed =
    toNumber(metrics.averageSpeedKmh ?? 0) ||
    (toNumber(metrics.distanceMeters ?? 0) > 0 &&
    toNumber(metrics.durationSeconds ?? 0) > 0
      ? toNumber(metrics.distanceMeters) /
        1000 /
        (toNumber(metrics.durationSeconds) / 3600)
      : 0);

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto max-w-[620px] space-y-5 px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label={t("user.workout.running.detail.close", "Close")}
            onClick={() => navigate("/user/workout/running")}
          >
            <XIcon className="size-7" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full border-primary/30 px-5 text-primary"
            onClick={handleShare}
          >
            <Share2Icon className="size-5" aria-hidden="true" />
            {t("user.workout.running.detail.share", "Share")}
          </Button>
        </header>

        <section className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-primary-foreground">
            {getInitial(userName)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{userName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTimeRange(session.startedAt, session.endedAt)}
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-end gap-2">
            <span className="text-[5rem] font-semibold leading-none tracking-normal">
              {formatMainDistance(metrics.distanceMeters)}
            </span>
            <span className="pb-3 text-2xl font-semibold text-muted-foreground">
              KM
            </span>
          </div>
        </section>

        <ResultCard className="overflow-hidden p-0">
          <div className="-m-4 sm:-m-6">
            <RunMapPanel
              title={null}
              points={session.points}
              polyline={session.route?.polyline}
              emptyLabel={t(
                "user.workout.running.detail.noRoute",
                "Route yozilmagan",
              )}
              className="h-[260px]"
              surfaceClassName="h-[260px] min-h-[260px] rounded-[1.35rem]"
            />
          </div>
        </ResultCard>

        <ResultCard>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-primary">
              {t("user.workout.running.detail.trainingData", "Training Data")}
            </h2>
            <GaugeIcon className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">
            <DataCell
              icon={ClockIcon}
              label={t("user.workout.running.detail.movingTime", "Moving time")}
              value={formatRunningClockDuration(
                metrics.movingDurationSeconds ?? metrics.durationSeconds,
              )}
            />
            <DataCell
              icon={GaugeIcon}
              label={t("user.workout.running.detail.avgPace", "Avg Pace")}
              value={formatRunningPace(metrics.averagePaceSecondsPerKm).replace(
                /\s*\/km$/,
                "",
              )}
              suffix="/km"
            />
            <DataCell
              icon={MountainIcon}
              label={t("user.workout.running.detail.elevation", "Elevation")}
              value={Math.round(toNumber(metrics.elevationGainMeters ?? 0) || 0)}
              suffix="m"
            />
            <DataCell
              icon={TimerIcon}
              label={t("user.workout.running.detail.totalTime", "Total Time")}
              value={formatRunningClockDuration(metrics.durationSeconds)}
            />
            <DataCell
              icon={NavigationIcon}
              label={t("user.workout.running.detail.avgSpeed", "Avg speed")}
              value={averageSpeed.toFixed(2)}
              suffix="kph"
            />
            <DataCell
              icon={FlameIcon}
              label={t("user.workout.running.detail.calories", "Calories")}
              value={Math.round(toNumber(metrics.caloriesBurned ?? 0) || 0)}
              suffix="kcal"
            />
          </div>
        </ResultCard>

        <ResultCard>
          <h2 className="border-l-4 border-primary pl-3 text-xl font-semibold">
            {t(
              "user.workout.running.detail.trainingMoments",
              "Training Moments",
            )}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[0.9fr_1.4fr]">
            <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-center text-primary">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <span className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                    <ImagePlusIcon className="size-10" aria-hidden="true" />
                  </span>
                  <span className="mt-4 text-sm font-semibold uppercase">
                    {t("user.workout.running.detail.addPhoto", "Add a photo")}
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleUploadPhoto}
                disabled={imageUploadMutation.isPending || isSavingDetails}
              />
            </label>
            <div className="space-y-3">
              <input
                value={details.momentTitle}
                onChange={(event) =>
                  setDetails((current) => ({
                    ...current,
                    momentTitle: event.target.value,
                  }))
                }
                onBlur={() => handleBlurSave("momentTitle")}
                placeholder={t(
                  "user.workout.running.detail.addTitle",
                  "Add a title",
                )}
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
                    setDetails((current) => ({
                      ...current,
                      momentText: event.target.value,
                    }))
                  }
                  onBlur={() => handleBlurSave("momentText")}
                  placeholder={t(
                    "user.workout.running.detail.addText",
                    "Add text",
                  )}
                  className="min-h-[110px] w-full resize-none rounded-2xl border bg-background py-4 pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </ResultCard>

        <ResultCard>
          <h2 className="border-l-4 border-primary pl-3 text-xl font-semibold">
            {t(
              "user.workout.running.detail.trainingFeeling",
              "Training Feeling",
            )}
          </h2>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("user.workout.running.detail.easy", "Easy")}</span>
            <span>
              {t("user.workout.running.detail.exhausting", "Exhausting")}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {map([1, 2, 3, 4], (level) => (
              <Button
                key={level}
                type="button"
                variant={feelingLevel === level ? "default" : "outline"}
                className="h-14 rounded-2xl text-base font-semibold"
                onClick={() => handleFeeling(level)}
              >
                <FlameIcon className="size-5" aria-hidden="true" />x{level}
              </Button>
            ))}
          </div>
        </ResultCard>

        <Button
          type="button"
          className="w-full"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon className="size-5" aria-hidden="true" />
          {t(
            "user.workout.running.detail.deleteActivity",
            "Delete this activity",
          )}
        </Button>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t(
                  "user.workout.running.detail.deleteTitle",
                  "Activity o'chirilsinmi?",
                )}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "user.workout.running.detail.deleteDescription",
                  "Bu running activity, GPS route va workout loglardan butunlay o'chadi.",
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
              >
                {t("user.workout.running.detail.cancel", "Cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {t("user.workout.running.detail.delete", "Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default RunningDetailPage;
