import React from "react";
import { useTranslation } from "react-i18next";
import filter from "lodash/filter";
import flatMap from "lodash/flatMap";
import get from "lodash/get";
import map from "lodash/map";
import max from "lodash/max";
import size from "lodash/size";
import slice from "lodash/slice";
import toLower from "lodash/toLower";
import isArray from "lodash/isArray";
import reduce from "lodash/reduce";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import {
  DumbbellIcon,
  ExternalLinkIcon,
  PencilIcon,
  TrophyIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkoutMediaFallback from "./workout-media-fallback.jsx";

const normalizeName = (value) => toLower(trim(String(value || "")));

const isTrustedWorkoutVideoUrl = (value) => {
  if (!value) return false;

  try {
    const url = new URL(String(value));
    return (
      ["http:", "https:"].includes(url.protocol) &&
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "vimeo.com",
        "www.vimeo.com",
        "player.vimeo.com",
      ].includes(toLower(url.hostname))
    );
  } catch {
    return false;
  }
};

const getExerciseEquipment = (exercise, t) => {
  const equipments = isArray(get(exercise, "equipments"))
    ? get(exercise, "equipments")
    : [];
  const equipment = get(exercise, "equipment");

  if (equipments.length > 0) {
    return equipments.join(", ");
  }

  return equipment || t("user.workout.exerciseDetail.noEquipment");
};

const getInstructionParts = (exercise, t) => {
  const instructions = isArray(get(exercise, "instructions"))
    ? get(exercise, "instructions")
    : [];

  return {
    preparation:
      instructions[0] ||
      t("user.workout.exerciseDetail.defaultPreparation"),
    execution:
      instructions.length > 1
        ? slice(instructions, 1)
        : [t("user.workout.exerciseDetail.defaultExecution")],
  };
};

const buildExerciseRecords = (exercise, logs = []) => {
  if (!exercise) {
    return {
      entries: [],
      maxWeight: 0,
      maxReps: 0,
      totalSets: 0,
    };
  }

  const exerciseName = normalizeName(get(exercise, "name"));
  const exerciseId = get(exercise, "exerciseId") || get(exercise, "id");
  const matchingLogs = filter(logs, (log) => {
    const logExerciseId = get(log, "exerciseId") || get(log, "exercise.id");
    const logName = normalizeName(get(log, "name") || get(log, "exercise.name"));

    return (
      (exerciseId && String(logExerciseId) === String(exerciseId)) ||
      (exerciseName && logName === exerciseName)
    );
  });
  const entries = flatMap(matchingLogs, (log) =>
    map(get(log, "entries", []), (entry) => ({
      ...entry,
      date: get(log, "date"),
      exerciseName: get(log, "name") || get(log, "exercise.name"),
    })),
  );

  return {
    entries,
    maxWeight: max(map(entries, (entry) => toNumber(get(entry, "weight", 0)))) || 0,
    maxReps: max(map(entries, (entry) => toNumber(get(entry, "reps", 0)))) || 0,
    totalSets: reduce(entries, (sum, entry) => sum + (toNumber(get(entry, "sets", 1)) || 1), 0),
  };
};

