import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatchReportAction = (eventName) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(eventName));
  };
  const sidebar = (
    <>
      <AIRecommendationCard
        title={t("user.nutrition.reportPage.aiTitle")}
        description={t("user.nutrition.reportPage.aiDescription")}
        actionLabel={t("user.nutrition.reportPage.viewPlans")}
        onAction={() => navigate("/user/nutrition/plans")}
      />
      <NutritionCard>
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black">
              {t("user.nutrition.reportPage.scopeTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("user.nutrition.reportPage.scopeDescription")}
            </p>
          </div>
        </div>
      </NutritionCard>
      <NutritionCard>
        <h2 className="text-sm font-black">
          {t("user.nutrition.reportPage.quickCheckTitle")}
        </h2>
        <div className="mt-3 space-y-2">
          {[
            [TargetIcon, t("user.nutrition.reportPage.quickGoal")],
            [ScaleIcon, t("user.nutrition.reportPage.quickMacro")],
            [SparklesIcon, t("user.nutrition.reportPage.quickTrends")],
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
        title={t("user.nutrition.reportPage.title")}
        description={t("user.nutrition.reportPage.description")}
        actions={(
          <>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => dispatchReportAction(NUTRITION_REPORT_TOGGLE_COMPARISON_EVENT)}
            >
              <ScaleIcon className="size-4" />
              {t("user.nutrition.reportPage.compare")}
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => dispatchReportAction(NUTRITION_REPORT_EXPORT_EVENT)}
            >
              <DownloadIcon className="size-4" />
              {t("user.nutrition.reportPage.export")}
            </Button>
          </>
        )}
      />
      <NutritionAnalyticsSection />
      <p className="text-xs font-medium text-muted-foreground">
        {t("user.nutrition.reportPage.footerNote")}
      </p>
    </NutritionLayout>
  );
}
