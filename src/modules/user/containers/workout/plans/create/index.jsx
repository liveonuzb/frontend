import React from "react";
import { filter, find, get, map, size, trim, uniqBy } from "lodash";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CheckIcon,
  ChevronLeftIcon,
  DumbbellIcon,
  ImageIcon,
  LoaderCircleIcon,
  MinusIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePostFileQuery } from "@/hooks/api";
import {
  useCreateWorkoutPlan,
  useGenerateWorkoutPlan,
  useWorkoutCatalog,
} from "@/hooks/app/use-workout-plans";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import {
  buildGenerateWorkoutPlanPayload,
  calculateOneRepMax,
  EQUIPMENT_MODES,
  getGeneratedPlanSavePayload,
  WORKOUT_GOALS,
  WORKOUT_LEVELS,
} from "../../workout-ai-flow";

const FALLBACK_EQUIPMENT = [
  { id: 1, name: "Barbell" },
  { id: 2, name: "Dumbbell" },
  { id: 3, name: "Cable Machine" },
  { id: 4, name: "Flat Bench" },
  { id: 5, name: "Lat Machine" },
  { id: 6, name: "Leg Press" },
];

const FALLBACK_MUSCLES = [
  { id: 1, name: "Chest" },
  { id: 2, name: "Back" },
  { id: 3, name: "Shoulder" },
  { id: 4, name: "Arms" },
  { id: 5, name: "Legs" },
  { id: 6, name: "Full Body" },
];

const BENCHMARK_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
];

const EQUIPMENT_TABS = [
  { value: "popular", label: "Popular" },
  { value: "free_weights", label: "Free Weights" },
  { value: "benches", label: "Bar & Benches" },
  { value: "machines", label: "Weight Machines" },
];

const normalizeCatalogItems = (items, fallback) =>
  get(items, "length") > 0
    ? map(items, (item) => ({
        ...item,
        id: Number(get(item, "id")),
        name: get(item, "name") || get(item, "title") || `#${get(item, "id")}`,
      }))
    : fallback;

const toggleId = (items, id) =>
  items.includes(id)
    ? filter(items, (itemId) => itemId !== id)
    : [...items, id];

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const resolveGeneratedPlan = (preview, fallbackCoverImageUrl = null) => {
  const plan = get(preview, "plan", preview);
  const generationMeta = get(preview, "generationMeta", get(plan, "generationMeta"));

  return {
    ...plan,
    coverImageUrl:
      get(plan, "coverImageUrl") ||
      get(generationMeta, "coverImageUrl") ||
      fallbackCoverImageUrl ||
      null,
    generationMeta: generationMeta ?? get(plan, "generationMeta", null),
  };
};

const getEquipmentTab = (item) => {
  const name = String(get(item, "name", "")).toLowerCase();

  if (
    name.includes("barbell") ||
    name.includes("dumbbell") ||
    name.includes("kettlebell") ||
    name.includes("ez")
  ) {
    return "free_weights";
  }
  if (name.includes("bench") || name.includes("bar")) {
    return "benches";
  }
  if (
    name.includes("machine") ||
    name.includes("smith") ||
    name.includes("press") ||
    name.includes("cable") ||
    name.includes("lat") ||
    name.includes("pec")
  ) {
    return "machines";
  }

  return "popular";
};

const filterEquipmentByTab = (items, tab) =>
  tab === "popular"
    ? items
    : filter(items, (item) => getEquipmentTab(item) === tab);

const buildCoverOptions = (catalog, initialPlan) => {
  const exerciseImages = filter(
    map(get(catalog, "exercises", []), (exercise) => ({
      id: `exercise-${get(exercise, "id")}`,
      label: get(exercise, "name", "Workout"),
      url: get(exercise, "imageUrl"),
    })),
    (item) => Boolean(get(item, "url")),
  );
  const initialCover = get(initialPlan, "coverImageUrl")
    ? [
        {
          id: "initial-cover",
          label: get(initialPlan, "name", "Tanlangan rasm"),
          url: get(initialPlan, "coverImageUrl"),
        },
      ]
    : [];

  return uniqBy([...initialCover, ...exerciseImages], "url").slice(0, 12);
};

