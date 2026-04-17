import React from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRightIcon, DumbbellIcon } from "lucide-react";

export default function WorkoutWidget({ activePlan }) {
  return (
    <Card className="relative overflow-hidden h-full">
      <div className="absolute -right-4 -top-4 size-20 bg-primary/20 rounded-full blur-[24px] group-hover:bg-primary/30 transition-colors" />
      <CardHeader className="pb-2 relative z-10 px-4 pt-4">
        <CardTitle className="text-xs font-bold flex items-center gap-1.5">
          <div className="p-1 rounded bg-primary/10">
            <DumbbellIcon className="size-3 text-primary" />
          </div>
          Mashg'ulot
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 flex-1 flex flex-col justify-center px-4 pb-4">
        {activePlan ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold truncate">{activePlan.name}</p>
            <div className="flex items-center gap-2">
              <Progress value={activePlan.progress ?? 0} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground shrink-0">
                {activePlan.progress ?? 0}%
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {activePlan.completedWorkouts ?? 0} / {activePlan.days ?? 0} sessiya
            </div>
            <Link
              to="/user/workout"
              className="inline-flex items-center text-[11px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors self-start mt-1"
            >
              Davom etish <ArrowRightIcon className="size-3 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              Reja yo'q
            </p>
            <Link
              to="/user/workout"
              className="inline-flex items-center text-[11px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
            >
              Boshlash <ArrowRightIcon className="size-3 ml-1" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
