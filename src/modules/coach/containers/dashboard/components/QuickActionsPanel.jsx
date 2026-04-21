import React from "react";
import { ArrowRightIcon } from "lucide-react";
import { slice } from "lodash";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ListRow,
  ListSkeleton,
  SectionCard,
} from "./dashboard-ui.jsx";

export const QuickActionsPanel = ({
  templates = [],
  workoutPlans = [],
  isLoading = false,
  isWorkoutPlansLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <SectionCard
        title="Workout Planlar"
        action={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl"
            onClick={() => navigate("/coach/workout-plans")}
          >
            <ArrowRightIcon className="size-4" />
          </Button>
        }
      >
        {isWorkoutPlansLoading ? (
          <ListSkeleton />
        ) : workoutPlans.length === 0 ? (
          <EmptyState text="Workout planlar yo'q" />
        ) : (
          slice(workoutPlans, 0, 3).map((plan, index) => (
            <React.Fragment key={plan.id}>
              {index > 0 ? <div className="mx-4 border-t" /> : null}
              <ListRow onClick={() => navigate("/coach/workout-plans")}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{plan.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{plan.totalExercises ?? 0} mashq</span>
                    <span className="inline-block size-1 rounded-full bg-border" />
                    <span>{plan.daysWithWorkouts ?? 0} kun</span>
                    {plan.difficulty ? (
                      <>
                        <span className="inline-block size-1 rounded-full bg-border" />
                        <span className="font-medium uppercase">
                          {plan.difficulty}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="ml-3 shrink-0 text-xs tabular-nums"
                >
                  {(plan.assignedClients ?? []).length} mijoz
                </Badge>
              </ListRow>
            </React.Fragment>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Meal Planlar"
        action={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl"
            onClick={() => navigate("/coach/meal-plans")}
          >
            <ArrowRightIcon className="size-4" />
          </Button>
        }
      >
        {isLoading ? (
          <ListSkeleton />
        ) : templates.length === 0 ? (
          <EmptyState text="Meal planlar yo'q" />
        ) : (
          slice(templates, 0, 3).map((plan, index) => (
            <React.Fragment key={plan.id}>
              {index > 0 ? <div className="mx-4 border-t" /> : null}
              <ListRow onClick={() => navigate("/coach/meal-plans")}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{plan.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {plan.mealsCount ?? 0} ovqat • {plan.daysWithMeals ?? 0} kun
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="ml-3 shrink-0 text-[10px] text-muted-foreground"
                >
                  {plan.source === "ai" ? "AI" : "Qo'lda"}
                </Badge>
              </ListRow>
            </React.Fragment>
          ))
        )}
      </SectionCard>
    </>
  );
};

export default QuickActionsPanel;
