import React from "react";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  BrainIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  DropletsIcon,
  FlameIcon,
  FootprintsIcon,
  GaugeIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SaladIcon,
  SaveIcon,
  ScaleIcon,
  SearchIcon,
  SparklesIcon,
  TargetIcon,
  UtensilsIcon,
  WalletCardsIcon,
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
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetQuery,
  usePatchQuery,
  usePostQuery,
  usePutQuery,
} from "@/hooks/api";
import {
  getUserOnboardingPlanPreviewPath,
  getUserOnboardingPersonalizingPath,
} from "@/lib/app-paths";
import { cn } from "@/lib/utils";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import {
  getOnboardingOptionsPath,
  getOnboardingOptionsQueryKey,
  normalizeOnboardingOptionsResponse,
} from "@/modules/onboarding/lib/onboarding-options";
import { useAuthStore } from "@/store";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import { buildMetabolismResultViewModel } from "./result-view-model.js";
import {
  buildOnboardingPreferencePatch,
  buildOnboardingSyncPatch,
  buildPersonalizationPatch,
  formatNumber,
  getMacroBalanceMessage,
  isOnboardingPreferenceField,
  normalizeCatalogIds,
  normalizeCustomItems,
  unwrapApiData,
} from "../../lib/personalization.js";
import {
  hasChipLabel,
  normalizeChipKey,
  normalizeChipLabel,
} from "../../lib/chip-selection.js";

const tone = ONBOARDING_ACCENTS.amber;

const editKeys = {
  dailyCalories: "dailyCalories",
  proteinGram: "proteinGram",
  carbsGram: "carbsGram",
  fatGram: "fatGram",
  recommendedWaterMl: "recommendedWaterMl",
  currentWeight: "currentWeight",
  targetWeight: "targetWeight",
  goal: "goal",
  weeklyWeightChangeGoal: "weeklyWeightChangeGoal",
  mealsPerDay: "mealsPerDay",
  weeklyWorkoutDays: "weeklyWorkoutDays",
  activityLevel: "activityLevel",
  foodBudget: "foodBudget",
  allergies: "allergies",
  dietRequirements: "dietRequirements",
  dislikedFoods: "dislikedFoods",
  workoutExperience: "workoutExperience",
  sleepHours: "sleepHours",
  injurySeverity: "injurySeverity",
  forbiddenExercises: "forbiddenExercises",
};

const optionSets = {
  goal: ["lose", "maintain", "gain"],
  weeklyWeightChangeGoal: [0.25, 0.5, 0.75, 1],
  mealsPerDay: [2, 3, 4, 5],
  weeklyWorkoutDays: [2, 3, 4, 5, 6],
  activityLevel: [
    "sedentary",
    "lightly-active",
    "moderately-active",
    "very-active",
  ],
  workoutExperience: ["beginner", "intermediate", "advanced"],
  injurySeverity: ["none", "mild", "moderate", "severe"],
};

const textareaFields = new Set([editKeys.forbiddenExercises]);
const chipFieldConfigs = {
  [editKeys.allergies]: {
    idsKey: "allergyIds",
    legacyIdsKey: "allergyIngredientIds",
    customKey: "customAllergies",
    optionsKey: "allergies",
  },
  [editKeys.dietRequirements]: {
    idsKey: "dietRequirementIds",
    customKey: "customDietRequirements",
    optionsKey: "dietRequirements",
  },
  [editKeys.dislikedFoods]: {
    idsKey: "dislikedFoodIds",
    customKey: "customDislikedFoods",
    optionsKey: "foods",
  },
};
const chipFields = new Set(Object.keys(chipFieldConfigs));
const onboardingRecalculationFields = new Set([
  editKeys.currentWeight,
  editKeys.goal,
  editKeys.activityLevel,
]);

const extractOptions = (response, optionsKey) =>
  normalizeOnboardingOptionsResponse(response, optionsKey);

const mergeOptions = (...groups) => {
  const map = new Map();

  for (const group of groups) {
    for (const item of Array.isArray(group) ? group : []) {
      if (!item?.id) continue;
      map.set(Number(item.id), item);
    }
  }

  return Array.from(map.values());
};

const formatResultNumber = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return new Intl.NumberFormat("en-US").format(Math.round(numberValue));
};

const premiumSurface =
  "border-[#ff990038] bg-[rgba(18,12,7,0.92)] shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl";
const premiumTile =
  "border-[#ff99002e] bg-[rgba(30,20,11,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
const premiumTextMuted = "text-white/55";
const premiumTextSecondary = "text-white/72";

