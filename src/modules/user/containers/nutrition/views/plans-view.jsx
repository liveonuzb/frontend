import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArchiveIcon,
  BookOpenIcon,
  DumbbellIcon,
  LeafIcon,
  PencilIcon,
  ScaleIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import NutritionPlansList from "../nutrition-plans-list.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionPageHeader from "../ui/nutrition-page-header.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import AIRecommendationCard from "../ui/ai-recommendation-card.jsx";
import FilterChips from "../ui/filter-chips.jsx";
import PlanTemplateCard from "../ui/plan-template-card.jsx";

import { filter, map } from "lodash";

export default function NutritionPlansView({
  orderedPlans,
  currentPlan,
  planInsightsMap,
  getPlanStatusMeta,
  getPlanSourceMeta,
  onActivatePlan,
  onOpenPlanActions,
  onRemovePlan,
  onSelectPlanForShopping,
  onCreateManual,
  onCreateAI,
  onCreateFromTemplate,
  onRescalePlanCalories,
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
  const sidebar = (
    <>
      <AIRecommendationCard
        title="AI tavsiya"
        description="Maqsadingiz, oxirgi ovqatlar va suv odatingiz asosida mos reja yaratish uchun AI generatorni ishga tushiring."
        actionLabel="AI bilan yaratish"
        onAction={onCreateAI}
      />
      <NutritionCard>
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpenIcon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-black">
              Boshlash bo'yicha maslahatlar
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>1. Avval maqsadingizga mos shablonni tanlang.</p>
              <p>2. Kaloriya va makrolarni hozirgi maqsadlaringizga moslang.</p>
              <p>
                3. Rejani faollashtirib, bugungi ovqatlar bilan sinab ko'ring.
              </p>
            </div>
          </div>
        </div>
      </NutritionCard>
    </>
  );

  return (
    <NutritionLayout sidebar={sidebar}>
      <NutritionPageHeader
        eyebrow="Ovqatlanish rejalari"
        title="Rejalar"
        description="Shaxsiy maqsad, jadval va real ovqat odatlariga mos haftalik menyular."
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onCreateManual}
            >
              <PencilIcon className="size-4" />
              Qo&apos;lda yaratish
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onCreateFromTemplate}
            >
              <BookOpenIcon className="size-4" />
              Shablondan tanlash
            </Button>
            <Button className="rounded-full" onClick={onCreateAI}>
              <SparklesIcon className="size-4" />
              AI bilan yaratish
            </Button>
          </>
        }
      />

      <NutritionCard tone="accent" className="p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">
              Starter dashboard
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              O'zingizga mos ovqatlanish rejasini yarating
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Rejani noldan boshlang, tayyor shablondan foydalaning yoki AI
              yordamida kunlik kaloriya, makro va meal timingni moslab oling.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button className="rounded-full" onClick={onCreateAI}>
              <SparklesIcon className="size-4" />
              AI orqali yaratish
            </Button>
            <Button
              variant="outline"
              className="rounded-full bg-card/80"
              onClick={onCreateFromTemplate}
            >
              <BookOpenIcon className="size-4" />
              Shablonlardan tanlash
            </Button>
          </div>
        </div>
      </NutritionCard>

      {currentPlan ? (
        <NutritionCard className="border-primary/20 bg-primary/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Faol reja
              </p>
              <h2 className="mt-2 text-xl font-black">{currentPlan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentPlan.status === "active"
                  ? "Ishlatilmoqda"
                  : "Tanlangan"}{" "}
                • {currentPlan.source === "ai" ? "AI" : "Manual"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => onRescalePlanCalories?.(currentPlan.id)}
              >
                <ScaleIcon className="size-4" />
                Kaloriyaga moslash
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => onSelectPlanForShopping(currentPlan.id)}
              >
                <ArchiveIcon className="size-4" />
                Xaridlar ro'yxati
              </Button>
            </div>
          </div>
        </NutritionCard>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-black">Mashhur shablonlar</h2>
          <p className="text-sm text-muted-foreground">
            Real data bo'lmaganda ham UI va flow ishlashi uchun starter
            shablonlar.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {map(templateCards, (template) => (
            <PlanTemplateCard
              key={template.title}
              {...template}
              onSelect={onCreateFromTemplate}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black">Yaqinda ishlatilgan rejalar</h2>
            <p className="text-sm text-muted-foreground">
              Rejalarni status bo'yicha ko'ring, faollashtiring yoki tahrirlang.
            </p>
          </div>
          <FilterChips
            options={filterOptions}
            value={planFilter}
            onChange={setPlanFilter}
            ariaLabel="Reja statuslari"
          />
        </div>
        <div className="space-y-3">
          <NutritionPlansList
            orderedPlans={filteredPlans}
            currentPlan={currentPlan}
            planInsightsMap={planInsightsMap}
            getPlanStatusMeta={getPlanStatusMeta}
            getPlanSourceMeta={getPlanSourceMeta}
            onActivatePlan={onActivatePlan}
            onOpenPlanActions={onOpenPlanActions}
            onRemovePlan={onRemovePlan}
            onSelectPlanForShopping={onSelectPlanForShopping}
          />
        </div>
      </section>
    </NutritionLayout>
  );
}
