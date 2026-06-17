import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  CalendarDaysIcon,
  Clock3Icon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  Loader2Icon,
  PencilIcon,
  SaveIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  getTodayKey,
  useDailyTrackingActions,
  useDailyTrackingHistory,
} from "@/hooks/app/use-daily-tracking";
import useApi from "@/hooks/api/use-api.js";
import {
  NUTRITION_HISTORY_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
import { toast } from "sonner";
import {
  MEAL_ICONS,
  MEAL_LABELS,
  MEAL_TYPE_OPTIONS,
} from "@/modules/user/lib/meal-config";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import ProgressBar from "../ui/progress-bar.jsx";
import { getProgressPercent } from "../ui/progress-bar-utils.js";
import { cn } from "@/lib/utils.js";

import {
  map,
  orderBy,
  toNumber,
  trim,
} from "lodash";
import {
  filterHistoryMealsForView,
  flattenHistoryDayMeals,
  getHistoryDayTotals,
  getHistoryDayWaterMl,
  getHistoryMealCalories,
} from "./history-filter-export-helpers.js";

const mealTypeOptions = [
  { value: "all", label: "Barcha bo'limlar" },
  ...MEAL_TYPE_OPTIONS,
];

const sourceOptions = [
  { value: "all", label: "Barcha manbalar" },
  { value: "manual", label: "Manual" },
  { value: "recipe", label: "Retsept" },
  { value: "saved-meal", label: "Saqlangan taom" },
  { value: "barcode", label: "Barcode" },
  { value: "ai", label: "AI" },
  { value: "history-copy", label: "Tarixdan nusxa" },
];

const datePresetOptions = [
  { value: 7, label: "7 kun" },
  { value: 14, label: "14 kun" },
  { value: 30, label: "30 kun" },
  { value: 90, label: "90 kun" },
];

const toDateKey = (date) => date.toISOString().slice(0, 10);

const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toDateKey(date);
};

const formatDateLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatShortDateLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });

const formatDateInputLabel = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const dateKeyToDate = (dateKey) => new Date(`${dateKey}T12:00:00`);

const getMealTimeMs = (meal, fallbackDateKey) => {
  const value = meal?.addedAt || `${fallbackDateKey}T12:00:00`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const formatMealTime = (meal, fallbackDateKey) => {
  const value = meal?.addedAt || `${fallbackDateKey}T12:00:00`;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--:--";
  }

  return parsed.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getMealQuantity = (meal) => toNumber(meal?.qty ?? meal?.quantity ?? 1) || 1;

const getMealTimeInputValue = (meal, fallbackDateKey) => {
  const value = meal?.addedAt || `${fallbackDateKey}T12:00:00`;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "12:00";
  }

  return [
    String(parsed.getHours()).padStart(2, "0"),
    String(parsed.getMinutes()).padStart(2, "0"),
  ].join(":");
};

const buildAddedAtFromTime = (dateKey, timeValue) =>
  `${dateKey}T${timeValue || "12:00"}:00`;

const buildMealLogPayload = (meal, overrides = {}) => ({
  name: meal?.name || "Ovqat",
  barcode: meal?.barcode ?? null,
  source: meal?.source ?? null,
  savedMealId: meal?.savedMealId ?? null,
  cal: getHistoryMealCalories(meal),
  protein: toNumber(meal?.protein || 0),
  carbs: toNumber(meal?.carbs || 0),
  fat: toNumber(meal?.fat || 0),
  fiber: toNumber(meal?.fiber || 0),
  qty: getMealQuantity(meal),
  image: meal?.image ?? meal?.imageUrl ?? null,
  ingredients: meal?.ingredients,
  addedAt: meal?.addedAt,
  ...overrides,
});