const editableFieldMeta = {
  [editKeys.dailyCalories]: {
    icon: FlameIcon,
    label: "Kunlik kaloriya",
    unit: "kcal",
    step: 25,
    min: 800,
    formatOptions: { maximumFractionDigits: 0 },
    helper: "AI reja shu kunlik limitdan boshlanadi.",
  },
  [editKeys.proteinGram]: {
    icon: SaladIcon,
    label: "Oqsil",
    unit: "g",
    step: 5,
    min: 0,
    formatOptions: { maximumFractionDigits: 0 },
    helper: "Oqsil miqdori to'yimlilik va mushak saqlashga ta'sir qiladi.",
  },
  [editKeys.carbsGram]: {
    icon: UtensilsIcon,
    label: "Uglevod",
    unit: "g",
    step: 5,
    min: 0,
    formatOptions: { maximumFractionDigits: 0 },
    helper: "Uglevod energiya va mashg'ulot ritmini balanslaydi.",
  },
  [editKeys.fatGram]: {
    icon: FlameIcon,
    label: "Yog'",
    unit: "g",
    step: 1,
    min: 0,
    formatOptions: { maximumFractionDigits: 0 },
    helper: "Yog' miqdorini juda past tushirmaslik tavsiya qilinadi.",
  },
  [editKeys.recommendedWaterMl]: {
    icon: DropletsIcon,
    label: "Suv",
    unit: "L",
    step: 0.1,
    min: 0.5,
    formatOptions: { maximumFractionDigits: 1 },
    helper: "Kunlik suv maqsadi tracking ekranlarida ishlatiladi.",
    water: true,
  },
};

const metricIconMap = {
  currentWeight: ScaleIcon,
  targetWeight: TargetIcon,
  weightDiff: ActivityIcon,
  weeklyPace: GaugeIcon,
  protein: SaladIcon,
  carbs: UtensilsIcon,
  fat: FlameIcon,
  water: DropletsIcon,
  steps: FootprintsIcon,
  bmr: GaugeIcon,
  tdee: ActivityIcon,
  bmi: ScaleIcon,
  age: GaugeIcon,
  date: CalendarDaysIcon,
  meals: UtensilsIcon,
  workouts: ActivityIcon,
  activity: ActivityIcon,
  adjustment: TargetIcon,
  final: CheckIcon,
  budget: WalletCardsIcon,
};

const IconBubble = ({
  icon: Icon,
  water = false,
  className,
  iconClassName,
  glow = false,
}) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center rounded-full border",
      water
        ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-300"
        : "border-[#ff990030] bg-[#ff9800]/12 text-[#ffb000]",
      glow && "shadow-[0_0_28px_rgba(255,152,0,0.28)]",
      className,
    )}
  >
    <Icon className={cn("size-4", iconClassName)} aria-hidden="true" />
  </span>
);

const EditBadgeButton = ({ label, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`${label}ni tahrirlash`}
    className={cn(
      "inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-[#ff990038] bg-[#ff9800]/12 text-[#ffb000] transition hover:border-[#ff990078] hover:bg-[#ff9800]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9800]/50",
      className,
    )}
  >
    <PencilIcon className="size-4" aria-hidden="true" />
  </button>
);

const SectionCard = ({ title, badge, children, className }) => (
  <section
    className={cn(
      "shrink-0 rounded-[1.45rem] border p-4 text-white",
      premiumSurface,
      className,
    )}
  >
    {title ? (
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-black leading-tight text-white">
          {title}
        </h2>
        {badge ? (
          <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-white/70">
            {badge}
          </span>
        ) : null}
      </div>
    ) : null}
    {children}
  </section>
);

const StatChip = ({ item }) => {
  const Icon = metricIconMap[item.key] ?? TargetIcon;

  return (
    <div
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-[1rem] border p-3",
        premiumTile,
      )}
    >
      <IconBubble icon={Icon} className="size-10" />
      <span className="min-w-0">
        <span className={cn("block text-[11px] font-medium leading-tight", premiumTextSecondary)}>
          {item.label}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[15px] font-black leading-tight text-white min-[390px]:text-base",
            item.positive && "text-[#52E37B]",
          )}
        >
          {item.value}
        </span>
      </span>
    </div>
  );
};

const MetricTile = ({ item, compact = false }) => {
  const Icon = metricIconMap[item.key] ?? TargetIcon;
  const water = item.key === "water";

  return (
    <div
      className={cn(
        "flex min-h-[64px] items-center gap-3 rounded-[1rem] border p-3",
        premiumTile,
        compact && "min-h-[58px]",
      )}
    >
      <IconBubble icon={Icon} water={water} className="size-9" />
      <span className="min-w-0">
        <span className={cn("block text-[11px] font-medium leading-tight", premiumTextSecondary)}>
          {item.label}
        </span>
        <span className="mt-0.5 block text-[15px] font-black leading-tight text-white">
          {item.value}
        </span>
      </span>
    </div>
  );
};

