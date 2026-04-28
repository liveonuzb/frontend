import React from "react";
import { filter, flatMap, get, map, max, size, slice, toLower } from "lodash";
import {
  DumbbellIcon,
  ExternalLinkIcon,
  ImageIcon,
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

const normalizeName = (value) => toLower(String(value || "").trim());

const getExerciseEquipment = (exercise) => {
  const equipments = Array.isArray(get(exercise, "equipments"))
    ? get(exercise, "equipments")
    : [];
  const equipment = get(exercise, "equipment");

  if (equipments.length > 0) {
    return equipments.join(", ");
  }

  return equipment || "Zarur emas";
};

const getInstructionParts = (exercise) => {
  const instructions = Array.isArray(get(exercise, "instructions"))
    ? get(exercise, "instructions")
    : [];

  return {
    preparation:
      instructions[0] ||
      "Mashqni boshlashdan oldin holatingizni barqaror qiling va nafasni nazorat qiling.",
    execution:
      instructions.length > 1
        ? instructions.slice(1)
        : ["Harakatni nazorat bilan bajaring va set davomida texnikani saqlang."],
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
    maxWeight: max(map(entries, (entry) => Number(get(entry, "weight", 0)))) || 0,
    maxReps: max(map(entries, (entry) => Number(get(entry, "reps", 0)))) || 0,
    totalSets: entries.reduce(
      (sum, entry) => sum + (Number(get(entry, "sets", 1)) || 1),
      0,
    ),
  };
};

const WorkoutExerciseDetailDrawer = ({
  open,
  onOpenChange,
  exercise,
  logs = [],
}) => {
  const [tab, setTab] = React.useState("instructions");
  const instructionParts = React.useMemo(
    () => getInstructionParts(exercise),
    [exercise],
  );
  const records = React.useMemo(
    () => buildExerciseRecords(exercise, logs),
    [exercise, logs],
  );
  const targetMuscles = Array.isArray(get(exercise, "targetMuscles"))
    ? get(exercise, "targetMuscles")
    : [];
  const secondaryMuscles = Array.isArray(get(exercise, "secondaryMuscles"))
    ? get(exercise, "secondaryMuscles")
    : [];
  const focusArea =
    [...targetMuscles, ...secondaryMuscles].filter(Boolean).join(", ") ||
    get(exercise, "groupLabel") ||
    get(exercise, "category") ||
    "Umumiy";
  const hasImage = Boolean(get(exercise, "imageUrl"));
  const hasVideo = Boolean(get(exercise, "youtubeUrl"));
  const recentRecords = slice(records.entries, 0, 4);

  React.useEffect(() => {
    if (open) {
      setTab("instructions");
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
        <DrawerHeader>
          <DrawerTitle>{get(exercise, "name", "Mashq ma'lumotlari")}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="px-5">
          <Tabs value={tab} onValueChange={setTab} className="gap-5">
            <TabsList variant="line" className="w-full justify-center gap-8">
              <TabsTrigger value="instructions" className="text-base font-black">
                Instructions
              </TabsTrigger>
              <TabsTrigger value="records" className="text-base font-black">
                Records
              </TabsTrigger>
            </TabsList>

            <TabsContent value="instructions">
              <div className="flex flex-col gap-5">
                <div className="relative aspect-video overflow-hidden rounded-3xl border bg-muted/30">
                  {hasImage ? (
                    <img
                      src={get(exercise, "imageUrl")}
                      alt={get(exercise, "name")}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon />
                      <span className="text-sm font-medium">Mashq rasmi yo'q</span>
                    </div>
                  )}
                  {hasVideo ? (
                    <Button
                      asChild
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full"
                    >
                      <a
                        href={get(exercise, "youtubeUrl")}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Video ko'rish"
                      >
                        <ExternalLinkIcon />
                      </a>
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="text-2xl font-black leading-tight">
                    {get(exercise, "name")}
                  </h3>
                  <button
                    type="button"
                    className="flex h-12 items-center justify-between rounded-2xl bg-muted px-4 text-left text-sm text-muted-foreground"
                  >
                    <span>Add note</span>
                    <PencilIcon />
                  </button>
                </div>

                <div className="flex flex-col gap-3 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-black uppercase">Focus area</span>
                    <span>{focusArea}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-black uppercase">Equipment</span>
                    <span>{getExerciseEquipment(exercise)}</span>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-lg font-black uppercase">Preparation</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {instructionParts.preparation}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-lg font-black uppercase">Execution</h4>
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
                  <div className="rounded-2xl bg-muted/40 px-3 py-3">
                    <p className="text-xs text-muted-foreground">Max kg</p>
                    <p className="mt-1 text-lg font-black">{records.maxWeight}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 px-3 py-3">
                    <p className="text-xs text-muted-foreground">Max reps</p>
                    <p className="mt-1 text-lg font-black">{records.maxReps}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 px-3 py-3">
                    <p className="text-xs text-muted-foreground">Sets</p>
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
                          <p className="font-semibold">{get(entry, "date") || "Session"}</p>
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
                    <p className="font-semibold">Hali record yo'q</p>
                    <p className="text-sm text-muted-foreground">
                      Sessiya tugagandan so'ng natijalar shu yerda ko'rinadi.
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
            Done
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default WorkoutExerciseDetailDrawer;
