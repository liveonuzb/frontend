import React from "react";
import NutritionAnalyticsSection from "../nutrition-analytics-section.jsx";

export default function NutritionReportView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Analytics
        </p>
        <h1 className="text-3xl font-black tracking-tight">Hisobot</h1>
      </div>
      <NutritionAnalyticsSection />
    </div>
  );
}
