import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  ArrowRightIcon,
  AlertCircleIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  FlameIcon,
  DumbbellIcon,
  LightbulbIcon,
  Loader2Icon,
  LeafIcon,
  PencilIcon,
  ScaleIcon,
  ShoppingCartIcon,
  TargetIcon,
  UtensilsIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  NutritionDrawerBody,
  NutritionDrawerContent,
} from "../nutrition-drawer-layout.jsx";
import {
  useMealPlanTemplateConflictPreview,
  useMealPlanTemplateDetail,
} from "@/hooks/app/use-meal-plan";
import NutritionPlansList from "../nutrition-plans-list.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import FilterChips from "../ui/filter-chips.jsx";
import PlanTemplateCard from "../ui/plan-template-card.jsx";
import { cn } from "@/lib/utils.js";
import {
  getTemplateBlockingReasonLabels,
  getTemplateBlockingReasonSummary,
} from "../template-blocking-reasons.js";

import filter from "lodash/filter";
import isArray from "lodash/isArray";
import map from "lodash/map";
import range from "lodash/range";
import reduce from "lodash/reduce";
import take from "lodash/take";
import toNumber from "lodash/toNumber";

const formatPlanDate = (value) => {
  if (!value) {
    return "Bugun";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("uz-UZ");
};

const formatPlanCurrency = (value, currency = "UZS") => {
  const amount = toNumber(value) || 0;

  return `${new Intl.NumberFormat("uz-UZ", {
    notation: amount >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(amount)} ${currency || "UZS"}`;
};

const getPlanCalories = (plan, goals) =>
  toNumber(plan?.appliedTargetCalories || goals?.calories || 0);

const templateIconByGoal = {
  lose_weight: ScaleIcon,
  "weight-loss": ScaleIcon,
  gain_muscle: DumbbellIcon,
  muscle: DumbbellIcon,
  maintenance: TargetIcon,
  wellness: LeafIcon,
};

const getTemplateCalories = (template) => {
  const calories = toNumber(
    template?.appliedTargetCalories ||
      template?.targetCalories ||
      template?.calories ||
      0,
  );

  return calories ? calories.toLocaleString("en-US") : "-";
};

const getTemplateDays = (template) =>
  toNumber(template?.durationDays || template?.days || 30) || 30;

const getTemplateMealsPerDay = (template) =>
  toNumber(template?.mealsPerDay || template?.mealCount || 0) || null;

const getTemplateMealsCount = (template) =>
  toNumber(template?.mealsCount || template?.totalMeals || 0) || null;

const getMealCalories = (meal) => {
  const quantity = toNumber(meal?.qty ?? meal?.quantity ?? 1) || 1;
  const calories = toNumber(
    meal?.calories ??
      meal?.cal ??
      meal?.totalCalories ??
      meal?.food?.calories ??
      meal?.food?.cal ??
      0,
  );

  return Math.max(0, Math.round(calories * quantity));
};

const buildTemplateDayPreview = (template, durationDays) => {
  const sourceDays = isArray(template?.days) ? template.days : [];
  const dayByNumber = reduce(
    sourceDays,
    (result, day, index) => {
      const dayNumber = toNumber(day?.dayNumber) || index + 1;
      result[dayNumber] = day;
      return result;
    },
    {},
  );
  const maxDays = Math.min(Math.max(toNumber(durationDays) || 30, 1), 30);

  return map(range(1, maxDays + 1), (dayNumber) => {
    const day = dayByNumber[dayNumber] || null;
    const meals = isArray(day?.meals) ? day.meals : [];
    const calories = reduce(
      meals,
      (total, meal) => total + getMealCalories(meal),
      0,
    );

    return {
      dayNumber,
      mealCount: meals.length,
      calories,
      hasDetails: Boolean(day),
      isSparse: Boolean(day) && (meals.length === 0 || calories <= 0),
    };
  });
};

const buildTemplateCard = (template) => ({
  ...template,
  title: template.title || template.name || "Tayyor shablon",
  description: template.description || "Admin tomonidan yaratilgan reja.",
  calories: getTemplateCalories(template),
  daysLabel: `${getTemplateDays(template)} kunlik`,
  mealLabel: getTemplateMealsPerDay(template)
    ? `${getTemplateMealsPerDay(template)} mahal / kun`
    : null,
  mealsCountLabel: getTemplateMealsCount(template)
    ? `${getTemplateMealsCount(template)} ta ovqat`
    : null,
  icon: templateIconByGoal[template.goal] || BookOpenIcon,
  disabled: template.isCompatible === false,
  compatibilityLabel: template.isCompatible === false ? "Mos emas" : "Mos",
  blockingReason: getTemplateBlockingReasonSummary(template),
});

const MealPlanHero = ({
  currentPlan,
  goals,
  currentPlanDayStatus,
  planInsightsMap,
  onActivatePlan,
  onOpenPlanActions,
  onSelectPlanForShopping,
}) => {
  const planInsights = currentPlan?.id
    ? planInsightsMap[currentPlan.id] || {}
    : {};
  const mealCount = toNumber(currentPlan?.mealCount || 4) || 4;
  const calories = getPlanCalories(currentPlan, goals);
  const durationDays = toNumber(currentPlan?.durationDays || 7) || 7;
  const budgetTarget = currentPlan?.budgetTarget || null;
  const filledDays = Math.min(
    durationDays,
    Math.max(toNumber(planInsights.filledDays || 0), currentPlan ? 1 : 0),
  );
  const statusLabel =
    currentPlan?.status === "active"
      ? "Faol reja"
      : currentPlan
        ? "Saqlangan reja"
        : "Reja tanlanmagan";

  return (
    <NutritionCard
      tone="accent"
      className="relative overflow-hidden p-4 sm:p-5 lg:p-6"
    >
      <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[radial-gradient(circle_at_70%_28%,rgb(var(--accent-rgb)/0.14),transparent_32%),linear-gradient(135deg,transparent,rgb(var(--accent-rgb)/0.08))] lg:block" />

      <div className="relative z-10 grid gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/15 bg-card/75 px-3 py-1 text-xs font-bold text-primary shadow-sm">
              {statusLabel}
            </span>
            {currentPlanDayStatus?.dayNumber ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {currentPlanDayStatus.dayNumber}-kun
              </span>
            ) : null}
            {currentPlan ? (
              <span className="inline-flex items-center rounded-full bg-card/75 px-3 py-1 text-xs font-bold text-muted-foreground">
                {filledDays}/{durationDays} kun
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 max-w-[620px] text-2xl font-black tracking-normal text-foreground sm:text-3xl xl:text-4xl">
            {currentPlan?.name || "Ovqatlanish rejangizni yarating"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {currentPlan
              ? "Sizning hozirgi ovqatlanish rejangiz. Bugun uchun tayyor!"
              : "Shablondan tanlang yoki o'zingizga mos reja yarating."}
          </p>

          <div
            className="mt-4 grid max-w-4xl grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-background/75 p-3 shadow-sm backdrop-blur"
          >
            <HeroMetric
              icon={UtensilsIcon}
              value={mealCount}
              label="ta taom"
            />
            <HeroMetric
              icon={FlameIcon}
              value={calories ? calories.toLocaleString("en-US") : "-"}
              label="kcal / kun"
            />
            <HeroMetric
              icon={budgetTarget ? WalletIcon : CalendarDaysIcon}
              value={
                budgetTarget
                  ? formatPlanCurrency(
                      budgetTarget.targetCost,
                      budgetTarget.currency,
                    )
                  : formatPlanDate(currentPlan?.updatedAt || currentPlan?.startDate)
              }
              label={budgetTarget ? "byudjet" : "yangilandi"}
            />
            <HeroMetric
              icon={CalendarDaysIcon}
              value={durationDays}
              label="kunlik reja"
            />
          </div>

          <div
            className="mt-4 grid grid-cols-3 gap-2"
          >
            <Button
              type="button"
              className="h-10 rounded-xl px-2 text-xs font-bold shadow-md shadow-primary/10 sm:px-3 sm:text-sm"
              disabled={!currentPlan}
              onClick={() => currentPlan && onActivatePlan(currentPlan)}
            >
              <CalendarDaysIcon className="size-4" />
              Bugungi reja
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl bg-card/80 px-2 text-xs font-bold sm:px-3 sm:text-sm"
              disabled={!currentPlan}
              onClick={() => currentPlan && onOpenPlanActions(currentPlan)}
            >
              <PencilIcon className="size-4" />
              Tahrirlash
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl bg-card/80 px-2 text-xs font-bold sm:px-3 sm:text-sm"
              disabled={!currentPlan}
              onClick={() =>
                currentPlan && onSelectPlanForShopping(currentPlan.id)
              }
            >
              <ShoppingCartIcon className="size-4" />
              Xaridlar
            </Button>
          </div>
        </div>
      </div>
    </NutritionCard>
  );
};

const HeroMetric = ({ icon: Icon, value, label }) => (
  <div className="flex min-w-0 items-center gap-2 rounded-xl border-border/70 bg-card/45 px-2.5 py-2 sm:bg-transparent sm:px-0 lg:border-r lg:pr-2 last:border-r-0">
    <div className="grid size-7 shrink-0 place-items-center rounded-xl text-primary">
      <Icon className="size-4" />
    </div>
    <div className="min-w-0">
      <p className="text-base font-black leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  </div>
);

const AIRecommendationsPanel = ({ onAction }) => (
  <NutritionCard className="h-full px-6 py-7">
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <LightbulbIcon className="size-5" />
        </div>
        <h2 className="text-lg font-black">AI tavsiyalari</h2>
      </div>
      <p className="mt-7 text-sm leading-7 text-muted-foreground">
        Maqsadingiz, ovqatlanish odatlaringiz va allergiyalaringizni inobatga
        olib, bugun uchun tavsiyalar.
      </p>
      <div className="mt-7 space-y-5">
        {map(
          [
            "Kaloriya va makrolarni hisoblaydi",
            "Tanlangan maqsadga moslashtiradi",
            "Yoqtirgan taomlaringizni inobatga oladi",
          ],
          (item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">{item}</p>
            </div>
          ),
        )}
      </div>
      <button
        type="button"
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full text-sm font-black text-primary outline-none transition hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onAction}
      >
        Ko'proq bilish
        <ArrowRightIcon className="size-4" />
      </button>
    </div>
  </NutritionCard>
);

const TemplateCompatibilityDrawer = ({
  template,
  open,
  onOpenChange,
  onSelect,
}) => {
  const {
    template: detailTemplate,
    isLoading: isDetailLoading,
    isFetching: isDetailFetching,
  } = useMealPlanTemplateDetail(template?.id, {
    enabled: open && Boolean(template?.id),
  });
  const { preview, isLoading, isFetching, isError, refetch } =
    useMealPlanTemplateConflictPreview(template?.id, {
      enabled: open && Boolean(template?.id),
    });
  const isBusy = isLoading || isFetching;
  const isDetailBusy = isDetailLoading || isDetailFetching;
  const templateForPreview = detailTemplate?.id ? detailTemplate : template;
  const previewReasons = isArray(preview?.blockingReasons)
    ? preview.blockingReasons
    : [];
  const templateReasons = isArray(templateForPreview?.blockingReasons)
    ? templateForPreview.blockingReasons
    : [];
  const blockingReasons = previewReasons.length
    ? previewReasons
    : templateReasons;
  const reasonLabels = getTemplateBlockingReasonLabels({
    isCompatible: false,
    blockingReasons,
  });
  const canSelect =
    Boolean(template?.id) &&
    !isError &&
    templateForPreview?.isCompatible !== false &&
    preview?.isCompatible !== false &&
    preview?.canApply !== false &&
    preview?.canActivate !== false;
  const days = getTemplateDays(templateForPreview);
  const dayPreviews = React.useMemo(
    () => buildTemplateDayPreview(templateForPreview, days),
    [templateForPreview, days],
  );
  const computedDaysWithMeals = filter(
    dayPreviews,
    (day) => day.mealCount > 0,
  ).length;
  const computedMealsCount = reduce(
    dayPreviews,
    (total, day) => total + day.mealCount,
    0,
  );
  const daysWithMeals =
    toNumber(templateForPreview?.daysWithMeals) || computedDaysWithMeals;
  const mealsCount =
    getTemplateMealsCount(templateForPreview) || computedMealsCount;
  const mealsPerDay = getTemplateMealsPerDay(templateForPreview);
  const hasDayDetails = isArray(templateForPreview?.days)
    ? templateForPreview.days.length > 0
    : false;
  const sparseDays = filter(dayPreviews, (day) => day.isSparse);
  const sparseDayText = map(
    take(sparseDays, 4),
    (day) => `${day.dayNumber}-kun`,
  ).join(", ");
  const StatusIcon = canSelect ? CheckCircle2Icon : XCircleIcon;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>Shablon mosligi</DrawerTitle>
          <DrawerDescription>
            {template?.title || template?.name || "Tanlangan shablon"}
          </DrawerDescription>
        </DrawerHeader>

        <NutritionDrawerBody className="space-y-4 pb-5">
          {isBusy ? (
            <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 text-sm font-semibold text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Moslik tekshirilmoqda...
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  canSelect
                    ? "border-primary/20 bg-primary/5 text-primary"
                    : "border-destructive/20 bg-destructive/5 text-destructive",
                )}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-black">
                      {canSelect ? "Bu shablon mos" : "Bu shablon mos emas"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-current/80">
                      {canSelect
                        ? "Rejani tanlashdan oldin kunlar, kaloriya va ovqat qamrovini tekshiring."
                        : "Sabablarni ko'rib chiqing yoki boshqa shablon tanlang."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {map(
                  [
                    ["Kun qamrovi", `${daysWithMeals}/${days}`],
                    ["Kaloriya", `${getTemplateCalories(templateForPreview)} kcal`],
                    ["Ovqatlar", mealsCount ? `${mealsCount} ta` : "-"],
                    ["Mahal", mealsPerDay ? `${mealsPerDay} / kun` : "-"],
                  ],
                  ([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border bg-background/60 px-3 py-3"
                    >
                      <p className="text-[11px] font-bold uppercase text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-base font-black">{value}</p>
                    </div>
                  ),
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">30 kunlik preview</p>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-black text-muted-foreground">
                    {hasDayDetails
                      ? `${daysWithMeals}/${days}`
                      : "detail kutilmoqda"}
                  </span>
                </div>

                {isDetailBusy ? (
                  <div className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-dashed bg-muted/20 text-sm font-semibold text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    Kunlar yuklanmoqda...
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-5 gap-1.5 sm:grid-cols-6"
                    role="list"
                    aria-label="Shablon kunlari preview"
                  >
                    {map(dayPreviews, (day) => (
                      <div
                        key={day.dayNumber}
                        role="listitem"
                        className={cn(
                          "min-h-16 rounded-2xl border px-2 py-2 text-center",
                          day.hasDetails && !day.isSparse
                            ? "border-primary/15 bg-primary/5"
                            : day.isSparse
                              ? "border-amber-500/25 bg-amber-500/10"
                              : "border-dashed bg-muted/20",
                        )}
                      >
                        <p className="text-[11px] font-black text-foreground">
                          {day.dayNumber}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-muted-foreground">
                          {day.hasDetails ? `${day.mealCount} ta` : "-"}
                        </p>
                        <p className="text-[10px] font-black tabular-nums text-primary">
                          {day.hasDetails && day.calories > 0
                            ? `${day.calories}`
                            : "0"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!isDetailBusy && !hasDayDetails ? (
                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
                    Kunlar tafsiloti backenddan kelmadi. To'liq preview uchun
                    shablon detail kontraktini tekshiring.
                  </div>
                ) : null}

                {!isDetailBusy && sparseDays.length > 0 ? (
                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
                    Sparse kunlar: {sparseDayText}
                    {sparseDays.length > 4
                      ? ` va yana ${sparseDays.length - 4} ta`
                      : ""}
                    . Bu kunlarda ovqat yoki kaloriya to'liq emas.
                  </div>
                ) : null}
              </div>

              {isError ? (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                  Moslikni tekshirib bo'lmadi.
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => refetch()}
                  >
                    Qayta urinish
                  </Button>
                </div>
              ) : null}

              {reasonLabels.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-black">Conflict sabablari</p>
                  {map(reasonLabels, (label) => (
                    <div
                      key={label}
                      className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
                    >
                      <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                      <span>{label}</span>
                    </div>
                  ))}
                  <div className="rounded-2xl border bg-background/60 px-3 py-3">
                    <p className="text-xs font-black uppercase text-muted-foreground">
                      Nima qilish mumkin?
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                      <li>
                        Preference va allergiyalarni profil sozlamalarida
                        yangilang.
                      </li>
                      <li>
                        Boshqa shablon tanlang yoki mos ovqatlar bilan
                        almashtiring.
                      </li>
                      <li>
                        Admin substitution qo'shgandan keyin moslikni qayta
                        tekshiring.
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-3 text-sm font-semibold text-primary">
                  Conflict topilmadi. Shablonni tanlash mumkin.
                </div>
              )}
            </>
          )}
        </NutritionDrawerBody>

        <DrawerFooter>
          <Button
            type="button"
            disabled={!canSelect || isBusy}
            onClick={() => {
              if (template) {
                onSelect?.(template);
              }
            }}
          >
            Shablonni tanlash
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Yopish
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
};

export default function NutritionPlansView({
  orderedPlans,
  currentPlan,
  goals,
  currentPlanDayStatus,
  planInsightsMap,
  getPlanStatusMeta,
  getPlanSourceMeta,
  onActivatePlan,
  onOpenPlanActions,
  onRemovePlan,
  onSelectPlanForShopping,
  onCreateAI,
  onCreateFromTemplate,
  onActivateTemplate,
  templates = [],
  isTemplateLoading = false,
}) {
  const { t } = useTranslation();
  const [planFilter, setPlanFilter] = React.useState("all");
  const [previewTemplate, setPreviewTemplate] = React.useState(null);
  const filteredPlans = React.useMemo(() => {
    if (planFilter === "all") {
      return orderedPlans;
    }

    return filter(orderedPlans, (plan) => plan.status === planFilter);
  }, [orderedPlans, planFilter]);
  const filterOptions = [
    { key: "all", label: t("user.nutrition.plansPage.filters.all") },
    { key: "active", label: t("user.nutrition.plansPage.filters.active") },
    { key: "draft", label: t("user.nutrition.plansPage.filters.draft") },
    { key: "paused", label: t("user.nutrition.plansPage.filters.paused") },
    { key: "archived", label: t("user.nutrition.plansPage.filters.archived") },
  ];
  const templateCards = React.useMemo(
    () =>
      take(isArray(templates) ? templates : [], 4).map((template) =>
        buildTemplateCard(template),
      ),
    [templates],
  );
  const closePreview = React.useCallback((nextOpen) => {
    if (!nextOpen) {
      setPreviewTemplate(null);
    }
  }, []);

  return (
    <NutritionLayout mainClassName="space-y-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <MealPlanHero
          currentPlan={currentPlan}
          goals={goals}
          currentPlanDayStatus={currentPlanDayStatus}
          planInsightsMap={planInsightsMap}
          onActivatePlan={onActivatePlan}
          onOpenPlanActions={onOpenPlanActions}
          onSelectPlanForShopping={onSelectPlanForShopping}
        />
        <AIRecommendationsPanel onAction={onCreateAI} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black">
            {t("user.nutrition.plansPage.popularTemplates")}
          </h2>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-full text-sm font-black text-primary outline-none transition hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onCreateFromTemplate}
          >
            {t("user.nutrition.plansPage.viewAll")}
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
        {isTemplateLoading ? (
          <div className="rounded-[28px] border border-dashed p-5 text-sm text-muted-foreground">
            {t("user.nutrition.plansPage.templatesLoading")}
          </div>
        ) : templateCards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {map(templateCards, (template) => (
              <PlanTemplateCard
                key={template.id || template.title}
                {...template}
                onPreview={() => setPreviewTemplate(template)}
                onSelect={() => onActivateTemplate?.(template)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed p-5 text-sm text-muted-foreground">
            {t("user.nutrition.plansPage.noTemplates")}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">
              {t("user.nutrition.plansPage.myPlans")}
            </h2>
          </div>
          <FilterChips
            options={filterOptions}
            value={planFilter}
            onChange={setPlanFilter}
            ariaLabel={t("user.nutrition.plansPage.statusFilter")}
          />
        </div>
        <div
          className={cn(
            "space-y-3",
            filteredPlans.length > 0 &&
              "rounded-[28px] border border-[rgb(var(--accent-rgb)/0.14)] bg-card/95 shadow-sm shadow-black/[0.03]",
          )}
        >
          <NutritionPlansList
            variant="table"
            orderedPlans={filteredPlans}
            currentPlan={currentPlan}
            planInsightsMap={planInsightsMap}
            getPlanStatusMeta={getPlanStatusMeta}
            getPlanSourceMeta={getPlanSourceMeta}
            onActivatePlan={onActivatePlan}
            onOpenPlanActions={onOpenPlanActions}
            onRemovePlan={onRemovePlan}
            onSelectPlanForShopping={onSelectPlanForShopping}
            goals={goals}
          />
        </div>
      </section>

      <TemplateCompatibilityDrawer
        open={Boolean(previewTemplate)}
        template={previewTemplate}
        onOpenChange={closePreview}
        onSelect={onActivateTemplate}
      />
    </NutritionLayout>
  );
}
