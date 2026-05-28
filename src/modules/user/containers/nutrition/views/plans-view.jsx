import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  FlameIcon,
  DumbbellIcon,
  LightbulbIcon,
  LeafIcon,
  PencilIcon,
  ScaleIcon,
  ShoppingCartIcon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";
import NutritionPlansList from "../nutrition-plans-list.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import FilterChips from "../ui/filter-chips.jsx";
import PlanTemplateCard from "../ui/plan-template-card.jsx";
import useAppModeTheme from "@/hooks/app/use-app-mode-theme";
import { cn } from "@/lib/utils.js";

import { filter, map, toNumber } from "lodash";

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

const getPlanCalories = (plan, goals) =>
  toNumber(plan?.appliedTargetCalories || goals?.calories || 0);

const MealPlanHero = ({
  currentPlan,
  goals,
  currentPlanDayStatus,
  planInsightsMap,
  onActivatePlan,
  onOpenPlanActions,
  onSelectPlanForShopping,
}) => {
  const modeTheme = useAppModeTheme();
  const planInsights = currentPlan?.id
    ? planInsightsMap[currentPlan.id] || {}
    : {};
  const mealCount = toNumber(currentPlan?.mealCount || 4) || 4;
  const calories = getPlanCalories(currentPlan, goals);
  const durationDays = toNumber(currentPlan?.durationDays || 7) || 7;
  const filledDays = Math.min(
    durationDays,
    Math.max(toNumber(planInsights.filledDays || 0), currentPlan ? 1 : 0),
  );
  const progress = durationDays
    ? Math.round((filledDays / durationDays) * 100)
    : 0;
  const progressDash = `${progress}, 100`;
  const statusLabel =
    currentPlan?.status === "active"
      ? "Faol reja"
      : currentPlan
        ? "Saqlangan reja"
        : "Reja tanlanmagan";

  return (
    <NutritionCard
      tone="accent"
      className="relative min-h-[340px] overflow-hidden px-6 py-6 sm:px-8 lg:min-h-[360px] lg:px-9"
    >
      <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-[radial-gradient(circle_at_70%_20%,rgb(var(--accent-rgb)/0.16),transparent_34%),linear-gradient(135deg,transparent,rgb(var(--accent-rgb)/0.10))] lg:block" />
      <div className="absolute -right-16 bottom-0 hidden h-72 w-72 rounded-full bg-primary/10 blur-3xl lg:block" />

      <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-primary/15 bg-card/70 px-4 py-2 text-sm font-bold text-primary shadow-sm">
            {statusLabel}
          </span>
          <h1 className="mt-6 max-w-[760px] text-3xl font-black tracking-normal text-foreground sm:text-4xl xl:text-5xl">
            {currentPlan?.name || "Ovqatlanish rejangizni yarating"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            {currentPlan
              ? "Sizning hozirgi ovqatlanish rejangiz. Bugun uchun tayyor!"
              : "Shablondan tanlang yoki o'zingizga mos reja yarating."}
          </p>

          <div className="mt-8 grid max-w-3xl gap-2 rounded-3xl border border-border/70 bg-background/70 p-4 shadow-sm backdrop-blur sm:grid-cols-2 xl:grid-cols-4">
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
              icon={CalendarDaysIcon}
              value={formatPlanDate(
                currentPlan?.updatedAt || currentPlan?.startDate,
              )}
              label="yangilandi"
            />
            <HeroMetric
              icon={CalendarDaysIcon}
              value={durationDays}
              label="kunlik reja"
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="h-14 rounded-2xl px-7 text-base shadow-lg shadow-primary/15"
              disabled={!currentPlan}
              onClick={() => currentPlan && onActivatePlan(currentPlan)}
            >
              <CalendarDaysIcon className="size-5" />
              Bugungi reja
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-2xl bg-card/80 px-7 text-base"
              disabled={!currentPlan}
              onClick={() => currentPlan && onOpenPlanActions(currentPlan)}
            >
              <PencilIcon className="size-5" />
              Tahrirlash
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 rounded-2xl bg-card/80 px-7 text-base"
              disabled={!currentPlan}
              onClick={() =>
                currentPlan && onSelectPlanForShopping(currentPlan.id)
              }
            >
              <ShoppingCartIcon className="size-5" />
              Xaridlar ro'yxati
            </Button>
          </div>
        </div>

        <div className="relative mx-auto hidden min-h-[285px] w-full max-w-[330px] lg:block">
          <img
            src={modeTheme.assets.nutritionPlanHero || "/zen/meals/lunch.webp"}
            alt=""
            className="absolute right-0 top-0 h-44 w-64 object-contain drop-shadow-2xl"
            loading="lazy"
          />
          <div className="absolute bottom-0 right-4 w-40 rounded-[26px] border border-border/70 bg-background/90 p-5 text-center shadow-xl backdrop-blur">
            <div className="relative mx-auto size-28">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <path
                  d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary/10"
                />
                <path
                  d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 0 1 0-31"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={progressDash}
                  strokeLinecap="round"
                  strokeWidth="3"
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div>
                  <p className="text-2xl font-black">
                    {filledDays}/{durationDays}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                    kun tayyor
                  </p>
                  <p className="text-sm font-black">{progress}%</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {currentPlanDayStatus?.dayNumber
                ? `${currentPlanDayStatus.dayNumber}-kun`
                : "Bugun"}
            </p>
          </div>
        </div>
      </div>
    </NutritionCard>
  );
};

const HeroMetric = ({ icon: Icon, value, label }) => (
  <div className="flex min-w-0 items-center gap-2 border-border/70 py-1 sm:border-r sm:pr-2 last:border-r-0">
    <div className="grid size-8 shrink-0 place-items-center rounded-2xl text-primary">
      <Icon className="size-4" />
    </div>
    <div className="min-w-0">
      <p className="text-lg font-black leading-none tabular-nums">{value}</p>
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
}) {
  const [planFilter, setPlanFilter] = React.useState("all");
  const filteredPlans = React.useMemo(() => {
    if (planFilter === "all") {
      return orderedPlans;
    }

    return filter(orderedPlans, (plan) => plan.status === planFilter);
  }, [orderedPlans, planFilter]);
  const filterOptions = [
    { key: "all", label: "Barchasi" },
    { key: "active", label: "Faol" },
    { key: "draft", label: "Qoralama" },
    { key: "archived", label: "Arxiv" },
  ];
  const templateCards = [
    {
      title: "Og'irlikni kamaytirish",
      description: "Kaloriya nazorati, yuqori oqsil va barqaror kunlik ritm.",
      calories: "1,850",
      badge: "Popular",
      icon: ScaleIcon,
    },
    {
      title: "Mushak massasi",
      description:
        "Ko'proq oqsil, mashg'ulotdan keyingi tiklanish va energiya.",
      calories: "2,650",
      badge: "Sport",
      icon: DumbbellIcon,
    },
    {
      title: "Sog'lom turmush",
      description:
        "Balansli makrolar, suv, vitaminlar va yengil haftalik menyu.",
      calories: "2,150",
      badge: "Balance",
      icon: TargetIcon,
    },
    {
      title: "Vegan balans",
      description: "O'simlik oqsili, temir va B12 e'tiborda bo'lgan reja.",
      calories: "2,050",
      badge: "Vegan",
      icon: LeafIcon,
    },
  ];
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
          <h2 className="text-xl font-black">Mashhur shablonlar</h2>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-full text-sm font-black text-primary outline-none transition hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onCreateFromTemplate}
          >
            Barchasini ko'rish
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {map(templateCards, (template) => (
            <PlanTemplateCard
              key={template.title}
              {...template}
              onSelect={onCreateFromTemplate}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Mening rejalarim</h2>
          </div>
          <FilterChips
            options={filterOptions}
            value={planFilter}
            onChange={setPlanFilter}
            ariaLabel="Reja statuslari"
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
    </NutritionLayout>
  );
}
