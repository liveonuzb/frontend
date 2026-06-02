import React from "react";
import { useTranslation } from "react-i18next";
import filter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import take from "lodash/take";
import trim from "lodash/trim";
import uniqBy from "lodash/uniqBy";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
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
  FieldError,
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
import { getApiErrorMessage } from "@/lib/api-response";
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

const getWorkoutFormErrorMessage = (error, fallback) =>
  get(error, "response") ? getApiErrorMessage(error, fallback) : fallback;

const getOptionLabel = (option, t) =>
  get(option, "labelKey")
    ? t(get(option, "labelKey"))
    : get(option, "label", "");

const EQUIPMENT_TABS = [
  { value: "popular", labelKey: "user.workout.planCreate.equipmentTabs.popular" },
  {
    value: "free_weights",
    labelKey: "user.workout.planCreate.equipmentTabs.freeWeights",
  },
  { value: "benches", labelKey: "user.workout.planCreate.equipmentTabs.benches" },
  { value: "machines", labelKey: "user.workout.planCreate.equipmentTabs.machines" },
];

const normalizeCatalogItems = (items, fallback) =>
  get(items, "length") > 0
    ? map(items, (item) => ({
        ...item,
        id: toNumber(get(item, "id")),
        name: get(item, "name") || get(item, "title") || `#${get(item, "id")}`,
      }))
    : fallback;

const toggleId = (items, id) =>
  includes(items, id)
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
  const name = toLower(String(get(item, "name", "")));

  if (
    includes(name, "barbell") ||
    includes(name, "dumbbell") ||
    includes(name, "kettlebell") ||
    includes(name, "ez")
  ) {
    return "free_weights";
  }
  if (includes(name, "bench") || includes(name, "bar")) {
    return "benches";
  }
  if (
    includes(name, "machine") ||
    includes(name, "smith") ||
    includes(name, "press") ||
    includes(name, "cable") ||
    includes(name, "lat") ||
    includes(name, "pec")
  ) {
    return "machines";
  }

  return "popular";
};

const filterEquipmentByTab = (items, tab) =>
  tab === "popular"
    ? items
    : filter(items, (item) => getEquipmentTab(item) === tab);

const buildCoverOptions = (catalog, initialPlan, t) => {
  const exerciseImages = filter(
    map(get(catalog, "exercises", []), (exercise) => ({
      id: `exercise-${get(exercise, "id")}`,
      label: get(exercise, "name", t("user.workout.planCreate.fallbacks.workout")),
      url: get(exercise, "imageUrl"),
    })),
    (item) => Boolean(get(item, "url")),
  );
  const initialCover = get(initialPlan, "coverImageUrl")
    ? [
        {
          id: "initial-cover",
          label: get(
            initialPlan,
            "name",
            t("user.workout.planCreate.fallbacks.selectedImage"),
          ),
          url: get(initialPlan, "coverImageUrl"),
        },
      ]
    : [];

  return take(uniqBy([...initialCover, ...exerciseImages], "url"), 12);
};