const downloadBlob = (filename, blob) => {
  if (typeof document === "undefined") return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getHeaderValue = (headers, name) =>
  headers?.[name] || headers?.[name.toLowerCase()] || headers?.get?.(name);

const getHistoryExportFileName = ({ response, startDate, endDate }) => {
  const disposition = getHeaderValue(response?.headers, "content-disposition");
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(
    disposition || "",
  );

  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return `nutrition-history-${startDate}-${endDate}.csv`;
};

const FilterTrigger = ({
  startDate,
  endDate,
  mealType,
  source,
  search,
  isFetching,
  onOpen,
}) => {
  const { t } = useTranslation();
  const selectedMeal = mealTypeOptions.find((option) => option.value === mealType);
  const selectedSource = sourceOptions.find((option) => option.value === source);
  const filterLabel = t("user.nutrition.historyPage.filter");
  const activeCount =
    (mealType !== "all" ? 1 : 0) +
    (source !== "all" ? 1 : 0) +
    (trim(search) ? 1 : 0);

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        className="min-h-12 min-w-0 flex-1 justify-between overflow-hidden rounded-[1.4rem] border-[rgb(var(--accent-rgb)/0.18)] bg-card/90 px-4 shadow-sm shadow-black/[0.03] sm:flex-none sm:min-w-[22rem]"
        onClick={onOpen}
        aria-label={filterLabel}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <SlidersHorizontalIcon className="size-4" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-black">{filterLabel}</span>
            <span className="block truncate text-xs font-semibold text-muted-foreground">
              {formatDateInputLabel(startDate)} - {formatDateInputLabel(endDate)}
              {" • "}
              {selectedMeal?.label || t("user.nutrition.historyPage.allMeals")}
              {" • "}
              {selectedSource?.label || t("user.nutrition.historyPage.allSources")}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
          {isFetching ? (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
        </span>
      </Button>
    </div>
  );
};

const HistoryFilterDrawer = ({
  open,
  onOpenChange,
  startDate,
  endDate,
  mealType,
  source,
  search,
  isExportDisabled,
  onPreset,
  onOpenStartDate,
  onOpenEndDate,
  onOpenMealType,
  onOpenSource,
  onSearchChange,
  onExport,
  onClear,
}) => {
  const selectedMeal = mealTypeOptions.find((option) => option.value === mealType);
  const selectedSource = sourceOptions.find((option) => option.value === source);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Tarix filterlari</DrawerTitle>
          <DrawerDescription>
            Sana oralig'i, ovqat bo'limi va qidiruvni shu yerda sozlang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-3 px-4 pb-0">
          <div className="grid grid-cols-4 gap-2">
            {map(datePresetOptions, (option) => (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => onPreset(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left"
            onClick={onOpenStartDate}
            aria-label="Boshlanish sanasi"
          >
            <span>
              <span className="block text-xs font-bold uppercase text-muted-foreground">
                Boshlanish sanasi
              </span>
              <span className="mt-1 block text-base font-black">
                {formatDateInputLabel(startDate)}
              </span>
            </span>
            <CalendarDaysIcon className="size-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left"
            onClick={onOpenEndDate}
            aria-label="Tugash sanasi"
          >
            <span>
              <span className="block text-xs font-bold uppercase text-muted-foreground">
                Tugash sanasi
              </span>
              <span className="mt-1 block text-base font-black">
                {formatDateInputLabel(endDate)}
              </span>
            </span>
            <CalendarDaysIcon className="size-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left"
            onClick={onOpenMealType}
            aria-label="Bo'lim"
          >
            <span>
              <span className="block text-xs font-bold uppercase text-muted-foreground">
                Bo'lim
              </span>
              <span className="mt-1 block text-base font-black">
                {selectedMeal?.label || "Barcha bo'limlar"}
              </span>
            </span>
            <ChevronRightIcon className="size-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border bg-card px-4 py-3 text-left"
            onClick={onOpenSource}
            aria-label="Manba"
          >
            <span>
              <span className="block text-xs font-bold uppercase text-muted-foreground">
                Manba
              </span>
              <span className="mt-1 block text-base font-black">
                {selectedSource?.label || "Barcha manbalar"}
              </span>
            </span>
            <ChevronRightIcon className="size-5 text-muted-foreground" />
          </button>

          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ovqat nomi..."
              className="h-12 rounded-3xl pl-11"
            />
          </div>
        </DrawerBody>

        <DrawerFooter className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onClear}
          >
            Tozalash
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={isExportDisabled}
            onClick={onExport}
          >
            CSV yuklash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const MealTypeDrawer = ({
  open,
  onOpenChange,
  value,
  onChange,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom" nested>
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader>
        <DrawerTitle>Bo'limni tanlang</DrawerTitle>
        <DrawerDescription>
          Tarix ro'yxati qaysi ovqat bo'limini ko'rsatishini tanlang.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="space-y-2 px-4 pb-6">
        {map(mealTypeOptions, (option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-left text-sm font-black transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-card hover:bg-muted/40",
              )}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
            >
              <span>{option.label}</span>
              {active ? <CheckIcon className="size-4" /> : null}
            </button>
          );
        })}
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

const SourceDrawer = ({
  open,
  onOpenChange,
  value,
  onChange,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom" nested>
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Manbani tanlang</DrawerTitle>
          <DrawerDescription>
          Tarix ro'yxati qaysi manba bo'yicha filtrlanishini tanlang.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="space-y-2 px-4 pb-6">
        {map(sourceOptions, (option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-left text-sm font-black transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-card hover:bg-muted/40",
              )}
              onClick={() => {
                onChange(option.value);
                onOpenChange(false);
              }}
            >
              <span>{option.label}</span>
              {active ? <CheckIcon className="size-4" /> : null}
            </button>
          );
        })}
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

const HistoryMealCopyDrawer = ({
  open,
  onOpenChange,
  copyContext,
  todayKey,
  onConfirm,
}) => {
  const isDayCopy = copyContext?.kind === "day";
  const meal = copyContext?.meal;
  const [targetDate, setTargetDate] = React.useState(todayKey);
  const [targetMealType, setTargetMealType] = React.useState("breakfast");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return undefined;

    let isCancelled = false;
    queueMicrotask(() => {
      if (isCancelled) return;
      setTargetDate(todayKey);
      setTargetMealType(isDayCopy ? "all" : meal?.mealType || "breakfast");
    });

    return () => {
      isCancelled = true;
    };
  }, [isDayCopy, meal?.mealType, open, todayKey]);

  const handleSubmit = async () => {
    if (!copyContext || !targetDate || !targetMealType) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        kind: copyContext.kind,
        sourceDate: copyContext.dateKey,
        meal,
        targetDate,
        targetMealType,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>
            {isDayCopy ? "Kundan nusxa olish" : "Ovqatdan nusxa olish"}
          </DrawerTitle>
          <DrawerDescription>
            {isDayCopy
              ? `${formatShortDateLabel(copyContext?.dateKey || todayKey)} uchun yangi sanani tanlang.`
              : `${meal?.name || "Ovqat"} uchun yangi sana va bo'limni tanlang.`}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-3 px-4 pb-0">
          <label className="block space-y-2">
            <span className="text-sm font-black">Sana</span>
            <Input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="h-12 rounded-3xl"
              aria-label="Nusxa sanasi"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black">Bo'lim</span>
            <select
              value={targetMealType}
              onChange={(event) => setTargetMealType(event.target.value)}
              className="h-12 w-full rounded-3xl border border-input bg-input/30 px-4 text-sm font-bold outline-none focus:border-primary"
              aria-label="Nusxa bo'limi"
            >
              {map(isDayCopy ? mealTypeOptions : MEAL_TYPE_OPTIONS, (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <p className="rounded-3xl bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground">
            {isDayCopy
              ? "Barcha bo'limlar tanlansa butun kun, bitta bo'lim tanlansa faqat o'sha bo'lim ko'chadi."
              : "Agar tanlangan kunda shu ovqat mavjud bo'lsa, qo'shishdan oldin tasdiq so'raladi."}
          </p>
        </DrawerBody>

        <DrawerFooter className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => void handleSubmit()}
            disabled={!targetDate || !targetMealType || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CopyIcon className="size-4" />
            )}
            Nusxa olish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const HistoryMealEditDrawer = ({
  open,
  onOpenChange,
  mealContext,
  onConfirm,
}) => {
  const meal = mealContext?.meal;
  const dateKey = mealContext?.dateKey;
  const [draft, setDraft] = React.useState({
    name: "",
    mealType: "breakfast",
    time: "12:00",
    cal: "0",
    protein: "0",
    carbs: "0",
    fat: "0",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open || !meal || !dateKey) return undefined;

    let isCancelled = false;
    queueMicrotask(() => {
      if (isCancelled) return;
      setDraft({
        name: meal.name || "",
        mealType: meal.mealType || "breakfast",
        time: getMealTimeInputValue(meal, dateKey),
        cal: String(getHistoryMealCalories(meal)),
        protein: String(Math.round(toNumber(meal.protein || 0))),
        carbs: String(Math.round(toNumber(meal.carbs || 0))),
        fat: String(Math.round(toNumber(meal.fat || 0))),
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [dateKey, meal, open]);

  const updateDraft = (key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!meal || !dateKey || !meal.id) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        dateKey,
        meal,
        mealType: draft.mealType,
        patch: {
          name: trim(draft.name) || "Ovqat",
          cal: toNumber(draft.cal),
          protein: toNumber(draft.protein),
          carbs: toNumber(draft.carbs),
          fat: toNumber(draft.fat),
          addedAt: buildAddedAtFromTime(dateKey, draft.time),
        },
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Ovqatni tahrirlash</DrawerTitle>
          <DrawerDescription>
            Tarixdagi ovqat nomi, vaqti, bo'limi va makro qiymatlarini
            yangilang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-3 px-4 pb-0">
          <label className="block space-y-2">
            <span className="text-sm font-black">Nomi</span>
            <Input
              value={draft.name}
              onChange={(event) => updateDraft("name", event.target.value)}
              className="h-12 rounded-3xl"
              aria-label="Ovqat nomi"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-sm font-black">Bo'lim</span>
              <select
                value={draft.mealType}
                onChange={(event) => updateDraft("mealType", event.target.value)}
                className="h-12 w-full rounded-3xl border border-input bg-input/30 px-4 text-sm font-bold outline-none focus:border-primary"
                aria-label="Ovqat bo'limi"
              >
                {map(MEAL_TYPE_OPTIONS, (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-black">Vaqt</span>
              <Input
                type="time"
                value={draft.time}
                onChange={(event) => updateDraft("time", event.target.value)}
                className="h-12 rounded-3xl"
                aria-label="Ovqat vaqti"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {map([
              ["cal", "Kaloriya", "kcal"],
              ["protein", "Oqsil", "g"],
              ["carbs", "Uglevod", "g"],
              ["fat", "Yog'", "g"],
            ], ([key, label, unit]) => (
              <label key={key} className="block space-y-2">
                <span className="text-sm font-black">{label}</span>
                <Input
                  type="number"
                  min="0"
                  value={draft[key]}
                  onChange={(event) => updateDraft(key, event.target.value)}
                  className="h-12 rounded-3xl"
                  aria-label={`${label} (${unit})`}
                />
              </label>
            ))}
          </div>
        </DrawerBody>

        <DrawerFooter className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={() => void handleSubmit()}
            disabled={!trim(draft.name) || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const HistoryDayCard = ({
  day,
  meals,
  totals,
  onOpen,
  onCopyMeal,
  onCopyDay,
  onEditMeal,
  onDeleteMeal,
}) => {
  const targetCalories = toNumber(day?.goals?.calories || day?.targetCalories || 0);
  const waterMl = getHistoryDayWaterMl(day);
  const progress = targetCalories > 0
    ? getProgressPercent(totals.calories, targetCalories)
    : 0;
  const mealCount = meals.length;
  const healthScore = Math.min(100, Math.round((progress > 0 ? Math.min(progress, 100) * 0.6 : 0) + (mealCount >= 3 ? 25 : mealCount * 8) + (waterMl > 0 ? 15 : 0)));
  const hasMeals = mealCount > 0;
  const timelineMeals = orderBy(
    meals,
    [(meal) => getMealTimeMs(meal, day.date)],
    ["asc"],
  );

  return (
    <article
      role="button"
      tabIndex={0}
      className="w-full cursor-pointer rounded-[28px] border border-[rgb(var(--accent-rgb)/0.14)] bg-card/95 p-4 text-left shadow-sm shadow-black/[0.03] transition-colors hover:border-[rgb(var(--accent-rgb)/0.28)] hover:bg-[rgb(var(--accent-rgb)/0.03)] sm:p-5"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOpen();
        }
      }}
    >
      <div className="grid gap-5 xl:grid-cols-[190px_1fr_auto] xl:items-start">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">
            {formatShortDateLabel(day.date)}
          </p>
          <h3 className="mt-1 text-lg font-black capitalize">
            {formatDateLabel(day.date)}
          </h3>
          <p className="mt-3 text-3xl font-black tabular-nums">
            {Math.round(totals.calories)} kcal
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {hasMeals ? `${mealCount} ta ovqat` : "Ovqat qo'shilmagan"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
              Sog'liq {healthScore}/100
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-muted-foreground">
                Maqsad: {targetCalories || "—"} kcal
              </p>
              <p className="text-xs font-black text-primary">{progress}%</p>
            </div>
            <ProgressBar
              value={totals.calories}
              target={targetCalories}
              aria-label={`${day.date} kaloriya progress`}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {map([
              ["Oqsil", `${Math.round(totals.protein)}g`],
              ["Uglevod", `${Math.round(totals.carbs)}g`],
              ["Yog'", `${Math.round(totals.fat)}g`],
              ["Suv", `${Math.round(waterMl)} ml`],
            ], ([label, value]) => (
              <div key={label} className="rounded-2xl bg-muted/40 px-3 py-2">
                <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-black">{value}</p>
              </div>
            ))}
          </div>
          <div className="relative space-y-2 pl-4 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-px before:bg-border">
            {hasMeals ? (
              map(timelineMeals, (meal) => {
                const mealIcon = MEAL_ICONS[meal.mealType] || "🍽️";
                const mealLabel = MEAL_LABELS[meal.mealType] || meal.mealType;
                const sourceLabel =
                  sourceOptions.find((option) => option.value === meal.source)
                    ?.label || meal.source;

                return (
                  <div
                    key={`${day.date}-${meal.mealType}-${meal.id}`}
                    className="relative grid gap-3 rounded-2xl bg-muted/25 p-3 sm:grid-cols-[68px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="absolute -left-[14px] top-4 grid size-3 place-items-center rounded-full border-2 border-card bg-primary" />
                    <div className="flex items-center gap-1.5 text-xs font-black tabular-nums text-primary">
                      <Clock3Icon className="size-3.5" />
                      {formatMealTime(meal, day.date)}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-background text-lg">
                        {meal.image ? (
                          <img
                            src={meal.image}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span aria-hidden="true">{mealIcon}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black">
                            {meal.name || "Ovqat"}
                          </p>
                          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {mealLabel}
                          </span>
                          {sourceLabel ? (
                            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {sourceLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                          P {Math.round(toNumber(meal.protein || 0))}g · C{" "}
                          {Math.round(toNumber(meal.carbs || 0))}g · F{" "}
                          {Math.round(toNumber(meal.fat || 0))}g
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-black tabular-nums">
                          {Math.round(toNumber(meal.cal || 0))}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                          kcal
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full bg-background"
                        onClick={(event) => onCopyMeal(event, day.date, meal)}
                        aria-label={`${meal.name || "Ovqat"} nusxa olish`}
                      >
                        <CopyIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full bg-background"
                        onClick={(event) => onEditMeal(event, day.date, meal)}
                        aria-label={`${meal.name || "Ovqat"} tahrirlash`}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full bg-background text-destructive hover:text-destructive"
                        onClick={(event) => onDeleteMeal(event, day.date, meal)}
                        aria-label={`${meal.name || "Ovqat"} o'chirish`}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="relative rounded-2xl border border-dashed bg-muted/15 px-3 py-4 text-sm font-semibold text-muted-foreground">
                <span className="absolute -left-[14px] top-5 grid size-3 rounded-full border-2 border-card bg-muted" />
                Bu kunda ovqat yozilmagan
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 xl:flex-col">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              onCopyDay(event, day.date);
            }}
          >
            <CopyIcon className="size-4" />
            Nusxa
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            Ko'rish
          </Button>
        </div>
      </div>
    </article>
  );
};

const NutritionHistoryPage = () => {
  const navigate = useNavigate();
  const { request } = useApi();
  const todayKey = getTodayKey();
  const defaultStartDate = React.useMemo(() => getDefaultStartDate(), []);
  const [startDate, setStartDate] = React.useState(defaultStartDate);
  const [endDate, setEndDate] = React.useState(todayKey);
  const [mealType, setMealType] = React.useState("all");
  const [source, setSource] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const historyLimit = 10;
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [startDatePickerOpen, setStartDatePickerOpen] = React.useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = React.useState(false);
  const [mealTypeDrawerOpen, setMealTypeDrawerOpen] = React.useState(false);
  const [sourceDrawerOpen, setSourceDrawerOpen] = React.useState(false);
  const [copyContext, setCopyContext] = React.useState(null);
  const [editContext, setEditContext] = React.useState(null);
  const [deleteContext, setDeleteContext] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const { addMeal, copyMeals, patchMeal, removeMeal } = useDailyTrackingActions();

  const { days, meta, isLoading, isFetching, isError, refetch } =
    useDailyTrackingHistory({
      startDate,
      endDate,
      mealType,
      source,
      q: search,
      page,
      limit: historyLimit,
  });

  React.useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (!isCancelled) {
        setPage(1);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [endDate, mealType, search, source, startDate]);

  const handleOpenCopyMeal = (event, dateKey, meal) => {
    event.stopPropagation();
    setCopyContext({ kind: "meal", dateKey, meal });
  };

  const handleOpenCopyDay = (event, dateKey) => {
    event.stopPropagation();
    setCopyContext({ kind: "day", dateKey });
  };

  const handleOpenEditMeal = (event, dateKey, meal) => {
    event.stopPropagation();
    setEditContext({ dateKey, meal });
  };

  const handleOpenDeleteMeal = (event, dateKey, meal) => {
    event.stopPropagation();
    setDeleteContext({ dateKey, meal });
  };

  const handleConfirmHistoryCopy = async ({
    kind,
    sourceDate,
    meal,
    targetDate,
    targetMealType,
  }) => {
    try {
      if (kind === "day") {
        await copyMeals({
          from: sourceDate,
          to: targetDate,
          ...(targetMealType !== "all" ? { mealType: targetMealType } : {}),
        });
        toast.success("Kundan nusxa olindi");
        return;
      }

      await addMeal(targetDate, targetMealType, buildMealLogPayload(meal, {
        id: undefined,
        source: "history-copy",
        addedAt: undefined,
      }));
      toast.success(`${meal.name || "Ovqat"} nusxa olindi`);
    } catch {
      toast.error("Ovqatdan nusxa olib bo'lmadi");
    }
  };

  const handleConfirmMealEdit = async ({ dateKey, meal, mealType: nextMealType, patch }) => {
    try {
      await patchMeal(dateKey, nextMealType, meal.id, patch);
      toast.success("Ovqat yangilandi");
    } catch {
      toast.error("Ovqatni yangilab bo'lmadi");
    }
  };

  const handleConfirmMealDelete = async () => {
    if (!deleteContext?.meal?.id || !deleteContext?.dateKey) return;

    const { dateKey, meal } = deleteContext;
    setIsDeleting(true);
    try {
      await removeMeal(dateKey, meal.mealType, meal.id);
      setDeleteContext(null);
      toast.success(`${meal.name || "Ovqat"} o'chirildi`, {
        action: {
          label: "Qaytarish",
          onClick: () => {
            void addMeal(dateKey, meal.mealType, buildMealLogPayload(meal, {
              id: undefined,
            })).catch(() => {
              toast.error("Ovqatni qaytarib bo'lmadi");
            });
          },
        },
      });
    } catch {
      toast.error("Ovqatni o'chirib bo'lmadi");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportHistory = React.useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await request.get(
        nutritionApiPath(NUTRITION_HISTORY_API_ROOT, "export"),
        {
          params: {
            startDate,
            endDate,
            mealType,
            source,
            q: search,
          },
          responseType: "blob",
        },
      );
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type: "text/csv;charset=utf-8",
            });

      downloadBlob(
        getHistoryExportFileName({ response, startDate, endDate }),
        blob,
      );
      toast.success("Tarix CSV yuklab olindi");
    } catch {
      toast.error("Tarixni eksport qilib bo'lmadi");
    } finally {
      setIsExporting(false);
    }
  }, [endDate, mealType, request, search, source, startDate]);
  const handleStartDateChange = React.useCallback(
    (nextDate) => {
      const nextKey = toDateKey(nextDate);
      setStartDate(nextKey);
      if (nextKey > endDate) {
        setEndDate(nextKey);
      }
    },
    [endDate],
  );
  const handleEndDateChange = React.useCallback(
    (nextDate) => {
      const nextKey = toDateKey(nextDate);
      setEndDate(nextKey);
      if (nextKey < startDate) {
        setStartDate(nextKey);
      }
    },
    [startDate],
  );
  const handlePreset = React.useCallback(
    (daysCount) => {
      const nextEnd = todayKey;
      const nextStartDate = new Date(`${todayKey}T12:00:00`);
      nextStartDate.setDate(nextStartDate.getDate() - (daysCount - 1));
      setStartDate(toDateKey(nextStartDate));
      setEndDate(nextEnd);
    },
    [todayKey],
  );
  const handleClearFilters = React.useCallback(() => {
    setStartDate(defaultStartDate);
    setEndDate(todayKey);
    setMealType("all");
    setSource("all");
    setSearch("");
  }, [defaultStartDate, todayKey]);
  const hasDateFilter = startDate !== defaultStartDate || endDate !== todayKey;
  const hasNarrowFilters =
    hasDateFilter ||
    mealType !== "all" ||
    source !== "all" ||
    Boolean(trim(search));
  const totalPages = Math.max(1, toNumber(meta?.totalPages || 1));
  const currentPage = Math.max(1, toNumber(meta?.page || page));

  return (
    <NutritionLayout>
      <FilterTrigger
        startDate={startDate}
        endDate={endDate}
        mealType={mealType}
        source={source}
        search={search}
        isFetching={isFetching}
        onOpen={() => setFilterOpen(true)}
      />

      {isLoading ? (
        <div className="grid min-h-[260px] place-items-center rounded-[1.75rem] border bg-card">
          <div className="text-center">
            <Loader2Icon className="mx-auto mb-3 size-7 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground">
              Tarix yuklanmoqda
            </p>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-[1.75rem] border bg-card p-8 text-center">
          <h2 className="text-lg font-black">Tarixni yuklab bo'lmadi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keyinroq qayta urinib ko'ring.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Qayta urinish
          </Button>
        </div>
      ) : days.length === 0 ? (
        <div className="rounded-[1.75rem] border bg-card p-8 text-center">
          <CalendarDaysIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2 className="text-lg font-black">
            {hasNarrowFilters ? "Natija topilmadi" : "Hali tarix yo'q"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasNarrowFilters
              ? "Sana oralig'i yoki qidiruv so'zini o'zgartiring."
              : "Ovqat qo'shsangiz, kunlik tarix shu yerda ko'rinadi."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {map(days, (day) => {
            const meals = filterHistoryMealsForView(
              flattenHistoryDayMeals(day),
              { mealType, source, search },
            );
            const totals = getHistoryDayTotals(meals);

            return (
              <HistoryDayCard
                key={day.date}
                day={day}
                meals={meals}
                totals={totals}
                onOpen={() => navigate(`/user/nutrition/overview?date=${day.date}`)}
                onCopyMeal={handleOpenCopyMeal}
                onCopyDay={handleOpenCopyDay}
                onEditMeal={handleOpenEditMeal}
                onDeleteMeal={handleOpenDeleteMeal}
              />
            );
          })}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border bg-card p-3">
              <p className="text-sm font-black text-muted-foreground">
                {currentPage}/{totalPages} sahifa · {toNumber(meta?.total || 0)} kun
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!meta?.hasPrevPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Oldingi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!meta?.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Keyingi
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <HistoryFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        startDate={startDate}
        endDate={endDate}
        mealType={mealType}
        source={source}
        search={search}
        isExportDisabled={isLoading || isExporting || days.length === 0}
        onPreset={handlePreset}
        onOpenStartDate={() => setStartDatePickerOpen(true)}
        onOpenEndDate={() => setEndDatePickerOpen(true)}
        onOpenMealType={() => setMealTypeDrawerOpen(true)}
        onOpenSource={() => setSourceDrawerOpen(true)}
        onSearchChange={setSearch}
        onExport={handleExportHistory}
        onClear={handleClearFilters}
      />
      {startDatePickerOpen ? (
        <CalendarBottomDrawer
          open={startDatePickerOpen}
          onOpenChange={setStartDatePickerOpen}
          date={dateKeyToDate(startDate)}
          onChange={handleStartDateChange}
          maxDate={dateKeyToDate(endDate)}
          title="Boshlanish sanasi"
          description="Tarix ko'rinishi qaysi kundan boshlanishini tanlang."
          nested
        />
      ) : null}
      {endDatePickerOpen ? (
        <CalendarBottomDrawer
          open={endDatePickerOpen}
          onOpenChange={setEndDatePickerOpen}
          date={dateKeyToDate(endDate)}
          onChange={handleEndDateChange}
          minDate={dateKeyToDate(startDate)}
          maxDate={dateKeyToDate(todayKey)}
          title="Tugash sanasi"
          description="Tarix ko'rinishi qaysi kungacha bo'lishini tanlang."
          nested
        />
      ) : null}
      {mealTypeDrawerOpen ? (
        <MealTypeDrawer
          open={mealTypeDrawerOpen}
          onOpenChange={setMealTypeDrawerOpen}
          value={mealType}
          onChange={setMealType}
        />
      ) : null}
      {sourceDrawerOpen ? (
        <SourceDrawer
          open={sourceDrawerOpen}
          onOpenChange={setSourceDrawerOpen}
          value={source}
          onChange={setSource}
        />
      ) : null}
      <HistoryMealCopyDrawer
        open={Boolean(copyContext)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setCopyContext(null);
        }}
        copyContext={copyContext}
        todayKey={todayKey}
        onConfirm={handleConfirmHistoryCopy}
      />
      <HistoryMealEditDrawer
        open={Boolean(editContext)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditContext(null);
        }}
        mealContext={editContext}
        onConfirm={handleConfirmMealEdit}
      />
      <Dialog
        open={Boolean(deleteContext)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeleting) setDeleteContext(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ovqatni o'chirish?</DialogTitle>
            <DialogDescription>
              {deleteContext?.meal?.name || "Ovqat"} tarixdan olib tashlanadi.
              O'chirgandan keyin toast orqali qaytarish mumkin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setDeleteContext(null)}
              disabled={isDeleting}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={() => void handleConfirmMealDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4" />
              )}
              O'chirish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </NutritionLayout>
  );
};

export default NutritionHistoryPage;
