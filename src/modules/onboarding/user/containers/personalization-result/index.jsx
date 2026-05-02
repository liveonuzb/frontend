import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  DumbbellIcon,
  FlameIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SaladIcon,
  SearchIcon,
  TargetIcon,
  UtensilsIcon,
  XIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import {
  getUserOnboardingGeneratingPath,
  getUserOnboardingPersonalizingPath,
} from "@/lib/app-paths";
import { cn } from "@/lib/utils";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useAuthStore } from "@/store";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import {
  buildPersonalizationPatch,
  formatNumber,
  formatWeightDelta,
  getMacroBalanceMessage,
  normalizeCustomEquipment,
  normalizeEquipmentIds,
  unwrapApiData,
} from "../../lib/personalization.js";
import {
  hasChipLabel,
  normalizeChipKey,
  normalizeChipLabel,
} from "../../lib/chip-selection.js";

const tone = ONBOARDING_ACCENTS.green;

const editKeys = {
  dailyCalories: "dailyCalories",
  proteinGram: "proteinGram",
  carbsGram: "carbsGram",
  fatGram: "fatGram",
  targetWeight: "targetWeight",
  weeklyWeightChangeGoal: "weeklyWeightChangeGoal",
  mealsPerDay: "mealsPerDay",
  weeklyWorkoutDays: "weeklyWorkoutDays",
  workoutLocation: "workoutLocation",
  equipment: "equipment",
};

const optionSets = {
  weeklyWeightChangeGoal: [0.25, 0.5, 0.75, 1],
  mealsPerDay: [2, 3, 4, 5],
  weeklyWorkoutDays: [2, 3, 4, 5, 6],
  workoutLocation: ["home", "gym", "outdoor"],
};

const extractEquipment = (response) => {
  const body = unwrapApiData(response) ?? {};
  const values = body.equipment ?? body.equipments ?? [];
  return Array.isArray(values) ? values : [];
};

