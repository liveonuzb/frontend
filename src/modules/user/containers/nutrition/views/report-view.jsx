import React from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3Icon,
  DownloadIcon,
  ScaleIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import NutritionAnalyticsSection, {
  NUTRITION_REPORT_EXPORT_EVENT,
  NUTRITION_REPORT_TOGGLE_COMPARISON_EVENT,
} from "../nutrition-analytics-section.jsx";
import NutritionLayout from "../ui/nutrition-layout.jsx";
import NutritionPageHeader from "../ui/nutrition-page-header.jsx";
import NutritionCard from "../ui/nutrition-card.jsx";
import AIRecommendationCard from "../ui/ai-recommendation-card.jsx";

export default function NutritionReportView() {
  const navigate = useNavigate();
  const dispatchReportAction = (eventName) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(eventName));
  };
  const sidebar = (
    <>
      <AIRecommendationCard
        title="AI tavsiya"
        description="Hisobotdagi kaloriya, suv va makro trendlar asosida keyingi hafta uchun aniqroq reja tuzing."
        actionLabel="Rejalarni ko'rish"
        onAction={() => navigate("/user/nutrition/plans")}
      />
      <NutritionCard>
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black">Hisobot scope</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ma'lumotlar kiritilgan ovqatlar, suv loglari va maqsadlar asosida hisoblanadi.
            </p>
          </div>
        </div>
      </NutritionCard>
      <NutritionCard>
        <h2 className="text-sm font-black">Tez tekshiruv</h2>
        <div className="mt-3 space-y-2">
          {[
            [TargetIcon, "Maqsadga rioya qilish"],
            [ScaleIcon, "Makro balans"],
            [SparklesIcon, "Trend insightlar"],
          ].map(([Icon, label]) => (
            <div key={label} className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-sm font-bold">
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </div>
          ))}
        </div>
      </NutritionCard>
    </>
  );

  return (
    <NutritionLayout sidebar={sidebar}>
      <NutritionPageHeader
        eyebrow="Analytics"
        title="Hisobot"
        description="Kaloriya, makro, suv va ovqat kiritish odatlarini trendlar orqali kuzating."
        actions={(
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => dispatchReportAction(NUTRITION_REPORT_TOGGLE_COMPARISON_EVENT)}
            >
              <ScaleIcon className="size-4" />
              Taqqoslash
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => dispatchReportAction(NUTRITION_REPORT_EXPORT_EVENT)}
            >
              <DownloadIcon className="size-4" />
              Eksport qilish
            </Button>
          </>
        )}
      />
      <NutritionAnalyticsSection />
      <p className="text-xs font-medium text-muted-foreground">
        Hisobot ma'lumotlari kiritilgan ovqatlar va maqsadlar asosida hisoblanadi.
        Oxirgi yangilanish tanlangan sana oralig'i qayta yuklanganda yangilanadi.
      </p>
    </NutritionLayout>
  );
}
