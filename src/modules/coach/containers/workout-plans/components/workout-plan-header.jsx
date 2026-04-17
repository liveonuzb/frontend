import React from "react";
import { ZapIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const WorkoutPlanHeader = ({ onNewPlan }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ZapIcon className="size-6 text-primary" />
          {t("coach.workoutPlans.header.title")}
        </h1>
        <p className="text-muted-foreground">{t("coach.workoutPlans.header.description")}</p>
      </div>
      <Button onClick={onNewPlan}>{t("coach.workoutPlans.header.newTemplate")}</Button>
    </div>
  );
};

export default WorkoutPlanHeader;