const PlanCoverPicker = ({
  value,
  options,
  isUploading,
  error,
  onChange,
  onRemove,
  onUpload,
  t,
}) => {
  const inputRef = React.useRef(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{t("user.workout.planCreate.cover.label")}</FieldLabel>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2Icon data-icon="inline-start" />
            {t("user.workout.planCreate.actions.delete")}
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-muted/30 text-left transition hover:border-primary/50 hover:bg-primary/5"
      >
        {value ? (
          <img
            src={value}
            alt={t("user.workout.planCreate.cover.alt")}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            {isUploading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <ImageIcon />
            )}
            <span className="text-sm font-semibold">
              {isUploading
                ? t("user.workout.planCreate.cover.uploading")
                : t("user.workout.planCreate.cover.uploadCustom")}
            </span>
          </span>
        )}
        {value ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition group-hover:opacity-100">
            <UploadIcon />
          </span>
        ) : null}
      </button>
      {error ? <FieldError>{error}</FieldError> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Mashg'ulot rejasi rasmi faylini tanlash"
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
                aria-label={t("user.workout.planCreate.cover.selectAria", {
                  label: get(option, "label"),
                })}
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
          {t("user.workout.planCreate.cover.empty")}
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
  nameError,
  coverError,
  onMetaChange,
  onUploadCover,
  onOpenChange,
  onCreate,
  onCreateWithAi,
  t,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader>
        <DrawerTitle>{t("user.workout.planCreate.meta.title")}</DrawerTitle>
        <DrawerDescription>
          {t("user.workout.planCreate.meta.description")}
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="create-plan-name">
              {t("user.workout.planCreate.meta.nameLabel")}
            </FieldLabel>
            <Input
              id="create-plan-name"
              value={meta.name}
              aria-invalid={Boolean(nameError)}
              onChange={(event) =>
                onMetaChange({ ...meta, name: event.target.value })
              }
              placeholder={t("user.workout.planCreate.meta.namePlaceholder")}
              disabled={isSubmitting}
            />
            {nameError ? <FieldError>{nameError}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="create-plan-description">
              {t("user.workout.planCreate.meta.descriptionLabel")}
            </FieldLabel>
            <Textarea
              id="create-plan-description"
              value={meta.description}
              onChange={(event) =>
                onMetaChange({ ...meta, description: event.target.value })
              }
              placeholder={t("user.workout.planCreate.meta.descriptionPlaceholder")}
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <PlanCoverPicker
              value={meta.coverImageUrl}
              options={coverOptions}
              isUploading={isUploading}
              error={coverError}
              onChange={(coverImageUrl) =>
                onMetaChange({ ...meta, coverImageUrl })
              }
              onRemove={() => onMetaChange({ ...meta, coverImageUrl: "" })}
              onUpload={onUploadCover}
              t={t}
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
          {t("user.workout.planCreate.actions.createWithAi")}
        </Button>
        <Button
          type="button"
          onClick={onCreate}
          disabled={isSubmitting || isUploading}
        >
          <PlusIcon data-icon="inline-start" />
          {t("user.workout.planCreate.actions.create")}
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
  t,
}) => {
  const update = (key, value) => onFormChange({ ...form, [key]: value });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>{t("user.workout.planCreate.aiSetup.title")}</DrawerTitle>
          <DrawerDescription>
            {t("user.workout.planCreate.aiSetup.description")}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <FieldGroup className="gap-5">
            <FieldSet>
              <FieldLegend>{t("user.workout.planCreate.aiSetup.goal")}</FieldLegend>
              <ToggleGroup
                type="single"
                value={form.goal}
                onValueChange={(value) => value && update("goal", value)}
                variant="outline"
                className="flex-wrap justify-start"
              >
                {map(WORKOUT_GOALS, (goal) => (
                  <ToggleGroupItem key={goal.value} value={goal.value}>
                    {getOptionLabel(goal, t)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>{t("user.workout.planCreate.aiSetup.level")}</FieldLegend>
              <ToggleGroup
                type="single"
                value={form.level}
                onValueChange={(value) => value && update("level", value)}
                variant="outline"
                className="flex-wrap justify-start"
              >
                {map(WORKOUT_LEVELS, (level) => (
                  <ToggleGroupItem key={level.value} value={level.value}>
                    {getOptionLabel(level, t)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>
                  {t("user.workout.planCreate.aiSetup.duration")}
                </FieldLabel>
                <div className="flex items-center rounded-4xl border bg-input/30">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("user.workout.planCreate.aiSetup.decreaseDays")}
                    onClick={() => update("days", Math.max(7, toNumber(form.days) - 7))}
                  >
                    <MinusIcon />
                  </Button>
                  <div className="flex-1 text-center text-sm font-semibold">
                    {t("user.workout.planCreate.units.daysValue", {
                      count: form.days,
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("user.workout.planCreate.aiSetup.increaseDays")}
                    onClick={() => update("days", Math.min(365, toNumber(form.days) + 7))}
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel>
                  {t("user.workout.planCreate.aiSetup.daysPerWeek")}
                </FieldLabel>
                <div className="flex items-center rounded-4xl border bg-input/30">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("user.workout.planCreate.aiSetup.decreaseDaysPerWeek")}
                    onClick={() =>
                      update("daysPerWeek", Math.max(1, toNumber(form.daysPerWeek) - 1))
                    }
                  >
                    <MinusIcon />
                  </Button>
                  <div className="flex-1 text-center text-sm font-semibold">
                    {t("user.workout.planCreate.units.daysValue", {
                      count: form.daysPerWeek,
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("user.workout.planCreate.aiSetup.increaseDaysPerWeek")}
                    onClick={() =>
                      update("daysPerWeek", Math.min(7, toNumber(form.daysPerWeek) + 1))
                    }
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </Field>
            </div>

            <FieldSet>
              <FieldLegend>{t("user.workout.planCreate.aiSetup.equipment")}</FieldLegend>
              <ToggleGroup
                type="single"
                value={form.equipmentMode}
                onValueChange={(value) => value && update("equipmentMode", value)}
                variant="outline"
                className="flex-wrap justify-start"
              >
                {map(EQUIPMENT_MODES, (mode) => (
                  <ToggleGroupItem key={mode.value} value={mode.value}>
                    {getOptionLabel(mode, t)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
          </FieldGroup>
        </DrawerBody>
        <DrawerFooter className="sm:flex-row">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeftIcon data-icon="inline-start" />
            {t("user.workout.planCreate.actions.back")}
          </Button>
          <Button type="button" onClick={onNext}>
            {t("user.workout.planCreate.actions.next")}
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
  error,
  onToggle,
  onOpenChange,
  onBack,
  onNext,
  t,
}) => {
  const [tab, setTab] = React.useState("popular");
  const visibleItems = React.useMemo(
    () => filterEquipmentByTab(equipment, tab),
    [equipment, tab],
  );
  const selectedItems = React.useMemo(
    () => filter(equipment, (item) => includes(selectedIds, get(item, "id"))),
    [equipment, selectedIds],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>{t("user.workout.planCreate.equipment.title")}</DrawerTitle>
          <DrawerDescription>
            {t("user.workout.planCreate.equipment.description")}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="px-0">
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <div className="overflow-x-auto px-4">
              <TabsList>
                {map(EQUIPMENT_TABS, (item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <div className="flex flex-col gap-3 px-4 pb-4">
            {error ? <FieldError>{error}</FieldError> : null}
            {map(visibleItems, (item) => {
              const checked = includes(selectedIds, get(item, "id"));

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
              {map(take(selectedItems, 5), (item) => (
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
            <Badge variant="secondary">
              {t("user.workout.planCreate.equipment.selected", {
                count: size(selectedIds),
              })}
            </Badge>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeftIcon data-icon="inline-start" />
              {t("user.workout.planCreate.actions.back")}
            </Button>
            <Button type="button" onClick={onNext}>
              {t("user.workout.planCreate.actions.next")}
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
  error,
  onToggle,
  onOpenChange,
  onBack,
  onNext,
  t,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader>
        <DrawerTitle>{t("user.workout.planCreate.muscles.title")}</DrawerTitle>
        <DrawerDescription>
          {t("user.workout.planCreate.muscles.description")}
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        {error ? <FieldError className="mb-3">{error}</FieldError> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {map(muscles, (item) => {
            const checked = includes(selectedIds, get(item, "id"));

            return (
              <button
                key={`${get(item, "type", "muscle")}-${get(item, "id")}`}
                type="button"
                onClick={() => onToggle(get(item, "id"))}
                className={cn(
                  "flex items-center gap-3 rounded-3xl border bg-card p-4 text-left shadow-sm transition",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-muted/60 font-black">
                  {String(get(item, "name", "?")).slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{get(item, "name")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("user.workout.planCreate.muscles.focusArea")}
                  </span>
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
          {t("user.workout.planCreate.actions.back")}
        </Button>
        <Button type="button" onClick={onNext}>
          {t("user.workout.planCreate.actions.next")}
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
  t,
}) => {
  const update = (key, value) => onFormChange({ ...form, [key]: value });
  const selectedExercise = find(
    exercises,
    (exercise) => get(exercise, "name") === form.benchmarkExercise,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>{t("user.workout.planCreate.oneRm.title")}</DrawerTitle>
          <DrawerDescription>
            {t("user.workout.planCreate.oneRm.description")}
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
              <FieldLabel>{t("user.workout.planCreate.oneRm.benchmark")}</FieldLabel>
              <Select
                value={form.benchmarkExercise}
                onValueChange={(value) => update("benchmarkExercise", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("user.workout.planCreate.oneRm.exercisePlaceholder")}
                  />
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
                <FieldLabel htmlFor="ai-benchmark-weight">
                  {t("user.workout.planCreate.oneRm.weightLabel")}
                </FieldLabel>
                <Input
                  id="ai-benchmark-weight"
                  type="number"
                  min="0"
                  value={form.benchmarkWeight}
                  onChange={(event) => update("benchmarkWeight", event.target.value)}
                />
                <FieldDescription>
                  {t("user.workout.planCreate.units.kg")}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ai-benchmark-reps">
                  {t("user.workout.planCreate.oneRm.repsLabel")}
                </FieldLabel>
                <Input
                  id="ai-benchmark-reps"
                  type="number"
                  min="1"
                  max="30"
                  value={form.benchmarkReps}
                  onChange={(event) => update("benchmarkReps", event.target.value)}
                />
                <FieldDescription>
                  {t("user.workout.planCreate.units.reps")}
                </FieldDescription>
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-3xl border bg-card p-4">
              <div>
                <p className="font-bold">
                  {t("user.workout.planCreate.oneRm.result")}
                </p>
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
            {t("user.workout.planCreate.actions.generate")}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isGenerating}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              {t("user.workout.planCreate.actions.back")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onGenerate(false)}
              disabled={isGenerating}
            >
              {t("user.workout.planCreate.oneRm.skip")}
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
  t,
}) => (
  <Card className="py-6">
    <CardHeader>
      <CardTitle>
        {get(plan, "name", t("user.workout.planCreate.preview.fallbackName"))}
      </CardTitle>
      <CardDescription>
        {get(plan, "description") ||
          t("user.workout.planCreate.preview.fallbackDescription")}
      </CardDescription>
      <CardAction>
        <Badge variant="secondary">
          <SparklesIcon />
          {t("user.workout.planCreate.preview.badge")}
        </Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-3xl border bg-muted/30">
          {get(plan, "coverImageUrl") ? (
            <img
              src={get(plan, "coverImageUrl")}
              alt={get(
                plan,
                "name",
                t("user.workout.planCreate.preview.fallbackName"),
              )}
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
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="font-black">{get(plan, "days", 28)}</p>
              <p className="text-xs text-muted-foreground">
                {t("user.workout.planCreate.units.days")}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="font-black">{get(plan, "daysPerWeek", 4)}</p>
              <p className="text-xs text-muted-foreground">
                {t("user.workout.planCreate.units.daysPerWeek")}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="font-black">
                {get(plan, "totalExercises", size(get(plan, "schedule", [])))}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("user.workout.planCreate.units.exercises")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {map(take(get(plan, "schedule", []), 7), (day, index) => (
              <div
                key={`${get(day, "day")}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border bg-background px-3 py-2 text-sm"
              >
                <span className="font-semibold">
                  {get(
                    day,
                    "day",
                    t("user.workout.planCreate.preview.dayFallback", {
                      day: index + 1,
                    }),
                  )} · {get(day, "focus", t("user.workout.planCreate.fallbacks.workout"))}
                </span>
                <Badge variant="outline">
                  {t("user.workout.planCreate.units.exerciseCount", {
                    count: size(get(day, "exercises", [])),
                  })}
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
        {t("user.workout.planCreate.actions.savePlan")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onRegenerate}
        disabled={isGenerating}
      >
        <SparklesIcon data-icon="inline-start" />
        {t("user.workout.planCreate.actions.regenerate")}
      </Button>
      <Button type="button" variant="ghost" onClick={onEditManual}>
        {t("user.workout.planCreate.actions.editInBuilder")}
      </Button>
    </CardFooter>
  </Card>
);

const CreateWorkoutPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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
    () => buildCoverOptions(catalog, initialPlan, t),
    [catalog, initialPlan, t],
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
  const planMetaRef = React.useRef(planMeta);
  const [formErrors, setFormErrors] = React.useState({});
  const [coverUploadError, setCoverUploadError] = React.useState(null);
  const clearFormError = React.useCallback((field) => {
    setFormErrors((current) =>
      get(current, field)
        ? {
            ...current,
            [field]: null,
          }
        : current,
    );
  }, []);
  const updatePlanMeta = React.useCallback((nextPlanMeta) => {
    const previousPlanMeta = planMetaRef.current;
    const resolvedPlanMeta =
      typeof nextPlanMeta === "function"
        ? nextPlanMeta(planMetaRef.current)
        : nextPlanMeta;

    planMetaRef.current = resolvedPlanMeta;
    setPlanMeta(resolvedPlanMeta);

    if (trim(get(resolvedPlanMeta, "name", ""))) {
      clearFormError("name");
    }

    if (
      get(resolvedPlanMeta, "coverImageUrl") !==
      get(previousPlanMeta, "coverImageUrl")
    ) {
      setCoverUploadError(null);
    }
  }, [clearFormError]);
  const [aiForm, setAiForm] = React.useState({
    goal: "muscle_building",
    level: "beginner",
    days: toNumber(get(initialPlan, "days", 28)) || 28,
    daysPerWeek: toNumber(get(initialPlan, "daysPerWeek", 4)) || 4,
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
      { url: "/user", title: t("user.workout.plansList.breadcrumbs.home") },
      {
        url: "/user/workout",
        title: t("user.workout.plansList.breadcrumbs.workout"),
      },
      {
        url: "/user/workout/plans",
        title: t("user.workout.plansList.breadcrumbs.myPlans"),
      },
      {
        url: "/user/workout/plans/create",
        title: t("user.workout.planCreate.breadcrumb"),
      },
    ]);
  }, [setBreadcrumbs, t]);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (hasSeededCatalog.current) return;
    if (size(equipmentOptions) === 0 || size(muscleOptions) === 0) return;

    hasSeededCatalog.current = true;
    setAiForm((current) => ({
      ...current,
      selectedEquipmentIds: map(take(equipmentOptions, 4), "id"),
      focusMuscleIds: map(take(muscleOptions, 2), "id"),
    }));
  }, [equipmentOptions, muscleOptions]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validatePlanName = () => {
    if (!trim(planMetaRef.current.name)) {
      setFormErrors((current) => ({
        ...current,
        name: t("user.workout.planCreate.validation.nameRequired"),
      }));
      toast.error(t("user.workout.planCreate.validation.nameRequired"));
      return false;
    }

    clearFormError("name");
    return true;
  };

  const handleCoverUpload = async (file) => {
    setCoverUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await uploadMutation.mutateAsync({
        url: "/user/media/workout-plan-covers",
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
        setCoverUploadError(t("user.workout.planCreate.cover.uploadError"));
        toast.error(t("user.workout.planCreate.cover.uploadError"));
        return;
      }

      updatePlanMeta((current) => ({ ...current, coverImageUrl }));
      toast.success(t("user.workout.planCreate.cover.uploadSuccess"));
    } catch {
      setCoverUploadError(t("user.workout.planCreate.cover.uploadError"));
      toast.error(t("user.workout.planCreate.cover.uploadError"));
    }
  };

  const createDraftAndOpenBuilder = async () => {
    if (!validatePlanName()) return;

    try {
      const currentPlanMeta = planMetaRef.current;
      const source = get(initialPlan, "isTemplate")
        ? "template"
        : get(initialPlan, "source", "manual");
      const createdPlan = await createPlanMutation.createPlan({
        name: trim(currentPlanMeta.name),
        description: trim(currentPlanMeta.description),
        coverImageUrl: currentPlanMeta.coverImageUrl || undefined,
        days: toNumber(get(initialPlan, "days", 28)) || 28,
        daysPerWeek: toNumber(get(initialPlan, "daysPerWeek", 0)) || 0,
        difficulty: get(initialPlan, "difficulty"),
        schedule: isArray(get(initialPlan, "schedule"))
          ? get(initialPlan, "schedule")
          : [],
        source,
      });

      toast.success(t("user.workout.planCreate.toasts.created"));
      navigate(`/user/workout/plans/edit/${get(createdPlan, "id")}`, {
        replace: true,
        state: {
          initialPlan: createdPlan,
          shouldActivateOnSave: true,
        },
      });
    } catch (error) {
      toast.error(
        getWorkoutFormErrorMessage(
          error,
          t("user.workout.planCreate.toasts.createError"),
        ),
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
      clearFormError("equipment");
      setMuscleOpen(true);
    } else {
      setEquipmentOpen(true);
    }
  };

  const goFromEquipment = () => {
    if (size(get(aiForm, "selectedEquipmentIds", [])) === 0) {
      setFormErrors((current) => ({
        ...current,
        equipment: t("user.workout.planCreate.validation.equipmentRequired"),
      }));
      toast.error(t("user.workout.planCreate.validation.equipmentRequired"));
      return;
    }

    clearFormError("equipment");
    setEquipmentOpen(false);
    setMuscleOpen(true);
  };

  const goFromMuscle = () => {
    if (size(get(aiForm, "focusMuscleIds", [])) === 0) {
      setFormErrors((current) => ({
        ...current,
        muscles: t("user.workout.planCreate.validation.muscleRequired"),
      }));
      toast.error(t("user.workout.planCreate.validation.muscleRequired"));
      return;
    }

    clearFormError("muscles");
    setMuscleOpen(false);
    setOneRmOpen(true);
  };

  const handleGenerate = async (benchmarkEnabled) => {
    if (benchmarkEnabled && oneRepMaxKg <= 0) {
      toast.error(t("user.workout.planCreate.validation.oneRmRequired"));
      return;
    }

    try {
      const currentPlanMeta = planMetaRef.current;
      const preview = await generateMutation.generatePlan(
        buildGenerateWorkoutPlanPayload({
          ...aiForm,
          name: currentPlanMeta.name,
          coverImageUrl: currentPlanMeta.coverImageUrl,
          benchmarkEnabled,
        }),
      );
      const generatedPlan = resolveGeneratedPlan(
        preview,
        currentPlanMeta.coverImageUrl,
      );

      setAiPreview(generatedPlan);
      setOneRmOpen(false);
      toast.success(t("user.workout.planCreate.toasts.aiReady"));
    } catch (error) {
      toast.error(
        getWorkoutFormErrorMessage(
          error,
          t("user.workout.planCreate.toasts.aiCreateError"),
        ),
      );
    }
  };

  const handleSavePreview = async () => {
    if (!aiPreview) return;

    try {
      const currentPlanMeta = planMetaRef.current;
      const createdPlan = await createPlanMutation.createPlan({
        ...getGeneratedPlanSavePayload(aiPreview),
        coverImageUrl:
          get(aiPreview, "coverImageUrl") ||
          currentPlanMeta.coverImageUrl ||
          undefined,
      });
      toast.success(t("user.workout.planCreate.toasts.aiSaved"));
      navigate(`/user/workout/plans/${get(createdPlan, "id")}`, {
        replace: true,
      });
    } catch (error) {
      toast.error(
        getWorkoutFormErrorMessage(
          error,
          t("user.workout.planCreate.toasts.aiSaveError"),
        ),
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
                const currentPlanMeta = planMetaRef.current;
                const createdPlan = await createPlanMutation.createPlan({
                  ...getGeneratedPlanSavePayload(aiPreview),
                  coverImageUrl:
                    get(aiPreview, "coverImageUrl") ||
                    currentPlanMeta.coverImageUrl ||
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
                  getWorkoutFormErrorMessage(
                    error,
                    t("user.workout.planCreate.toasts.createError"),
                  ),
                );
              }
            }}
            t={t}
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
            nameError={get(formErrors, "name")}
            coverError={coverUploadError}
            onMetaChange={updatePlanMeta}
            onUploadCover={handleCoverUpload}
            onOpenChange={(open) => {
              setMetaDrawerOpen(open);
              if (!open && !aiSetupOpen && !equipmentOpen && !muscleOpen && !oneRmOpen) {
                navigate("/user/workout/plans", { replace: true });
              }
            }}
            onCreate={createDraftAndOpenBuilder}
            onCreateWithAi={startAiFlow}
            t={t}
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
            t={t}
          />
        ) : null}

        {equipmentOpen ? (
          <AiEquipmentDrawer
            open={equipmentOpen}
            equipment={equipmentOptions}
            selectedIds={get(aiForm, "selectedEquipmentIds", [])}
            error={get(formErrors, "equipment")}
            onToggle={(id) =>
              setAiForm((current) => {
                const selectedEquipmentIds = toggleId(
                  get(current, "selectedEquipmentIds", []),
                  id,
                );

                if (size(selectedEquipmentIds) > 0) {
                  clearFormError("equipment");
                }

                return {
                  ...current,
                  selectedEquipmentIds,
                };
              })
            }
            onOpenChange={setEquipmentOpen}
            onBack={() => {
              setEquipmentOpen(false);
              setAiSetupOpen(true);
            }}
            onNext={goFromEquipment}
            t={t}
          />
        ) : null}

        {muscleOpen ? (
          <AiMuscleGroupDrawer
            open={muscleOpen}
            muscles={muscleOptions}
            selectedIds={get(aiForm, "focusMuscleIds", [])}
            error={get(formErrors, "muscles")}
            onToggle={(id) =>
              setAiForm((current) => {
                const focusMuscleIds = toggleId(
                  get(current, "focusMuscleIds", []),
                  id,
                );

                if (size(focusMuscleIds) > 0) {
                  clearFormError("muscles");
                }

                return {
                  ...current,
                  focusMuscleIds,
                };
              })
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
            t={t}
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
            t={t}
          />
        ) : null}
      </div>
    </PageTransition>
  );
};

export default CreateWorkoutPlanPage;