const MacroCard = ({ item, onEdit, water = false }) => {
  const Icon =
    item.label === "Oqsil"
      ? SaladIcon
      : item.label === "Uglevod"
        ? UtensilsIcon
        : item.label === "Yog'"
          ? FlameIcon
          : DropletsIcon;

  return (
    <div
      className={cn(
        "relative flex min-h-[92px] items-center gap-3 rounded-[1rem] border p-3 pr-12 text-left transition",
        premiumTile,
        onEdit && "hover:border-[#ff990078] hover:bg-[#ff9800]/10",
      )}
    >
      {onEdit ? (
        <EditBadgeButton
          label={item.label}
          onClick={onEdit}
          className="absolute right-2.5 top-2.5 min-h-8 min-w-8"
        />
      ) : null}
      <IconBubble icon={Icon} water={water} className="size-10 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[11px] font-medium leading-tight", premiumTextSecondary)}>
          {item.label}
        </span>
        <span className="mt-1 block whitespace-nowrap text-base font-black leading-none text-white min-[390px]:text-lg">
          {item.grams}
        </span>
      </span>
      <span className="shrink-0 rounded-lg bg-white/8 px-2 py-1 text-[11px] font-black text-white/78">
        {item.percent}
      </span>
    </div>
  );
};

const ProgressBar = ({ value }) => (
  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-[#ffb000] to-[#ff6a00] shadow-[0_0_18px_rgba(255,152,0,0.38)]"
      style={{ width: `${Math.max(4, Math.min(100, Number(value) || 0))}%` }}
    />
  </div>
);

const calculationSummaryKeys = ["bmr", "tdee", "final"];

const getCalculationBadge = (item) => {
  if (item.key === "bmr") return "asos";
  if (item.key === "activity") return "x";
  if (item.key === "tdee") return "=";
  if (item.key === "adjustment") {
    if (String(item.value).startsWith("-")) return "defitsit";
    if (String(item.value).startsWith("+")) return "profitsit";
    return "0";
  }
  if (item.key === "final") return "target";
  return item.operator;
};

const CalculationSummary = ({ steps }) => {
  const summarySteps = calculationSummaryKeys
    .map((key) => steps.find((step) => step.key === key))
    .filter(Boolean);

  return (
    <div className="rounded-[1.15rem] border border-[#ff99002a] bg-[rgba(30,20,11,0.58)] p-3">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
        {summarySteps.map((item, index) => (
          <React.Fragment key={item.key}>
            <div
              className={cn(
                "min-w-0 rounded-[0.9rem] border px-2.5 py-2 text-center",
                item.highlighted
                  ? "border-[#ff990066] bg-[#ff9800]/14 shadow-[0_0_24px_rgba(255,152,0,0.2)]"
                  : "border-[#ff990020] bg-black/18",
              )}
            >
              <span className={cn("block text-[10px] font-black uppercase", premiumTextMuted)}>
                {item.key === "final" ? "Target" : item.label}
              </span>
              <span className="mt-1 block truncate text-[12px] font-black leading-tight text-white">
                {item.value}
              </span>
            </div>
            {index < summarySteps.length - 1 ? (
              <ChevronRightIcon className="size-4 shrink-0 text-[#ffb000]" aria-hidden="true" />
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const CalculationStep = ({ item, index, isLast }) => {
  const Icon = metricIconMap[item.key] ?? TargetIcon;
  const badge = getCalculationBadge(item);

  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-center">
        <IconBubble
          icon={Icon}
          className={cn(
            "size-9",
            item.highlighted && "border-[#ff99006c] bg-[#ff9800]/20",
          )}
          iconClassName="size-4"
          glow={item.highlighted}
        />
        {!isLast ? (
          <div className="mt-1 h-8 w-px rounded-full bg-gradient-to-b from-[#ff9800]/42 to-[#ff9800]/8" />
        ) : null}
      </div>
      <div
        className={cn(
          "rounded-[1rem] border p-3",
          item.highlighted
            ? "border-[#ff99007a] bg-gradient-to-br from-[#ff9800]/18 to-[#1e140b]/80 shadow-[0_0_28px_rgba(255,152,0,0.22)]"
            : premiumTile,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={cn("block text-[11px] font-bold leading-tight", premiumTextSecondary)}>
              {index + 1}. {item.label}
            </span>
            <span className="mt-1 block text-[17px] font-black leading-tight text-white">
              {item.value}
            </span>
          </div>
          {badge ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-1 text-[11px] font-black",
                item.highlighted
                  ? "border-[#ff990066] bg-[#ff9800]/20 text-[#ffcf70]"
                  : "border-[#ff99002e] bg-black/20 text-white/70",
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <p className={cn("mt-1.5 text-[11px] font-medium leading-4", premiumTextMuted)}>
          {item.caption}
        </p>
      </div>
    </div>
  );
};

const MacroEnergyRow = ({ item }) => (
  <div className="grid grid-cols-[minmax(76px,0.8fr)_auto] items-center gap-x-3 gap-y-2 rounded-[1rem]">
    <div className="flex min-w-0 items-center gap-3">
      <IconBubble
        icon={
          item.label === "Oqsil"
            ? SaladIcon
            : item.label === "Uglevod"
              ? UtensilsIcon
              : FlameIcon
        }
        className="size-9"
      />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-black text-white">
          {item.label}
        </span>
        <span className={cn("block text-[11px] font-bold", premiumTextSecondary)}>
          {item.grams}
        </span>
      </span>
    </div>
    <div className="text-right">
      <span className="block text-[13px] font-black text-white">{item.kcal}</span>
      <span className="mt-1 inline-flex rounded-full bg-white/8 px-2 py-1 text-[11px] font-black text-white/72">
        {item.percent}
      </span>
    </div>
    <div className="col-span-2">
      <ProgressBar value={item.progress} />
    </div>
  </div>
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

const getEditValue = (field, result, onboarding) => {
  if (!field) return "";

  if (field === editKeys.currentWeight) {
    return onboarding?.currentWeight?.value ?? result?.currentWeight ?? "";
  }

  if (field === editKeys.recommendedWaterMl) {
    const waterMl = Number(result?.recommendedWaterMl);
    return Number.isFinite(waterMl) && waterMl > 0 ? waterMl / 1000 : "";
  }

  if (field === editKeys.forbiddenExercises) {
    return (onboarding?.forbiddenExercises ?? []).join("\n");
  }

  if (isOnboardingPreferenceField(field)) {
    return onboarding?.[field] ?? "";
  }

  return result?.[field] ?? "";
};

const formatEditDisplayValue = (field, result, onboarding) => {
  const meta = editableFieldMeta[field];
  if (!meta) return "-";
  const rawValue = getEditValue(field, result, onboarding);
  const numberValue = Number(rawValue);
  if (!Number.isFinite(numberValue)) return "-";

  const maximumFractionDigits =
    meta.formatOptions?.maximumFractionDigits ?? (field === editKeys.recommendedWaterMl ? 1 : 0);

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(numberValue)} ${meta.unit}`;
};

const getChipValue = (field, onboarding) => {
  const config = chipFieldConfigs[field];
  if (!config) {
    return { ids: [], customItems: [] };
  }

  return {
    ids:
      onboarding?.[config.idsKey] ??
      (config.legacyIdsKey ? onboarding?.[config.legacyIdsKey] : []) ??
      [],
    customItems: onboarding?.[config.customKey] ?? [],
  };
};

const CatalogChipEditor = ({ field, value, onChange, t }) => {
  const config = chipFieldConfigs[field];
  const [search, setSearch] = React.useState("");
  const searchLabel = normalizeChipLabel(search);
  const searchKey = normalizeChipKey(searchLabel);
  const selectedIds = normalizeCatalogIds(value.ids);
  const customItems = normalizeCustomItems(value.customItems);
  const baseQuery = useGetQuery({
    url: getOnboardingOptionsPath(config.optionsKey),
    queryProps: {
      queryKey: getOnboardingOptionsQueryKey(
        config.optionsKey,
        "post-result",
        field,
      ),
      staleTime: 60000,
    },
  });
  const searchQuery = useGetQuery({
    url: getOnboardingOptionsPath(config.optionsKey),
    params: { q: searchLabel },
    queryProps: {
      queryKey: getOnboardingOptionsQueryKey(
        config.optionsKey,
        "post-result",
        field,
        searchLabel,
      ),
      enabled: searchLabel.length >= 2,
      staleTime: 15000,
    },
  });
  const baseOptions = React.useMemo(
    () => extractOptions(baseQuery.data, config.optionsKey),
    [baseQuery.data, config.optionsKey],
  );
  const searchOptions = React.useMemo(
    () => extractOptions(searchQuery.data, config.optionsKey),
    [config.optionsKey, searchQuery.data],
  );
  const options = React.useMemo(
    () => mergeOptions(baseOptions, searchOptions),
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
    !hasChipLabel(customItems, searchLabel);

  const commit = (ids, nextCustom = customItems) => {
    onChange({
      ids: normalizeCatalogIds(ids),
      customItems: normalizeCustomItems(nextCustom),
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(
            `onboarding.postOnboarding.result.edit.${field}.placeholder`,
          )}
          className="h-11 pl-9"
        />
      </div>

      {selectedIds.length || customItems.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <button
              key={`${field}-${id}`}
              type="button"
              onClick={() => commit(selectedIds.filter((item) => item !== id))}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <span className="truncate">
                {optionMap.get(id)?.name ?? `#${id}`}
              </span>
              <XIcon className="size-3.5" />
            </button>
          ))}
          {customItems.map((label) => (
            <button
              key={`${field}-custom-${label}`}
              type="button"
              onClick={() => {
                const key = normalizeChipKey(label);
                commit(
                  selectedIds,
                  customItems.filter((item) => normalizeChipKey(item) !== key),
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
              {item?.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-8 rounded-lg object-cover"
                />
              ) : (
                <SaladIcon className="size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{item.name}</span>
                {item?.isOnboarding === false ? (
                  <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                    {t("onboarding.chipSelect.nonOnboarding")}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}

        {canAddCustom ? (
          <button
            type="button"
            onClick={() => {
              commit(selectedIds, [...customItems, searchLabel]);
              setSearch("");
            }}
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left text-sm font-semibold text-primary"
          >
            <PlusIcon className="size-4" />
            {t("onboarding.chipSelect.addCustom", { value: searchLabel })}
          </button>
        ) : null}
      </div>

      {baseQuery.isLoading || searchQuery.isFetching ? (
        <div className="flex justify-center py-1">
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
};

const EditDrawer = ({
  open,
  onOpenChange,
  field,
  result,
  onboarding,
  onSave,
  saving,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = React.useState("");
  const [chipValue, setChipValue] = React.useState({
    ids: [],
    customItems: [],
  });

  React.useLayoutEffect(() => {
    if (!field || !result) return;

    if (chipFields.has(field)) {
      setChipValue(getChipValue(field, onboarding));
      return;
    }

    setValue(getEditValue(field, result, onboarding));
  }, [field, onboarding, result]);

  if (!field) return null;

  const isOptionField = Object.prototype.hasOwnProperty.call(optionSets, field);
  const isChipField = chipFields.has(field);
  const isTextarea = textareaFields.has(field);
  const editMeta = editableFieldMeta[field];
  const EditIcon = editMeta?.icon ?? TargetIcon;
  const title = t(`onboarding.postOnboarding.result.edit.${field}.title`);
  const description = t(
    `onboarding.postOnboarding.result.edit.${field}.description`,
  );
  const rawValue = String(value ?? "").trim();
  const numberValue = Number(value);
  const hasNumberValue = rawValue !== "" && Number.isFinite(numberValue);
  const isNumberField = !isChipField && !isOptionField && !isTextarea;
  const currentDisplayValue = formatEditDisplayValue(field, result, onboarding);
  const saveDisabled =
    saving ||
    (isNumberField && !hasNumberValue) ||
    (isOptionField && rawValue === "");
  const showLowCalorieWarning =
    field === editKeys.dailyCalories &&
    hasNumberValue &&
    numberValue < 1200;
  const showLowFatWarning =
    field === editKeys.fatGram &&
    hasNumberValue &&
    Number(onboarding?.currentWeight?.value ?? result?.currentWeight) > 0 &&
    numberValue <
      Number(onboarding?.currentWeight?.value ?? result.currentWeight) * 0.5;
  const macroEnergyPreview =
    [
      editKeys.proteinGram,
      editKeys.carbsGram,
      editKeys.fatGram,
    ].includes(field) && hasNumberValue
      ? Math.round(numberValue * (field === editKeys.fatGram ? 9 : 4))
      : null;
  const saveValue = isNumberField
    ? field === editKeys.recommendedWaterMl
      ? Math.round(numberValue * 1000)
      : Number(value)
    : value;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="text-white before:border-[#ff990038] before:bg-[#120c07] before:shadow-[0_-24px_80px_rgba(255,106,0,0.18)] data-[vaul-drawer-direction=bottom]:h-[560px] data-[vaul-drawer-direction=bottom]:max-h-[88vh] data-[vaul-drawer-direction=bottom]:max-w-[430px]">
        <DrawerHeader className="px-5 pb-3 pt-4 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <div className="flex items-start gap-3">
            <IconBubble
              icon={EditIcon}
              water={editMeta?.water}
              className="size-12"
              glow
            />
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-lg font-black text-white">
                {title}
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-[13px] font-medium leading-5 text-white/62">
                {description}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody className="space-y-4 px-5 pb-3">
          {editMeta ? (
            <div className="rounded-[1.25rem] border border-[#ff99002e] bg-[rgba(30,20,11,0.72)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white/45">
                  Hozirgi qiymat
                </span>
                <span className="rounded-full bg-[#ff9800]/12 px-2.5 py-1 text-[11px] font-black text-[#ffcf70]">
                  {editMeta.unit}
                </span>
              </div>
              <div className="mt-2 text-2xl font-black leading-none text-white">
                {currentDisplayValue}
              </div>
              <p className="mt-3 text-[13px] font-medium leading-5 text-white/62">
                {editMeta.helper}
              </p>
            </div>
          ) : null}

          {isChipField ? (
            <CatalogChipEditor
              field={field}
              value={chipValue}
              onChange={setChipValue}
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
          ) : isTextarea ? (
            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-36"
              placeholder={t(
                "onboarding.postOnboarding.result.edit.forbiddenExercises.placeholder",
              )}
            />
          ) : editMeta ? (
            <div className="space-y-2">
              <label className="text-[13px] font-black text-white">
                Yangi qiymat
              </label>
              <NumberField
                value={hasNumberValue ? numberValue : undefined}
                onValueChange={(nextValue) =>
                  setValue(
                    nextValue === null || nextValue === undefined
                      ? ""
                      : String(nextValue),
                  )
                }
                min={editMeta.min}
                step={editMeta.step}
                format={{ useGrouping: false, ...editMeta.formatOptions }}
              >
                <NumberFieldGroup className="h-14 rounded-[1.15rem] border-[#ff990038] bg-black/28 text-white shadow-none focus-within:border-[#ff990078] focus-within:ring-[#ff9800]/30">
                  <NumberFieldDecrement className="w-12 border-r border-[#ff99001f] text-[#ffb000] hover:bg-[#ff9800]/10" />
                  <NumberFieldInput
                    aria-label={title}
                    inputMode="decimal"
                    onFocus={(event) => {
                      event.currentTarget.select();
                    }}
                    className="text-center text-xl font-black"
                  />
                  <NumberFieldIncrement className="w-12 border-l border-[#ff99001f] text-[#ffb000] hover:bg-[#ff9800]/10" />
                </NumberFieldGroup>
              </NumberField>
            </div>
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
            <div className="rounded-[1.15rem] border border-[#ff990024] bg-[#ff9800]/8 p-3 text-[13px] font-medium text-white/66">
              {t("onboarding.postOnboarding.result.recommended")}:{" "}
              {formatNumber(result.dailyCalories)} kcal
            </div>
          ) : null}

          {field === editKeys.proteinGram &&
          Number(onboarding?.currentWeight?.value ?? result?.currentWeight) > 0 ? (
            <div className="rounded-[1.15rem] border border-[#ff990024] bg-[#ff9800]/8 p-3 text-[13px] font-medium text-white/66">
              {t("onboarding.postOnboarding.result.proteinRecommendation", {
                min: Math.round(
                  Number(onboarding?.currentWeight?.value ?? result.currentWeight) *
                    1.6,
                ),
                max: Math.round(
                  Number(onboarding?.currentWeight?.value ?? result.currentWeight) *
                    2.2,
                ),
              })}
            </div>
          ) : null}

          {field === editKeys.carbsGram || field === editKeys.fatGram ? (
            <div className="rounded-[1.15rem] border border-[#ff990024] bg-[#ff9800]/8 p-3 text-[13px] font-medium text-white/66">
              {getMacroBalanceMessage(
                {
                  ...result,
                  [field]: hasNumberValue ? numberValue : result[field],
                },
                t,
              )}
            </div>
          ) : null}

          {macroEnergyPreview !== null ? (
            <div className="rounded-[1.15rem] border border-[#ff990024] bg-[#ff9800]/8 p-3 text-[13px] font-medium text-white/66">
              Makro energiya: {formatResultNumber(macroEnergyPreview)} kcal
            </div>
          ) : null}

          {showLowCalorieWarning || showLowFatWarning ? (
            <div className="rounded-[1.15rem] border border-red-400/25 bg-red-500/10 p-3 text-[13px] font-semibold text-red-200">
              {showLowCalorieWarning
                ? t("onboarding.postOnboarding.result.lowCalorieWarning")
                : t("onboarding.postOnboarding.result.lowFatWarning")}
            </div>
          ) : null}
        </DrawerBody>
        <DrawerFooter className="p-0">
          <Button
            type="button"
            className="h-14 w-full rounded-none border-0 bg-gradient-to-r from-[#ffb000] to-[#ff6a00] text-[15px] font-black text-white shadow-[0_-10px_40px_rgba(255,106,0,0.24)] hover:from-[#ffc13a] hover:to-[#ff7a1a]"
            onClick={() => {
              if (saveDisabled) return;

              onSave(
                field,
                isChipField
                  ? chipValue
                  : isOptionField
                    ? value
                    : isTextarea
                    ? value
                    : saveValue,
              );
            }}
            disabled={saveDisabled}
          >
            {saving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            {t("onboarding.postOnboarding.result.save")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const ResultContent = ({ result, onboarding, onEdit }) => {
  const snapshot = React.useMemo(
    () => buildMetabolismResultViewModel(result, onboarding),
    [onboarding, result],
  );
  const macroItems = [
    {
      key: "protein",
      ...snapshot.macros.protein,
      onEdit: () => onEdit(editKeys.proteinGram),
    },
    {
      key: "carbs",
      ...snapshot.macros.carbs,
      onEdit: () => onEdit(editKeys.carbsGram),
    },
    {
      key: "fat",
      ...snapshot.macros.fat,
      onEdit: () => onEdit(editKeys.fatGram),
    },
    {
      key: "water",
      label: "Suv",
      grams: snapshot.waterLiters,
      percent: "-",
      onEdit: () => onEdit(editKeys.recommendedWaterMl),
    },
  ];

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[430px] flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden bg-[#070503] px-3 pb-20 pt-3 text-white min-[390px]:px-4">
      <section
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[1.65rem] border p-5",
          premiumSurface,
          "shadow-[0_0_0_1px_rgba(255,153,0,0.08),0_28px_90px_rgba(255,106,0,0.12)]",
        )}
      >
        <div className="pointer-events-none absolute -right-10 top-6 hidden size-44 rotate-12 rounded-[2rem] border border-[#ff990030] bg-[#ff9800]/10 shadow-[0_0_80px_rgba(255,152,0,0.25)] min-[420px]:block" />
        <div className="pointer-events-none absolute right-8 top-14 hidden min-[420px]:block">
          <div className="flex size-16 rotate-[-18deg] items-center justify-center rounded-[1.4rem] bg-[#ff9800]/12 text-[#ffb000] shadow-[0_0_55px_rgba(255,152,0,0.45)]">
            <CheckIcon className="size-10 stroke-[4]" aria-hidden="true" />
          </div>
        </div>

        <div className="relative max-w-[520px]">
          <IconBubble icon={SparklesIcon} className="size-11" glow />
          <h1 className="mt-4 max-w-[240px] text-[1.7rem] font-black leading-[1.06] tracking-tight text-white min-[390px]:text-[1.85rem]">
            <span className="sr-only">Metabolizm hisobingiz tayyor</span>
            <span aria-hidden="true">
              Metabolizm
              <br />
              hisobingiz tayyor
            </span>
          </h1>
          <p className={cn("mt-3 max-w-[480px] text-[13px] font-medium leading-5", premiumTextSecondary)}>
            {snapshot.description}
          </p>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          {snapshot.heroStats.map((item) => (
            <StatChip key={item.key} item={item} />
          ))}
        </div>
      </section>

      <button
        type="button"
        className={cn(
          "flex min-h-[86px] w-full shrink-0 items-center gap-4 rounded-[1.35rem] border p-4 text-left transition hover:border-[#ff99006e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9800]/50",
          premiumSurface,
        )}
      >
        <IconBubble icon={BrainIcon} className="size-12" glow />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-black text-[#ffb000]">
            AI tahlili
          </span>
          <span className={cn("mt-1 block text-[13px] font-medium leading-5", premiumTextSecondary)}>
            {snapshot.aiAnalysis}
          </span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-white/70" aria-hidden="true" />
      </button>

      <SectionCard title="Kunlik kaloriya maqsadi" className="p-4">
        <div className="grid gap-4">
          <div className="relative flex min-h-[168px] flex-col justify-center rounded-[1.2rem] pr-10 text-left">
            <EditBadgeButton
              label="Kunlik kaloriya maqsadi"
              onClick={() => onEdit(editKeys.dailyCalories)}
              className="absolute right-0 top-0"
            />
            <div className="flex items-center gap-4">
              <IconBubble icon={FlameIcon} className="size-16" iconClassName="size-8" glow />
              <div>
                <span className={cn("block text-[11px] font-black", premiumTextSecondary)}>
                  Kunlik target
                </span>
                <div className="mt-2 flex flex-wrap items-end gap-x-2">
                  <span className="text-[2.55rem] font-black leading-none tracking-tight text-white drop-shadow-[0_10px_26px_rgba(0,0,0,0.55)] min-[390px]:text-[2.8rem]">
                    {snapshot.dailyCalories}
                  </span>
                  <span className="pb-1 text-lg font-black text-[#ffb000]">
                    kcal
                  </span>
                </div>
              </div>
            </div>
          <span className="mt-4 inline-flex w-fit rounded-full bg-[#ff9800]/10 px-3 py-1.5 text-[11px] font-bold text-white/72">
              Kunlik target
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {macroItems.map((item) => (
              <MacroCard
                key={item.key}
                item={item}
                onEdit={item.onEdit}
                water={item.key === "water"}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Hisoblash zanjiri">
        <p className={cn("-mt-1 mb-3 text-[12px] font-medium leading-5", premiumTextSecondary)}>
          BMRdan boshlanib, faollik va maqsad sozlamasi orqali yakuniy kunlik
          target hisoblanadi.
        </p>
        <CalculationSummary steps={snapshot.calculationSteps} />
        <div className="mt-4 grid gap-1">
          {snapshot.calculationSteps.map((item, index) => (
            <CalculationStep
              key={item.key}
              item={item}
              index={index}
              isLast={index === snapshot.calculationSteps.length - 1}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#ffb000]">
            <InfoIcon className="size-3.5" aria-hidden="true" />
            Formula: {snapshot.formulaName}
          </span>
          {snapshot.warningPills.map((warning) => (
            <span
              key={warning}
              className="rounded-full border border-[#ff990030] bg-[#ff9800]/10 px-2.5 py-1 text-[11px] font-bold text-[#ffcf70]"
            >
              {warning}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Makro energiya" badge={snapshot.macroDelta}>
        <div className="grid gap-4">
          <MacroEnergyRow item={snapshot.macros.protein} />
          <MacroEnergyRow item={snapshot.macros.carbs} />
          <MacroEnergyRow item={snapshot.macros.fat} />
        </div>
      </SectionCard>

      <SectionCard title="Kunlik maqsad va ko'rsatkichlar">
        <div className="grid grid-cols-2 gap-2.5">
          {snapshot.dailyIndicators.map((item) => (
            <MetricTile key={item.key} item={item} compact />
          ))}
        </div>
      </SectionCard>
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
    url: "/user/onboarding/metabolism-result",
    queryProps: {
      queryKey: ["onboarding", "metabolism-result"],
      staleTime: 15000,
    },
  });
  const resultBody = unwrapApiData(resultQuery.data);
  const hasWrappedResult =
    resultBody &&
    typeof resultBody === "object" &&
    Object.prototype.hasOwnProperty.call(resultBody, "result");
  const result = hasWrappedResult ? resultBody.result : resultBody;
  const onboarding = resultBody?.onboarding ?? null;
  const { mutateAsync: patchResult, isPending: isSaving } = usePatchQuery({
    queryKey: ["onboarding", "metabolism-result"],
  });
  const { mutateAsync: updateOnboarding, isPending: isSavingOnboarding } =
    usePutQuery({
      queryKey: ["onboarding", "metabolism-result"],
    });
  const { mutateAsync: confirmMetabolism, isPending: isConfirming } =
    usePostQuery();

  const handleSave = async (field, value) => {
    try {
      if (isOnboardingPreferenceField(field)) {
        const patch = buildOnboardingPreferencePatch(field, value, onboarding);
        await updateOnboarding({
          url: "/user/onboarding/user",
          attributes: patch,
        });

        if (onboardingRecalculationFields.has(field)) {
          await patchResult({
            url: "/user/onboarding/metabolism-result",
            attributes: {},
          });
        }
      } else {
        const patch = buildPersonalizationPatch(field, value);
        await patchResult({
          url: "/user/onboarding/metabolism-result",
          attributes: patch,
        });

        const onboardingPatch = buildOnboardingSyncPatch(
          field,
          value,
          onboarding,
        );
        if (Object.keys(onboardingPatch).length > 0) {
          await updateOnboarding({
            url: "/user/onboarding/user",
            attributes: onboardingPatch,
          });
        }
      }

      await queryClient.invalidateQueries({
        queryKey: ["onboarding", "status"],
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
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
      const response = await confirmMetabolism({
        url: "/user/onboarding/confirm-metabolism",
      });
      const body = unwrapApiData(response);
      setOnboardingFlow({
        onboardingFlowStatus: body?.onboardingFlowStatus ?? body?.status,
        onboardingNextPath:
          body?.onboardingNextPath ?? getUserOnboardingPlanPreviewPath(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["onboarding", "plan-preflight"],
      });
      navigate(getUserOnboardingPlanPreviewPath(), { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message || t("onboarding.postOnboarding.result.confirmError"),
      );
    }
  };

  useOnboardingFooter(
    <Button
      type="button"
      size="lg"
      className={cn(
        "h-14 w-full rounded-full border-transparent bg-gradient-to-r text-[15px] font-black shadow-[0_18px_48px_rgba(255,106,0,0.34)]",
        tone.buttonTone,
      )}
      onClick={handleNext}
      disabled={!result || isConfirming}
    >
      {isConfirming ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <ChevronRightIcon className="size-4" />
      )}
      Rejani yaratish
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
      className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-[#070503]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <PageAura tone={tone} />
      <ResultContent
        result={result}
        onboarding={onboarding}
        onEdit={setEditing}
      />
      <EditDrawer
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        field={editing}
        result={result}
        onboarding={onboarding}
        onSave={handleSave}
        saving={isSaving || isSavingOnboarding}
      />
    </motion.div>
  );
};

export default Index;