const WorkoutExerciseDetailDrawer = ({
  open,
  onOpenChange,
  exercise,
  logs = [],
}) => {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState("instructions");
  const instructionParts = React.useMemo(
    () => getInstructionParts(exercise, t),
    [exercise, t],
  );
  const records = React.useMemo(
    () => buildExerciseRecords(exercise, logs),
    [exercise, logs],
  );
  const targetMuscles = isArray(get(exercise, "targetMuscles"))
    ? get(exercise, "targetMuscles")
    : [];
  const secondaryMuscles = isArray(get(exercise, "secondaryMuscles"))
    ? get(exercise, "secondaryMuscles")
    : [];
  const focusArea =
    filter([...targetMuscles, ...secondaryMuscles], Boolean).join(", ") ||
    get(exercise, "groupLabel") ||
    get(exercise, "category") ||
    t("user.workout.exerciseDetail.general");
  const videoUrl = get(exercise, "youtubeUrl");
  const hasVideo = isTrustedWorkoutVideoUrl(videoUrl);
  const recentRecords = slice(records.entries, 0, 4);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setTab("instructions");
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>
            {get(exercise, "name", t("user.workout.exerciseDetail.titleFallback"))}
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="px-5">
          <Tabs value={tab} onValueChange={setTab} className="gap-5">
            <TabsList variant="line" className="w-full justify-center gap-8">
              <TabsTrigger value="instructions" className="text-base font-black">
                {t("user.workout.exerciseDetail.instructions")}
              </TabsTrigger>
              <TabsTrigger value="records" className="text-base font-black">
                {t("user.workout.exerciseDetail.records")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instructions">
              <div className="flex flex-col gap-5">
                <div className="relative aspect-video overflow-hidden rounded-3xl border bg-muted/30">
                  <WorkoutMediaFallback
                    src={get(exercise, "imageUrl")}
                    alt={get(exercise, "name")}
                    label={t("user.workout.exerciseDetail.missingImage")}
                  />
                  {hasVideo ? (
                    <Button
                      asChild
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full"
                    >
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t("user.workout.exerciseDetail.viewVideo")}
                      >
                        <ExternalLinkIcon />
                      </a>
                    </Button>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-4 right-4 rounded-full bg-background/90"
                    >
                      {t("user.workout.exerciseDetail.noVideo")}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-2xl font-black leading-tight">
                    {get(exercise, "name")}
                  </h3>
                  <button
                    type="button"
                    className="flex h-12 items-center justify-between rounded-2xl bg-muted px-4 text-left text-sm text-muted-foreground"
                  >
                    <span>{t("user.workout.exerciseDetail.addNote")}</span>
                    <PencilIcon />
                  </button>
                </div>

                <div className="flex flex-col gap-3 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-black uppercase">
                      {t("user.workout.exerciseDetail.focusArea")}
                    </span>
                    <span>{focusArea}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-black uppercase">
                      {t("user.workout.exerciseDetail.equipment")}
                    </span>
                    <span>{getExerciseEquipment(exercise, t)}</span>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-lg font-black uppercase">
                      {t("user.workout.exerciseDetail.preparation")}
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {instructionParts.preparation}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-lg font-black uppercase">
                      {t("user.workout.exerciseDetail.execution")}
                    </h4>
                    <div className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
                      {map(instructionParts.execution, (step, index) => (
                        <p key={`${step}-${index}`}>{step}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="records">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("user.workout.exerciseDetail.maxKg")}
                    </p>
                    <p className="mt-1 text-lg font-black">{records.maxWeight}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("user.workout.exerciseDetail.maxReps")}
                    </p>
                    <p className="mt-1 text-lg font-black">{records.maxReps}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("user.workout.exerciseDetail.sets")}
                    </p>
                    <p className="mt-1 text-lg font-black">{records.totalSets}</p>
                  </div>
                </div>

                {size(recentRecords) > 0 ? (
                  <div className="flex flex-col gap-2">
                    {map(recentRecords, (entry, index) => (
                      <div
                        key={`${get(entry, "date")}-${index}`}
                        className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {get(entry, "date") ||
                              t("user.workout.exerciseDetail.session")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {get(entry, "reps", 0)} reps · {get(entry, "weight", 0)} kg
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {get(entry, "sets", 1)} set
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed bg-muted/20 px-5 py-10 text-center">
                    <TrophyIcon className="text-muted-foreground" />
                    <p className="font-semibold">
                      {t("user.workout.exerciseDetail.noRecordsTitle")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("user.workout.exerciseDetail.noRecordsDescription")}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DrawerBody>
        <DrawerFooter>
          <Button onClick={() => onOpenChange(false)}>
            <DumbbellIcon data-icon="inline-start" />
            {t("user.workout.exerciseDetail.done")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default WorkoutExerciseDetailDrawer;