const mergeEquipment = (...groups) => {
  const seen = new Set();
  return groups.flat().filter((item) => {
    const id = Number(item?.id);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const CircularMetric = ({
  icon: Icon,
  label,
  value,
  unit,
  progress = 100,
  onEdit,
}) => (
  <button
    type="button"
    onClick={onEdit}
    className="group flex min-h-[132px] flex-col justify-between rounded-[1.35rem] border border-border/70 bg-background/90 p-4 text-left shadow-sm transition hover:border-primary/35"
  >
    <div className="flex items-start justify-between gap-3">
      <div
        className="flex size-14 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(hsl(var(--primary)) ${Math.min(100, Math.max(0, progress)) * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-background">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
      <span className="flex size-8 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition group-hover:text-primary">
        <PencilIcon className="size-4" />
      </span>
    </div>
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">
        {value}
        <span className="ml-1 text-sm font-bold text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  </button>
);

const SegmentOptions = ({ value, options, labelPrefix, onChange, t }) => (
  <div className="grid gap-2">
    {options.map((item) => {
      const active = String(value) === String(item);
      return (
        <button
          key={item}
          type="button"
          className={cn(
            "flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-bold transition",
            active
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/70 bg-background hover:border-primary/25",
          )}
          onClick={() => onChange(item)}
        >
          {t(`${labelPrefix}.${item}`, { defaultValue: String(item) })}
          {active ? <TargetIcon className="size-4" /> : null}
        </button>
      );
    })}
  </div>
);

const EquipmentEditor = ({ value, onChange, t }) => {
  const [search, setSearch] = React.useState("");
  const searchLabel = normalizeChipLabel(search);
  const searchKey = normalizeChipKey(searchLabel);
  const selectedIds = normalizeEquipmentIds(value.equipmentIds);
  const customEquipment = normalizeCustomEquipment(value.customEquipment);
  const baseQuery = useGetQuery({
    url: "/onboarding/personalization-options",
    queryProps: {
      queryKey: ["onboarding", "personalization-options", "equipment"],
      staleTime: 60000,
    },
  });
  const searchQuery = useGetQuery({
    url: "/onboarding/personalization-options",
    params: { q: searchLabel },
    queryProps: {
      queryKey: [
        "onboarding",
        "personalization-options",
        "equipment",
        searchLabel,
      ],
      enabled: searchLabel.length >= 2,
      staleTime: 15000,
    },
  });
  const baseOptions = React.useMemo(
    () => extractEquipment(baseQuery.data),
    [baseQuery.data],
  );
  const searchOptions = React.useMemo(
    () => extractEquipment(searchQuery.data),
    [searchQuery.data],
  );
  const options = React.useMemo(
    () => mergeEquipment(baseOptions, searchOptions),
    [baseOptions, searchOptions],
  );
  const visibleOptions = searchLabel.length >= 2 ? searchOptions : baseOptions;
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const optionMap = React.useMemo(
    () => new Map(options.map((item) => [Number(item.id), item])),
    [options],
  );
  const exactActiveMatch = options.some(
    (item) => normalizeChipKey(item.name) === searchKey,
  );
  const canAddCustom =
    searchLabel.length >= 2 &&
    !exactActiveMatch &&
    !hasChipLabel(customEquipment, searchLabel);

  const commit = (equipmentIds, nextCustom = customEquipment) => {
    onChange({
      equipmentIds: normalizeEquipmentIds(equipmentIds),
      customEquipment: normalizeCustomEquipment(nextCustom),
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("onboarding.postOnboarding.result.equipmentPlaceholder")}
          className="h-11 pl-9"
        />
      </div>

      {selectedIds.length || customEquipment.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <button
              key={`equipment-${id}`}
              type="button"
              onClick={() => commit(selectedIds.filter((item) => item !== id))}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <span className="truncate">{optionMap.get(id)?.name ?? `#${id}`}</span>
              <XIcon className="size-3.5" />
            </button>
          ))}
          {customEquipment.map((label) => (
            <button
              key={`custom-equipment-${label}`}
              type="button"
              onClick={() => {
                const key = normalizeChipKey(label);
                commit(
                  selectedIds,
                  customEquipment.filter(
                    (item) => normalizeChipKey(item) !== key,
                  ),
                );
              }}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700"
            >
              <span className="truncate">{label}</span>
              <XIcon className="size-3.5" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
        {visibleOptions.map((item) => {
          const id = Number(item.id);
          const active = selectedSet.has(id);

          return (
            <button
              key={id}
              type="button"
              onClick={() =>
                commit(
                  active
                    ? selectedIds.filter((selectedId) => selectedId !== id)
                    : [...selectedIds, id],
                )
              }
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm font-semibold",
                active
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border/70 bg-background",
              )}
            >
              <DumbbellIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
            </button>
          );
        })}

        {canAddCustom ? (
          <button
            type="button"
            onClick={() => {
              commit(selectedIds, [...customEquipment, searchLabel]);
              setSearch("");
            }}
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left text-sm font-semibold text-primary"
          >
            <PlusIcon className="size-4" />
            {t("onboarding.chipSelect.addCustom", { value: searchLabel })}
          </button>
        ) : null}
      </div>
    </div>
  );
};

const EditDrawer = ({ open, onOpenChange, field, result, onSave, saving }) => {
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");
  const [equipmentValue, setEquipmentValue] = React.useState({
    equipmentIds: [],
    customEquipment: [],
  });

  React.useEffect(() => {
    if (!field || !result) return;

    if (field === editKeys.equipment) {
      setEquipmentValue({
        equipmentIds: result.equipmentIds ?? [],
        customEquipment: result.customEquipment ?? [],
      });
      return;
    }

    setValue(result[field] ?? "");
  }, [field, result]);

  if (!field) return null;

  const isOptionField = Object.prototype.hasOwnProperty.call(optionSets, field);
  const isEquipment = field === editKeys.equipment;
  const title = t(`onboarding.postOnboarding.result.edit.${field}.title`);
  const description = t(
    `onboarding.postOnboarding.result.edit.${field}.description`,
  );
  const numberValue = Number(value);
  const showLowCalorieWarning =
    field === editKeys.dailyCalories &&
    Number.isFinite(numberValue) &&
    numberValue < 1200;
  const showLowFatWarning =
    field === editKeys.fatGram &&
    Number.isFinite(numberValue) &&
    Number(result?.currentWeight) > 0 &&
    numberValue < Number(result.currentWeight) * 0.5;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          {isEquipment ? (
            <EquipmentEditor
              value={equipmentValue}
              onChange={setEquipmentValue}
              t={t}
            />
          ) : isOptionField ? (
            <SegmentOptions
              value={value}
              options={optionSets[field]}
              labelPrefix={`onboarding.postOnboarding.result.options.${field}`}
              onChange={setValue}
              t={t}
            />
          ) : (
            <Input
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="h-12"
            />
          )}

          {field === editKeys.dailyCalories ? (
            <div className="rounded-2xl bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
              {t("onboarding.postOnboarding.result.recommended")}:{" "}
              {formatNumber(result.dailyCalories)} kcal
            </div>
          ) : null}

          {field === editKeys.proteinGram && result?.currentWeight ? (
            <div className="rounded-2xl bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
              {t("onboarding.postOnboarding.result.proteinRecommendation", {
                min: Math.round(result.currentWeight * 1.6),
                max: Math.round(result.currentWeight * 2.2),
              })}
            </div>
          ) : null}

          {field === editKeys.carbsGram || field === editKeys.fatGram ? (
            <div className="rounded-2xl bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
              {getMacroBalanceMessage(
                {
                  ...result,
                  [field]: Number.isFinite(numberValue) ? numberValue : result[field],
                },
                t,
              )}
            </div>
          ) : null}

          {showLowCalorieWarning || showLowFatWarning ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-semibold text-destructive">
              {showLowCalorieWarning
                ? t("onboarding.postOnboarding.result.lowCalorieWarning")
                : t("onboarding.postOnboarding.result.lowFatWarning")}
            </div>
          ) : null}
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            onClick={() =>
              onSave(
                field,
                isEquipment
                  ? equipmentValue
                  : isOptionField
                    ? value
                    : Number(value),
              )
            }
            disabled={saving}
          >
            {saving ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {t("onboarding.postOnboarding.result.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("onboarding.postOnboarding.result.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const ResultContent = ({ result, onEdit }) => {
  const { t } = useTranslation();
  const calories = Number(result.dailyCalories) || 1;
  const carbProgress = Math.min(100, ((Number(result.carbsGram) * 4) / calories) * 100);
  const proteinProgress = Math.min(
    100,
    ((Number(result.proteinGram) * 4) / calories) * 100,
  );
  const fatProgress = Math.min(100, ((Number(result.fatGram) * 9) / calories) * 100);

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 pb-28 sm:px-6 md:py-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          onClick={() => window.history.back()}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <Progress value={92} className="h-2" />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.75rem] border border-border/70 bg-background/90 p-5 shadow-sm sm:p-7">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              <TargetIcon className="size-3.5" />
              {t("onboarding.postOnboarding.result.readyBadge")}
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              {t("onboarding.postOnboarding.result.title")}
            </h1>
            <p className="text-sm font-semibold leading-6 text-muted-foreground sm:text-base">
              {t("onboarding.postOnboarding.result.subtitle")}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => onEdit(editKeys.targetWeight)}
              className="rounded-[1.25rem] border border-primary/20 bg-primary/10 px-4 py-3 text-left text-primary"
            >
              <p className="text-xs font-bold uppercase">
                {t("onboarding.postOnboarding.result.weightDifference")}
              </p>
              <p className="mt-1 text-3xl font-black">
                {formatWeightDelta(result.weightToChange)}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onEdit(editKeys.weeklyWeightChangeGoal)}
              className="rounded-[1.25rem] border border-border/70 bg-muted/30 px-4 py-3 text-left"
            >
              <p className="text-xs font-bold text-muted-foreground">
                {t("onboarding.postOnboarding.result.weeklyPace")}
              </p>
              <p className="mt-1 text-xl font-black">
                {result.weeklyWeightChangeGoal ?? 0.5} kg
              </p>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(editKeys.dailyCalories)}
          className="flex min-h-[220px] flex-col justify-between rounded-[1.75rem] border border-border/70 bg-[#101828] p-5 text-left text-white shadow-sm sm:p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
              <FlameIcon className="size-6 text-[#F59E0B]" />
            </div>
            <PencilIcon className="size-5 text-white/70" />
          </div>
          <div>
            <p className="text-sm font-bold text-white/60">
              {t("onboarding.postOnboarding.result.dailyCalories")}
            </p>
            <p className="mt-2 text-5xl font-black tracking-tight">
              {formatNumber(result.dailyCalories)}
            </p>
            <p className="mt-1 text-sm font-semibold text-white/60">kcal</p>
          </div>
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CircularMetric
          icon={FlameIcon}
          label={t("onboarding.postOnboarding.result.metrics.calories")}
          value={formatNumber(result.dailyCalories)}
          unit="kcal"
          progress={100}
          onEdit={() => onEdit(editKeys.dailyCalories)}
        />
        <CircularMetric
          icon={UtensilsIcon}
          label={t("onboarding.postOnboarding.result.metrics.carbs")}
          value={formatNumber(result.carbsGram)}
          unit="g"
          progress={carbProgress}
          onEdit={() => onEdit(editKeys.carbsGram)}
        />
        <CircularMetric
          icon={SaladIcon}
          label={t("onboarding.postOnboarding.result.metrics.protein")}
          value={formatNumber(result.proteinGram)}
          unit="g"
          progress={proteinProgress}
          onEdit={() => onEdit(editKeys.proteinGram)}
        />
        <CircularMetric
          icon={FlameIcon}
          label={t("onboarding.postOnboarding.result.metrics.fat")}
          value={formatNumber(result.fatGram)}
          unit="g"
          progress={fatProgress}
          onEdit={() => onEdit(editKeys.fatGram)}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ["mealsPerDay", result.mealsPerDay, "x"],
          ["weeklyWorkoutDays", result.weeklyWorkoutDays, "days"],
          ["workoutLocation", result.workoutLocation, ""],
        ].map(([key, value, unit]) => (
          <button
            key={key}
            type="button"
            onClick={() => onEdit(key)}
            className="flex min-h-24 items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/90 p-4 text-left"
          >
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                {t(`onboarding.postOnboarding.result.quick.${key}`)}
              </p>
              <p className="mt-1 text-2xl font-black">
                {t(`onboarding.postOnboarding.result.options.${key}.${value}`, {
                  defaultValue: `${value ?? "-"} ${unit}`,
                })}
              </p>
            </div>
            <PencilIcon className="size-4 text-muted-foreground" />
          </button>
        ))}
      </section>

      <button
        type="button"
        onClick={() => onEdit(editKeys.equipment)}
        className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/90 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-black">
            {t("onboarding.postOnboarding.result.equipment")}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
            {t("onboarding.postOnboarding.result.equipmentSummary", {
              count:
                (result.equipmentIds?.length ?? 0) +
                (result.customEquipment?.length ?? 0),
            })}
          </p>
        </div>
        <PencilIcon className="size-4 text-muted-foreground" />
      </button>

      <details className="rounded-[1.25rem] border border-border/70 bg-background/90 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black">
          <InfoIcon className="size-4 text-primary" />
          {t("onboarding.postOnboarding.result.howCalculated")}
        </summary>
        <div className="mt-3 grid gap-2 text-sm font-medium leading-6 text-muted-foreground sm:grid-cols-2">
          <p>BMR: {formatNumber(result.bmr)} kcal</p>
          <p>TDEE: {formatNumber(result.tdee)} kcal</p>
          <p>BMI: {result.bmi ?? "-"}</p>
          <p>
            {t("onboarding.postOnboarding.result.water")}:{" "}
            {formatNumber(result.recommendedWaterMl)} ml
          </p>
          <p>
            {t("onboarding.postOnboarding.result.steps")}:{" "}
            {formatNumber(result.dailyStepsTarget)}
          </p>
          <p>
            {t("onboarding.postOnboarding.result.metabolicAge")}:{" "}
            {result.metabolicAge ?? "-"}
          </p>
        </div>
      </details>
    </div>
  );
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setOnboardingFlow = useAuthStore((state) => state.setOnboardingFlow);
  const [editing, setEditing] = React.useState(null);
  const resultQuery = useGetQuery({
    url: "/onboarding/personalization-result",
    queryProps: {
      queryKey: ["onboarding", "personalization-result"],
      staleTime: 15000,
    },
  });
  const resultBody = unwrapApiData(resultQuery.data);
  const result = resultBody?.result ?? resultBody;
  const { mutateAsync: patchResult, isPending: isSaving } = usePatchQuery({
    queryKey: ["onboarding", "personalization-result"],
  });
  const { mutateAsync: startGeneration, isPending: isGenerating } = usePostQuery();

  const handleSave = async (field, value) => {
    try {
      const patch = buildPersonalizationPatch(field, value);
      await patchResult({
        url: "/onboarding/personalization-result",
        attributes: patch,
      });
      setEditing(null);
      toast.success(t("onboarding.postOnboarding.result.saved"));
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message || t("onboarding.postOnboarding.result.saveError"),
      );
    }
  };

  const handleNext = async () => {
    try {
      const response = await startGeneration({
        url: "/onboarding/generate-personal-plan",
      });
      const job = unwrapApiData(response);
      setOnboardingFlow({
        onboardingFlowStatus: job?.flowStatus,
        onboardingNextPath: job?.nextPath,
        latestPlanGenerationJobId: job?.id,
      });
      await queryClient.invalidateQueries({
        queryKey: ["onboarding", "generation-status", job?.id],
      });
      navigate(getUserOnboardingGeneratingPath(job?.id), { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message || t("onboarding.postOnboarding.result.generateError"),
      );
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      size="lg"
      className="h-12 w-full"
      onClick={handleNext}
      disabled={!result || isGenerating}
    >
      {isGenerating ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <ChevronRightIcon className="size-4" />
      )}
      {t("onboarding.postOnboarding.result.next")}
    </Button>,
  );

  if (resultQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md rounded-[1.5rem] border bg-background p-5 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            {t("onboarding.postOnboarding.result.empty")}
          </p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => navigate(getUserOnboardingPersonalizingPath())}
          >
            {t("onboarding.postOnboarding.loading.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative flex min-h-full flex-1 overflow-hidden bg-[#F8FAF7]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <PageAura tone={tone} />
      <ResultContent result={result} onEdit={setEditing} />
      <EditDrawer
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        field={editing}
        result={result}
        onSave={handleSave}
        saving={isSaving}
      />
    </motion.div>
  );
};

export default Index;
