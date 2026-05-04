import React from "react";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  ChevronRightIcon,
  DumbbellIcon,
  DropletsIcon,
  FlameIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SaladIcon,
  ScaleIcon,
  SearchIcon,
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
import { Textarea } from "@/components/ui/textarea";
import {
  useGetQuery,
  usePatchQuery,
  usePostQuery,
  usePutQuery,
} from "@/hooks/api";
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
  buildOnboardingPreferencePatch,
  buildOnboardingSyncPatch,
  buildPersonalizationPatch,
  formatNumber,
  formatWeightDelta,
  getMacroBalanceMessage,
  isOnboardingPreferenceField,
  normalizeCustomEquipment,
  normalizeEquipmentIds,
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
  workoutLocation: "workoutLocation",
  equipment: "equipment",
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
  workoutLocation: ["home", "gym", "outdoor"],
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

const extractOptions = (response, optionsKey) => {
  const body = unwrapApiData(response) ?? {};
  const values = body?.[optionsKey];
  return Array.isArray(values) ? values : [];
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

const resultFallbacks = {
  calorie: 2100,
  weightDiff: -10,
  weeklyRate: 0.5,
  carbs: 230,
  protein: 160,
  fat: 65,
  waterMl: 2500,
  currentWeight: 70,
  goal: "Ozish",
  activity: "O'rtacha faol",
  budget: 250000,
};

const goalLabels = {
  lose: "Ozish",
  weight_loss: "Ozish",
  weightLoss: "Ozish",
  maintain: "Vazn saqlash",
  gain: "Mushak yig'ish",
  muscle_gain: "Mushak yig'ish",
  healthy_lifestyle: "Sog'lom turmush",
  performance: "Performance",
};

const activityLabels = {
  sedentary: "Passiv",
  "lightly-active": "Yengil faol",
  lightly_active: "Yengil faol",
  "moderately-active": "O'rtacha faol",
  moderately_active: "O'rtacha faol",
  "very-active": "Juda faol",
  very_active: "Juda faol",
};

const budgetPeriodSuffixes = {
  daily: "kuniga",
  weekly: "haftasiga",
  monthly: "oyiga",
};

const getNumberOrFallback = (value, fallback) => {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const formatResultNumber = (value) => formatNumber(value, "en-US");

const formatResultLiters = (value) => {
  const liters = getNumberOrFallback(value, resultFallbacks.waterMl) / 1000;
  const rounded = Math.round(liters * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} L`;
};

const resolveSummaryBudget = (onboarding = {}) => {
  const amount = getNumberOrFallback(
    onboarding?.foodBudget,
    resultFallbacks.budget,
  );
  const currency = onboarding?.budgetCurrency || "UZS";
  const period =
    budgetPeriodSuffixes[onboarding?.budgetPeriod] ?? budgetPeriodSuffixes.weekly;

  return `${formatResultNumber(amount)} ${currency} / ${period}`;
};

const resolveResultSnapshot = (result = {}, onboarding = {}) => {
  const goalKey = onboarding?.goal ?? result?.goal;
  const activityKey = onboarding?.activityLevel ?? result?.activityLevel;

  return {
    calories: getNumberOrFallback(result?.dailyCalories, resultFallbacks.calorie),
    weightDiff: getNumberOrFallback(
      result?.weightToChange,
      resultFallbacks.weightDiff,
    ),
    weeklyRate: getNumberOrFallback(
      result?.weeklyWeightChangeGoal ?? onboarding?.weeklyPace,
      resultFallbacks.weeklyRate,
    ),
    carbs: getNumberOrFallback(result?.carbsGram, resultFallbacks.carbs),
    protein: getNumberOrFallback(result?.proteinGram, resultFallbacks.protein),
    fat: getNumberOrFallback(result?.fatGram, resultFallbacks.fat),
    waterMl: getNumberOrFallback(
      result?.recommendedWaterMl,
      resultFallbacks.waterMl,
    ),
    currentWeight: getNumberOrFallback(
      onboarding?.currentWeight?.value ?? result?.currentWeight,
      resultFallbacks.currentWeight,
    ),
    goal: goalLabels[goalKey] ?? resultFallbacks.goal,
    activity: activityLabels[activityKey] ?? resultFallbacks.activity,
    budget: resolveSummaryBudget(onboarding),
  };
};

const EditGlyph = () => (
  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition group-hover:text-primary">
    <PencilIcon className="size-3.5" aria-hidden="true" />
  </span>
);

const HeroInfoButton = ({ label, value, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-h-[88px] items-start justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-muted/30 p-3 text-left transition hover:border-primary/30 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
  >
    <span>
      <span className="block text-[11px] font-semibold leading-4 text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-xl font-black leading-tight text-foreground">
        {value}
      </span>
    </span>
    <EditGlyph />
  </button>
);

const MetricCard = ({ icon: Icon, label, value, unit, water = false, onEdit }) => {
  const interactive = typeof onEdit === "function";
  const Component = interactive ? "button" : "div";

  return (
    <Component
      {...(interactive ? { type: "button", onClick: onEdit } : {})}
      className="flex min-h-[118px] flex-col justify-between rounded-[1.35rem] border border-border/70 bg-background/90 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          water
            ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
            : tone.badgeTone,
        )}
      >
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-black tracking-tight text-foreground">
          {value}
          {unit ? (
            <span className="ml-1 text-sm font-bold text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </span>
      </span>
    </Component>
  );
};

const SummaryItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-[1.1rem] border border-border/70 bg-background/80 p-3">
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone.badgeTone)}>
      <Icon className="size-4" aria-hidden="true" />
    </span>
    <span className="min-w-0">
      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-sm font-black text-foreground">
        {value}
      </span>
    </span>
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

  if (field === editKeys.forbiddenExercises) {
    return (onboarding?.forbiddenExercises ?? []).join("\n");
  }

  if (isOnboardingPreferenceField(field)) {
    return onboarding?.[field] ?? "";
  }

  return result?.[field] ?? "";
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
  const selectedIds = normalizeEquipmentIds(value.ids);
  const customItems = normalizeCustomEquipment(value.customItems);
  const baseQuery = useGetQuery({
    url: "/user/onboarding/options",
    queryProps: {
      queryKey: ["onboarding", "options", "post-result", field],
      staleTime: 60000,
    },
  });
  const searchQuery = useGetQuery({
    url: "/user/onboarding/options",
    params: { q: searchLabel },
    queryProps: {
      queryKey: ["onboarding", "options", "post-result", field, searchLabel],
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
    !hasChipLabel(customItems, searchLabel);

  const commit = (ids, nextCustom = customItems) => {
    onChange({
      ids: normalizeEquipmentIds(ids),
      customItems: normalizeCustomEquipment(nextCustom),
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

const EquipmentEditor = ({ value, onChange, t }) => {
  const [search, setSearch] = React.useState("");
  const searchLabel = normalizeChipLabel(search);
  const searchKey = normalizeChipKey(searchLabel);
  const selectedIds = normalizeEquipmentIds(value.equipmentIds);
  const customEquipment = normalizeCustomEquipment(value.customEquipment);
  const baseQuery = useGetQuery({
    url: "/user/onboarding/personalization-options",
    queryProps: {
      queryKey: ["onboarding", "personalization-options", "equipment"],
      staleTime: 60000,
    },
  });
  const searchQuery = useGetQuery({
    url: "/user/onboarding/personalization-options",
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
          placeholder={t(
            "onboarding.postOnboarding.result.equipmentPlaceholder",
          )}
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
              <span className="truncate">
                {optionMap.get(id)?.name ?? `#${id}`}
              </span>
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
  const [equipmentValue, setEquipmentValue] = React.useState({
    equipmentIds: [],
    customEquipment: [],
  });
  const [chipValue, setChipValue] = React.useState({
    ids: [],
    customItems: [],
  });

  React.useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled || !field || !result) return;

      if (chipFields.has(field)) {
        setChipValue(getChipValue(field, onboarding));
        return;
      }

      if (field === editKeys.equipment) {
        setEquipmentValue({
          equipmentIds: result.equipmentIds ?? [],
          customEquipment: result.customEquipment ?? [],
        });
        return;
      }

      setValue(getEditValue(field, result, onboarding));
    });

    return () => {
      cancelled = true;
    };
  }, [field, onboarding, result]);

  if (!field) return null;

  const isOptionField = Object.prototype.hasOwnProperty.call(optionSets, field);
  const isEquipment = field === editKeys.equipment;
  const isChipField = chipFields.has(field);
  const isTextarea = textareaFields.has(field);
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
          {isChipField ? (
            <CatalogChipEditor
              field={field}
              value={chipValue}
              onChange={setChipValue}
              t={t}
            />
          ) : isEquipment ? (
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
          ) : isTextarea ? (
            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-36"
              placeholder={t(
                "onboarding.postOnboarding.result.edit.forbiddenExercises.placeholder",
              )}
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
                  [field]: Number.isFinite(numberValue)
                    ? numberValue
                    : result[field],
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
                isChipField
                  ? chipValue
                  : isEquipment
                    ? equipmentValue
                    : isOptionField
                      ? value
                      : isTextarea
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

export const ResultContent = ({ result, onboarding, onEdit }) => {
  const snapshot = React.useMemo(
    () => resolveResultSnapshot(result, onboarding),
    [onboarding, result],
  );
  const weeklyRateLabel = `${Math.round(snapshot.weeklyRate * 100) / 100} kg haftasiga`;

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col gap-4 overflow-x-hidden px-5 pt-3 md:pt-8">
      <section
        className={cn(
          "rounded-[1.75rem] border bg-background/90 p-5 shadow-sm backdrop-blur",
          tone.border,
        )}
      >
        <div className="space-y-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
              tone.badgeTone,
            )}
          >
            <TargetIcon className="size-3.5" aria-hidden="true" />
            Shaxsiy maqsadlar tayyor
          </div>
          <div>
            <h1 className="text-[2rem] font-black leading-[1.05] tracking-tight text-foreground">
              Sizning rejangiz tayyor
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
              Sizga mos, barqaror va xavfsiz natijaga erishishingiz uchun reja
              tuzildi.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <HeroInfoButton
            label="Vazn farqi (maqsad)"
            value={formatWeightDelta(snapshot.weightDiff)}
            onClick={() => onEdit(editKeys.targetWeight)}
          />
          <HeroInfoButton
            label="Haftalik sur'at"
            value={weeklyRateLabel}
            onClick={() => onEdit(editKeys.weeklyWeightChangeGoal)}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={() => onEdit(editKeys.dailyCalories)}
        className={cn(
          "relative min-h-[184px] overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-5 text-left shadow-sm backdrop-blur transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          tone.border,
          tone.cardTone,
        )}
      >
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/20 to-transparent" />
        <div className="relative flex h-full min-h-[144px] flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className={cn("flex size-12 items-center justify-center rounded-full", tone.badgeTone)}>
              <FlameIcon className="size-6" aria-hidden="true" />
            </div>
            <span className="flex size-8 items-center justify-center rounded-full border border-border/70 bg-background/75 text-muted-foreground">
              <PencilIcon className="size-4" aria-hidden="true" />
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">
              Kunlik kaloriya
            </p>
            <p className="mt-2 text-5xl font-black tracking-tight text-foreground">
              {formatResultNumber(snapshot.calories)}
              <span className={cn("ml-2 text-xl font-black", tone.textTone)}>
                kcal
              </span>
            </p>
          </div>
        </div>
      </button>

      <section className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={UtensilsIcon}
          label="Uglevod"
          value={formatResultNumber(snapshot.carbs)}
          unit="g"
          onEdit={() => onEdit(editKeys.carbsGram)}
        />
        <MetricCard
          icon={SaladIcon}
          label="Oqsil"
          value={formatResultNumber(snapshot.protein)}
          unit="g"
          onEdit={() => onEdit(editKeys.proteinGram)}
        />
        <MetricCard
          icon={FlameIcon}
          label="Yog'"
          value={formatResultNumber(snapshot.fat)}
          unit="g"
          onEdit={() => onEdit(editKeys.fatGram)}
        />
        <MetricCard
          icon={DropletsIcon}
          label="Suv"
          value={formatResultLiters(snapshot.waterMl)}
          water
        />
      </section>

      <section className="rounded-[1.35rem] border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur">
        <div className="grid gap-2">
          <SummaryItem
            icon={ScaleIcon}
            label="Hozirgi vazn"
            value={`${formatResultNumber(snapshot.currentWeight)} kg`}
          />
          <SummaryItem icon={TargetIcon} label="Maqsad" value={snapshot.goal} />
          <SummaryItem
            icon={ActivityIcon}
            label="Aktivlik"
            value={snapshot.activity}
          />
          <SummaryItem
            icon={WalletCardsIcon}
            label="Budjet"
            value={snapshot.budget}
          />
        </div>
      </section>

      <details className="rounded-[1.35rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black text-foreground">
          <InfoIcon className={cn("size-4", tone.textTone)} aria-hidden="true" />
          Qanday hisoblaymiz?
        </summary>
        <div className="mt-3 grid gap-2 text-sm font-medium leading-6 text-muted-foreground">
          <p>BMR: {formatResultNumber(result.bmr)} kcal</p>
          <p>TDEE: {formatResultNumber(result.tdee)} kcal</p>
          <p>BMI: {result.bmi ?? "-"}</p>
          <p>
            Suv: {formatResultNumber(snapshot.waterMl)} ml
          </p>
          <p>
            Qadam: {formatResultNumber(result.dailyStepsTarget)}
          </p>
          <p>
            Metabolik yosh:{" "}
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
    url: "/user/onboarding/personalization-result",
    queryProps: {
      queryKey: ["onboarding", "personalization-result"],
      staleTime: 15000,
    },
  });
  const resultBody = unwrapApiData(resultQuery.data);
  const result = resultBody?.result ?? resultBody;
  const onboarding = resultBody?.onboarding ?? null;
  const { mutateAsync: patchResult, isPending: isSaving } = usePatchQuery({
    queryKey: ["onboarding", "personalization-result"],
  });
  const { mutateAsync: updateOnboarding, isPending: isSavingOnboarding } =
    usePutQuery({
      queryKey: ["onboarding", "personalization-result"],
    });
  const { mutateAsync: startGeneration, isPending: isGenerating } =
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
            url: "/user/onboarding/personalization-result",
            attributes: {},
          });
        }
      } else {
        const patch = buildPersonalizationPatch(field, value);
        await patchResult({
          url: "/user/onboarding/personalization-result",
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
      const response = await startGeneration({
        url: "/user/onboarding/generate-personal-plan",
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
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      onClick={handleNext}
      disabled={!result || isGenerating}
    >
      {isGenerating ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <ChevronRightIcon className="size-4" />
      )}
      Keyingi
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
      className="relative flex min-h-full flex-1 overflow-hidden bg-background"
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
