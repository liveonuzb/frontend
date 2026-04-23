import React from "react";
import { Link } from "react-router";
import { ArrowRightIcon, DumbbellIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CoachWorkoutWidget({ activePlan }) {
  return (
    <Card className="relative h-full overflow-hidden">
      <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/20 blur-[24px] transition-colors group-hover:bg-primary/30" />
      <CardHeader className="relative z-10 px-4 pb-2 pt-4">
        <CardTitle className="flex items-center gap-1.5 text-xs font-bold">
          <div className="rounded bg-primary/10 p-1">
            <DumbbellIcon className="size-3 text-primary" />
          </div>
          Mashg'ulot
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-4">
        {activePlan ? (
          <div className="flex flex-col gap-2">
            <p className="truncate text-xs font-semibold">{activePlan.name}</p>
            <div className="flex items-center gap-2">
              <Progress value={activePlan.progress ?? 0} className="h-1.5 flex-1" />
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {activePlan.progress ?? 0}%
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {activePlan.completedWorkouts ?? 0} / {activePlan.days ?? 0} sessiya
            </div>
            <Link
              to="/user/workout"
              className="mt-1 inline-flex self-start rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
            >
              Davom etish <ArrowRightIcon className="ml-1 size-3" />
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Reja yo'q</p>
            <Link
              to="/user/workout"
              className="inline-flex rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
            >
              Boshlash <ArrowRightIcon className="ml-1 size-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