const PlanCoverPicker = ({
  value,
  options,
  isUploading,
  onChange,
  onRemove,
  onUpload,
}) => {
  const inputRef = React.useRef(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>Cover rasm</FieldLabel>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2Icon data-icon="inline-start" />
            O'chirish
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-muted/30 text-left transition hover:border-primary/50 hover:bg-primary/5"
      >
        {value ? (
          <img src={value} alt="Plan cover" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            {isUploading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <ImageIcon />
            )}
            <span className="text-sm font-semibold">
              {isUploading ? "Yuklanmoqda..." : "Custom rasm yuklash"}
            </span>
          </span>
        )}
        {value ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition group-hover:opacity-100">
            <UploadIcon />
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
      />

      {size(options) > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {map(options, (option) => {
            const selected = value === get(option, "url");

            return (
              <button
                key={get(option, "id")}
                type="button"
                onClick={() => onChange(get(option, "url"))}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl border bg-muted",
                  selected && "border-primary ring-2 ring-primary/20",
                )}
                aria-label={`${get(option, "label")} rasmini tanlash`}
              >
                <img
                  src={get(option, "url")}
                  alt={get(option, "label")}
                  className="size-full object-cover"
                  loading="lazy"
                />
                {selected ? (
                  <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Katalogda cover rasm topilmadi. Custom rasm yuklashingiz mumkin.
        </p>
      )}
    </div>
  );
};

const CreatePlanMetaDrawer = ({
  open,
  meta,
  coverOptions,
  isUploading,
  isSubmitting,
  onMetaChange,
  onUploadCover,
  onOpenChange,
  onCreate,
  onCreateWithAi,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Yangi workout plan</DrawerTitle>
        <DrawerDescription>
          Reja nomi, izohi va cover rasmini tanlang.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="create-plan-name">Plan nomi</FieldLabel>
            <Input
              id="create-plan-name"
              value={meta.name}
              onChange={(event) =>
                onMetaChange({ ...meta, name: event.target.value })
              }
              placeholder="Masalan: My Upper Body Day"
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="create-plan-description">Izoh</FieldLabel>
            <Textarea
              id="create-plan-description"
              value={meta.description}
              onChange={(event) =>
                onMetaChange({ ...meta, description: event.target.value })
              }
              placeholder="Reja maqsadi yoki qisqa tavsif"
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <PlanCoverPicker
              value={meta.coverImageUrl}
              options={coverOptions}
              isUploading={isUploading}
              onChange={(coverImageUrl) =>
                onMetaChange({ ...meta, coverImageUrl })
              }
              onRemove={() => onMetaChange({ ...meta, coverImageUrl: "" })}
              onUpload={onUploadCover}
            />
          </Field>
        </FieldGroup>
      </DrawerBody>
      <DrawerFooter className="sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCreateWithAi}
          disabled={isSubmitting || isUploading}
        >
          <SparklesIcon data-icon="inline-start" />
          AI bilan yaratish
        </Button>
        <Button
          type="button"
          onClick={onCreate}
          disabled={isSubmitting || isUploading}
        >
          <PlusIcon data-icon="inline-start" />
          Create
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

const AiPlanSetupDrawer = ({
  open,
  form,
  onFormChange,
  onOpenChange,
  onBack,
  onNext,
}) => {
  const update = (key, value) => onFormChange({ ...form, [key]: value });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>AI plan sozlamalari</DrawerTitle>
          <DrawerDescription>
            Maqsad, daraja va haftalik ritmni tanlang.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <FieldGroup className="gap-5">
            <FieldSet>
              <FieldLegend>Maqsad</FieldLegend>
              <ToggleGroup
                type="single"
                value={form.goal}
                onValueChange={(value) => value && update("goal", value)}
                variant="outline"
                className="flex-wrap justify-start"
              >
                {map(WORKOUT_GOALS, (goal) => (
                  <ToggleGroupItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Daraja</FieldLegend>
              <ToggleGroup
                type="single"
                value={form.level}
                onValueChange={(value) => value && update("level", value)}
                variant="outline"
                className="flex-wrap justify-start"
              >
                {map(WORKOUT_LEVELS, (level) => (
                  <ToggleGroupItem key={level.value} value={level.value}>
                    {level.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Plan davomiyligi</FieldLabel>
                <div className="flex items-center rounded-4xl border bg-input/30">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Plan kunlarini kamaytirish"
                    onClick={() => update("days", Math.max(7, Number(form.days) - 7))}
                  >
                    <MinusIcon />
                  </Button>
                  <div className="flex-1 text-center text-sm font-semibold">
                    {form.days} kun
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Plan kunlarini oshirish"
                    onClick={() => update("days", Math.min(365, Number(form.days) + 7))}
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel>Haftasiga kun</FieldLabel>
                <div className="flex items-center rounded-4xl border bg-input/30">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Haftalik kunlarni kamaytirish"
                    onClick={() =>
                      update("daysPerWeek", Math.max(1, Number(form.daysPerWeek) - 1))
                    }
                  >
                    <MinusIcon />
                  </Button>
                  <div className="flex-1 text-center text-sm font-semibold">
                    {form.daysPerWeek} kun
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Haftalik kunlarni oshirish"
                    onClick={() =>
                      update("daysPerWeek", Math.min(7, Number(form.daysPerWeek) + 1))
                    }
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </Field>
            </div>

            <FieldSet>
              <FieldLegend>Uskuna</FieldLegend>
              <ToggleGroup
                type="single"
                value={form.equipmentMode}
                onValueChange={(value) => value && update("equipmentMode", value)}
                variant="outline"
                className="flex-wrap justify-start"
              >
                {map(EQUIPMENT_MODES, (mode) => (
                  <ToggleGroupItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
          </FieldGroup>
        </DrawerBody>
        <DrawerFooter className="sm:flex-row">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeftIcon data-icon="inline-start" />
            Orqaga
          </Button>
          <Button type="button" onClick={onNext}>
            Keyingi
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const AiEquipmentDrawer = ({
  open,
  equipment,
  selectedIds,
  onToggle,
  onOpenChange,
  onBack,
  onNext,
}) => {
  const [tab, setTab] = React.useState("popular");
  const visibleItems = React.useMemo(
    () => filterEquipmentByTab(equipment, tab),
    [equipment, tab],
  );
  const selectedItems = React.useMemo(
    () => filter(equipment, (item) => selectedIds.includes(get(item, "id"))),
    [equipment, selectedIds],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[94vh]">
        <DrawerHeader>
          <DrawerTitle>Jihozlarni tanlang</DrawerTitle>
          <DrawerDescription>
            AI faqat siz tanlagan jihozlarga mos mashqlarni taklif qiladi.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="px-0">
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <div className="overflow-x-auto px-4">
              <TabsList>
                {map(EQUIPMENT_TABS, (item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <div className="flex flex-col gap-3 px-4 pb-4">
            {map(visibleItems, (item) => {
              const checked = selectedIds.includes(get(item, "id"));

              return (
                <button
                  key={get(item, "id")}
                  type="button"
                  onClick={() => onToggle(get(item, "id"))}
                  className={cn(
                    "flex min-h-20 items-center gap-3 rounded-3xl border bg-card px-4 py-3 text-left shadow-sm transition",
                    checked && "border-primary bg-primary/5",
                  )}
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted/50">
                    {get(item, "imageUrl") ? (
                      <img
                        src={get(item, "imageUrl")}
                        alt={get(item, "name")}
                        className="size-full rounded-2xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <DumbbellIcon className="text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-base font-bold">
                    {get(item, "name")}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    {checked ? <CheckIcon className="size-3" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </DrawerBody>
        <DrawerFooter>
          <div className="flex items-center justify-between gap-3 rounded-3xl border bg-card px-3 py-2">
            <div className="flex min-w-0 items-center gap-1">
              {map(selectedItems.slice(0, 5), (item) => (
                <span
                  key={get(item, "id")}
                  className="flex size-10 items-center justify-center rounded-xl bg-muted/60"
                >
                  {get(item, "imageUrl") ? (
                    <img
                      src={get(item, "imageUrl")}
                      alt={get(item, "name")}
                      className="size-full rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <DumbbellIcon className="text-muted-foreground" />
                  )}
                </span>
              ))}
            </div>
            <Badge variant="secondary">{size(selectedIds)} Selected</Badge>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeftIcon data-icon="inline-start" />
              Orqaga
            </Button>
            <Button type="button" onClick={onNext}>
              Keyingi
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const AiMuscleGroupDrawer = ({
  open,
  muscles,
  selectedIds,
  onToggle,
  onOpenChange,
  onBack,
  onNext,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Muscle group tanlang</DrawerTitle>
        <DrawerDescription>
          Kamida bitta fokus mushak guruhini tanlang.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        <div className="grid gap-3 sm:grid-cols-2">
          {map(muscles, (item) => {
            const checked = selectedIds.includes(get(item, "id"));

            return (
              <button
                key={`${get(item, "type", "muscle")}-${get(item, "id")}`}
                type="button"
                onClick={() => onToggle(get(item, "id"))}
                className={cn(
                  "flex items-center gap-3 rounded-3xl border bg-card px-4 py-4 text-left shadow-sm transition",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-muted/60 font-black">
                  {String(get(item, "name", "?")).slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{get(item, "name")}</span>
                  <span className="text-xs text-muted-foreground">Focus area</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {checked ? <CheckIcon className="size-3" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </DrawerBody>
      <DrawerFooter className="sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeftIcon data-icon="inline-start" />
          Orqaga
        </Button>
        <Button type="button" onClick={onNext}>
          Keyingi
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

const AiOneRepMaxDrawer = ({
  open,
  form,
  exercises,
  oneRepMaxKg,
  isGenerating,
  onFormChange,
  onOpenChange,
  onBack,
  onGenerate,
}) => {
  const update = (key, value) => onFormChange({ ...form, [key]: value });
  const selectedExercise = find(
    exercises,
    (exercise) => get(exercise, "name") === form.benchmarkExercise,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>My 1RM</DrawerTitle>
          <DrawerDescription>
            Kuch ma'lumoti AI rejaning og'irliklarini moslashtiradi.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <FieldGroup className="gap-5">
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-3xl bg-muted/40">
              {get(selectedExercise, "imageUrl") ? (
                <img
                  src={get(selectedExercise, "imageUrl")}
                  alt={form.benchmarkExercise}
                  className="size-full object-contain"
                  loading="lazy"
                />
              ) : (
                <DumbbellIcon className="text-muted-foreground" />
              )}
            </div>

            <Field>
              <FieldLabel>Benchmark</FieldLabel>
              <Select
                value={form.benchmarkExercise}
                onValueChange={(value) => update("benchmarkExercise", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Mashq tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {map(BENCHMARK_EXERCISES, (exerciseName) => (
                      <SelectItem key={exerciseName} value={exerciseName}>
                        {exerciseName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ai-benchmark-weight">When lifting</FieldLabel>
                <Input
                  id="ai-benchmark-weight"
                  type="number"
                  min="0"
                  value={form.benchmarkWeight}
                  onChange={(event) => update("benchmarkWeight", event.target.value)}
                />
                <FieldDescription>kg</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ai-benchmark-reps">Till tired, I can do</FieldLabel>
                <Input
                  id="ai-benchmark-reps"
                  type="number"
                  min="1"
                  max="30"
                  value={form.benchmarkReps}
                  onChange={(event) => update("benchmarkReps", event.target.value)}
                />
                <FieldDescription>reps</FieldDescription>
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-3xl border bg-card px-4 py-4">
              <div>
                <p className="font-bold">Your 1RM</p>
                <p className="text-sm text-muted-foreground">
                  {form.benchmarkExercise}
                </p>
              </div>
              <p className="text-2xl font-black tabular-nums">{oneRepMaxKg} kg</p>
            </div>
          </FieldGroup>
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            onClick={() => onGenerate(true)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            Generate
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isGenerating}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Orqaga
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onGenerate(false)}
              disabled={isGenerating}
            >
              1RM ni o'tkazib yuborish
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const AiPreviewCard = ({
  plan,
  isSaving,
  isGenerating,
  onSave,
  onRegenerate,
  onEditManual,
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{get(plan, "name", "AI workout reja")}</CardTitle>
      <CardDescription>
        {get(plan, "description") || "AI orqali yaratilgan preview."}
      </CardDescription>
      <CardAction>
        <Badge variant="secondary">
          <SparklesIcon />
          AI preview
        </Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-3xl border bg-muted/30">
          {get(plan, "coverImageUrl") ? (
            <img
              src={get(plan, "coverImageUrl")}
              alt={get(plan, "name", "AI workout reja")}
              className="aspect-video size-full object-cover lg:aspect-square"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center lg:aspect-square">
              <DumbbellIcon className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-muted/40 px-3 py-3">
              <p className="font-black">{get(plan, "days", 28)}</p>
              <p className="text-xs text-muted-foreground">kun</p>
            </div>
            <div className="rounded-2xl bg-muted/40 px-3 py-3">
              <p className="font-black">{get(plan, "daysPerWeek", 4)}</p>
              <p className="text-xs text-muted-foreground">kun/hafta</p>
            </div>
            <div className="rounded-2xl bg-muted/40 px-3 py-3">
              <p className="font-black">
                {get(plan, "totalExercises", size(get(plan, "schedule", [])))}
              </p>
              <p className="text-xs text-muted-foreground">mashq</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {map(get(plan, "schedule", []).slice(0, 7), (day, index) => (
              <div
                key={`${get(day, "day")}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border bg-background px-3 py-2 text-sm"
              >
                <span className="font-semibold">
                  {get(day, "day", `DAY ${index + 1}`)} · {get(day, "focus", "Workout")}
                </span>
                <Badge variant="outline">
                  {size(get(day, "exercises", []))} mashq
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex-col gap-2 sm:flex-row">
      <Button type="button" onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
        ) : (
          <SaveIcon data-icon="inline-start" />
        )}
        Save plan
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onRegenerate}
        disabled={isGenerating}
      >
        <SparklesIcon data-icon="inline-start" />
        Regenerate
      </Button>
      <Button type="button" variant="ghost" onClick={onEditManual}>
        Builderda tahrirlash
      </Button>
    </CardFooter>
  </Card>
);

const CreateWorkoutPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const initialPlan = get(location, "state.initialPlan", null);
  const createPlanMutation = useCreateWorkoutPlan();
  const generateMutation = useGenerateWorkoutPlan();
  const uploadMutation = usePostFileQuery({});
  const { catalog } = useWorkoutCatalog();
  const equipmentOptions = React.useMemo(
    () =>
      normalizeCatalogItems(
        get(catalog, "equipments", get(catalog, "equipment", [])),
        FALLBACK_EQUIPMENT,
      ),
    [catalog],
  );
  const muscleOptions = React.useMemo(() => {
    const muscles = normalizeCatalogItems(get(catalog, "muscles", []), []);
    const bodyParts = normalizeCatalogItems(get(catalog, "bodyParts", []), []);
    const items = size(muscles) > 0 ? muscles : bodyParts;

    return size(items) > 0 ? items : FALLBACK_MUSCLES;
  }, [catalog]);
  const coverOptions = React.useMemo(
    () => buildCoverOptions(catalog, initialPlan),
    [catalog, initialPlan],
  );
  const benchmarkCatalog = React.useMemo(
    () => get(catalog, "exercises", []),
    [catalog],
  );
  const [metaDrawerOpen, setMetaDrawerOpen] = React.useState(true);
  const [aiSetupOpen, setAiSetupOpen] = React.useState(false);
  const [equipmentOpen, setEquipmentOpen] = React.useState(false);
  const [muscleOpen, setMuscleOpen] = React.useState(false);
  const [oneRmOpen, setOneRmOpen] = React.useState(false);
  const [aiPreview, setAiPreview] = React.useState(null);
  const hasSeededCatalog = React.useRef(false);
  const [planMeta, setPlanMeta] = React.useState({
    name: get(initialPlan, "name", ""),
    description: get(initialPlan, "description", ""),
    coverImageUrl: get(initialPlan, "coverImageUrl", ""),
  });
  const [aiForm, setAiForm] = React.useState({
    goal: "muscle_building",
    level: "beginner",
    days: Number(get(initialPlan, "days", 28)) || 28,
    daysPerWeek: Number(get(initialPlan, "daysPerWeek", 4)) || 4,
    equipmentMode: "gym",
    selectedEquipmentIds: [],
    focusMuscleIds: [],
    benchmarkExercise: "Bench Press",
    benchmarkWeight: 40,
    benchmarkReps: 5,
    caloriesGoal: 2400,
  });
  const oneRepMaxKg = calculateOneRepMax(
    get(aiForm, "benchmarkWeight"),
    get(aiForm, "benchmarkReps"),
  );
  const isSubmitting =
    createPlanMutation.isPending ||
    generateMutation.isPending ||
    uploadMutation.isPending;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
      { url: "/user/workout/plans/create", title: "Yangi reja" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    if (hasSeededCatalog.current) return;
    if (size(equipmentOptions) === 0 || size(muscleOptions) === 0) return;

    hasSeededCatalog.current = true;
    setAiForm((current) => ({
      ...current,
      selectedEquipmentIds: map(equipmentOptions.slice(0, 4), "id"),
      focusMuscleIds: map(muscleOptions.slice(0, 2), "id"),
    }));
  }, [equipmentOptions, muscleOptions]);

  const validatePlanName = () => {
    if (!trim(planMeta.name)) {
      toast.error("Reja nomini kiriting");
      return false;
    }

    return true;
  };

  const handleCoverUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "workout-plans");

      const response = await uploadMutation.mutateAsync({
        url: "/user/media/upload",
        attributes: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
      const payload = getResponsePayload(response);
      const coverImageUrl = get(payload, "url");

      if (!coverImageUrl) {
        toast.error("Rasm yuklab bo'lmadi");
        return;
      }

      setPlanMeta((current) => ({ ...current, coverImageUrl }));
      toast.success("Cover rasm yuklandi");
    } catch {
      toast.error("Rasm yuklab bo'lmadi");
    }
  };

  const createDraftAndOpenBuilder = async () => {
    if (!validatePlanName()) return;

    try {
      const source = get(initialPlan, "isTemplate")
        ? "template"
        : get(initialPlan, "source", "manual");
      const createdPlan = await createPlanMutation.createPlan({
        name: trim(planMeta.name),
        description: trim(planMeta.description),
        coverImageUrl: planMeta.coverImageUrl || undefined,
        days: Number(get(initialPlan, "days", 28)) || 28,
        daysPerWeek: Number(get(initialPlan, "daysPerWeek", 0)) || 0,
        difficulty: get(initialPlan, "difficulty"),
        schedule: Array.isArray(get(initialPlan, "schedule"))
          ? get(initialPlan, "schedule")
          : [],
        source,
      });

      toast.success("Workout reja yaratildi");
      navigate(`/user/workout/plans/edit/${get(createdPlan, "id")}`, {
        replace: true,
        state: {
          initialPlan: createdPlan,
          shouldActivateOnSave: true,
        },
      });
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Workout rejani yaratib bo'lmadi",
      );
    }
  };

  const startAiFlow = () => {
    if (!validatePlanName()) return;

    setMetaDrawerOpen(false);
    setAiPreview(null);
    setAiSetupOpen(true);
  };

  const goFromSetup = () => {
    setAiSetupOpen(false);
    if (get(aiForm, "equipmentMode") === "bodyweight") {
      setMuscleOpen(true);
    } else {
      setEquipmentOpen(true);
    }
  };

  const goFromEquipment = () => {
    if (size(get(aiForm, "selectedEquipmentIds", [])) === 0) {
      toast.error("Kamida bitta jihoz tanlang");
      return;
    }

    setEquipmentOpen(false);
    setMuscleOpen(true);
  };

  const goFromMuscle = () => {
    if (size(get(aiForm, "focusMuscleIds", [])) === 0) {
      toast.error("Kamida bitta muscle group tanlang");
      return;
    }

    setMuscleOpen(false);
    setOneRmOpen(true);
  };

  const handleGenerate = async (benchmarkEnabled) => {
    if (benchmarkEnabled && oneRepMaxKg <= 0) {
      toast.error("1RM uchun og'irlik va reps kiriting");
      return;
    }

    try {
      const preview = await generateMutation.generatePlan(
        buildGenerateWorkoutPlanPayload({
          ...aiForm,
          name: planMeta.name,
          coverImageUrl: planMeta.coverImageUrl,
          benchmarkEnabled,
        }),
      );
      const generatedPlan = resolveGeneratedPlan(preview, planMeta.coverImageUrl);

      setAiPreview(generatedPlan);
      setOneRmOpen(false);
      toast.success("AI workout reja tayyor");
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "AI workout reja yaratib bo'lmadi",
      );
    }
  };

  const handleSavePreview = async () => {
    if (!aiPreview) return;

    try {
      const createdPlan = await createPlanMutation.createPlan({
        ...getGeneratedPlanSavePayload(aiPreview),
        coverImageUrl: get(aiPreview, "coverImageUrl") || planMeta.coverImageUrl || undefined,
      });
      toast.success("AI workout reja saqlandi");
      navigate(`/user/workout/plans/${get(createdPlan, "id")}`, {
        replace: true,
      });
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "AI workout rejani saqlab bo'lmadi",
      );
    }
  };

  return (
    <PageTransition mode="slide-up">
      <div className="min-h-[60svh]">
        {aiPreview ? (
          <AiPreviewCard
            plan={aiPreview}
            isSaving={createPlanMutation.isPending}
            isGenerating={generateMutation.isPending}
            onSave={handleSavePreview}
            onRegenerate={() => setAiSetupOpen(true)}
            onEditManual={async () => {
              if (!aiPreview) return;

              try {
                const createdPlan = await createPlanMutation.createPlan({
                  ...getGeneratedPlanSavePayload(aiPreview),
                  coverImageUrl:
                    get(aiPreview, "coverImageUrl") ||
                    planMeta.coverImageUrl ||
                    undefined,
                });

                navigate(`/user/workout/plans/edit/${get(createdPlan, "id")}`, {
                  replace: true,
                  state: {
                    initialPlan: createdPlan,
                    shouldActivateOnSave: true,
                  },
                });
              } catch (error) {
                toast.error(
                  get(error, "response.data.message") ||
                    "Workout rejani yaratib bo'lmadi",
                );
              }
            }}
          />
        ) : (
          <div aria-hidden="true" />
        )}

        {metaDrawerOpen ? (
          <CreatePlanMetaDrawer
            open={metaDrawerOpen}
            meta={planMeta}
            coverOptions={coverOptions}
            isUploading={uploadMutation.isPending}
            isSubmitting={isSubmitting}
            onMetaChange={setPlanMeta}
            onUploadCover={handleCoverUpload}
            onOpenChange={(open) => {
              setMetaDrawerOpen(open);
              if (!open && !aiSetupOpen && !equipmentOpen && !muscleOpen && !oneRmOpen) {
                navigate("/user/workout/plans", { replace: true });
              }
            }}
            onCreate={createDraftAndOpenBuilder}
            onCreateWithAi={startAiFlow}
          />
        ) : null}

        {aiSetupOpen ? (
          <AiPlanSetupDrawer
            open={aiSetupOpen}
            form={aiForm}
            onFormChange={setAiForm}
            onOpenChange={setAiSetupOpen}
            onBack={() => {
              setAiSetupOpen(false);
              setMetaDrawerOpen(true);
            }}
            onNext={goFromSetup}
          />
        ) : null}

        {equipmentOpen ? (
          <AiEquipmentDrawer
            open={equipmentOpen}
            equipment={equipmentOptions}
            selectedIds={get(aiForm, "selectedEquipmentIds", [])}
            onToggle={(id) =>
              setAiForm((current) => ({
                ...current,
                selectedEquipmentIds: toggleId(
                  get(current, "selectedEquipmentIds", []),
                  id,
                ),
              }))
            }
            onOpenChange={setEquipmentOpen}
            onBack={() => {
              setEquipmentOpen(false);
              setAiSetupOpen(true);
            }}
            onNext={goFromEquipment}
          />
        ) : null}

        {muscleOpen ? (
          <AiMuscleGroupDrawer
            open={muscleOpen}
            muscles={muscleOptions}
            selectedIds={get(aiForm, "focusMuscleIds", [])}
            onToggle={(id) =>
              setAiForm((current) => ({
                ...current,
                focusMuscleIds: toggleId(get(current, "focusMuscleIds", []), id),
              }))
            }
            onOpenChange={setMuscleOpen}
            onBack={() => {
              setMuscleOpen(false);
              if (get(aiForm, "equipmentMode") === "bodyweight") {
                setAiSetupOpen(true);
              } else {
                setEquipmentOpen(true);
              }
            }}
            onNext={goFromMuscle}
          />
        ) : null}

        {oneRmOpen ? (
          <AiOneRepMaxDrawer
            open={oneRmOpen}
            form={aiForm}
            exercises={benchmarkCatalog}
            oneRepMaxKg={oneRepMaxKg}
            isGenerating={generateMutation.isPending}
            onFormChange={setAiForm}
            onOpenChange={setOneRmOpen}
            onBack={() => {
              setOneRmOpen(false);
              setMuscleOpen(true);
            }}
            onGenerate={handleGenerate}
          />
        ) : null}
      </div>
    </PageTransition>
  );
};

export default CreateWorkoutPlanPage;
