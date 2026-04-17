import React from "react";
import { filter, find, get, map, size } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DumbbellIcon,
  PlusIcon,
  UtensilsCrossedIcon,
  XCircleIcon,
} from "lucide-react";

const EmptyCardState = ({ children }) => (
  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

const ClientPlansTab = ({
  isLoading,
  assignedTemplates,
  activeMealPlan,
  overview,
  onOpenMealAssign,
  onOpenWorkoutAssign,
  onUnassignMealPlan,
  onUnassignWorkoutPlan,
}) => {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* Meal Plan Section */}
      <Card className="overflow-hidden border-none bg-zinc-900/40 py-6 backdrop-blur-xl ring-1 ring-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <UtensilsCrossedIcon className="size-4 text-orange-500" />
            </div>
            <CardTitle className="text-lg">Ovqatlanish rejasi</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-white/10 bg-white/5"
            onClick={onOpenMealAssign}
          >
            <PlusIcon className="size-3.5" />
            Biriktirish
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-2xl" />
          ) : activeMealPlan || find(assignedTemplates, { status: "ACTIVE", type: "MEAL" }) ? (
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-orange-500/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-100">
                    {get(activeMealPlan, "name") ||
                      get(find(assignedTemplates, { status: "ACTIVE", type: "MEAL" }), "title", "Meal Plan")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Manba: {get(activeMealPlan, "source") === "ai" ? "AI Coach" : "Manual"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-none bg-orange-500/20 text-orange-500">Faol</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                    onClick={() =>
                      onUnassignMealPlan(
                        get(activeMealPlan, "coachTemplateId") ||
                          get(find(assignedTemplates, { status: "ACTIVE", type: "MEAL" }), "id"),
                      )
                    }
                  >
                    <XCircleIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-8 text-center">
              <p className="text-sm text-zinc-500">Faol meal plan biriktirilmagan</p>
            </div>
          )}

          {size(filter(assignedTemplates, (t) => get(t, "type") === "MEAL" && get(t, "status") !== "ACTIVE")) > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Boshqa biriktirilganlar
              </p>
              {map(
                filter(
                  assignedTemplates,
                  (t) => get(t, "type") === "MEAL" && get(t, "status") !== "ACTIVE",
                ),
                (plan) => (
                  <div
                    key={get(plan, "id")}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4 bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <UtensilsCrossedIcon className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{get(plan, "title")}</p>
                        <p className="text-xs text-muted-foreground">
                          {get(plan, "status") === "PAUSED" ? "Pauza" : "Tugatilgan"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUnassignMealPlan(get(plan, "id"))}
                    >
                      Olib tashlash
                    </Button>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workout Plan Section */}
      <Card className="overflow-hidden border-none bg-zinc-900/40 py-6 backdrop-blur-xl ring-1 ring-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <DumbbellIcon className="size-4 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Workout rejasi</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-white/10 bg-white/5"
            onClick={onOpenWorkoutAssign}
          >
            <PlusIcon className="size-3.5" />
            Biriktirish
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-2xl" />
          ) : get(overview, "activeWorkoutPlan") || find(assignedTemplates, { status: "ACTIVE", type: "WORKOUT" }) ? (
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-blue-500/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-100">
                    {get(overview, "activeWorkoutPlan.name") ||
                      get(find(assignedTemplates, { status: "ACTIVE", type: "WORKOUT" }), "title", "Workout Plan")}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {get(overview, "activeWorkoutPlan.description") ||
                      get(find(assignedTemplates, { status: "ACTIVE", type: "WORKOUT" }), "description", "Workout template")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border-none bg-blue-500/20 text-blue-500">Faol</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                    onClick={() =>
                      onUnassignWorkoutPlan(
                        get(overview, "activeWorkoutPlan.coachTemplateId") ||
                          get(find(assignedTemplates, { status: "ACTIVE", type: "WORKOUT" }), "id"),
                      )
                    }
                  >
                    <XCircleIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-8 text-center">
              <p className="text-sm text-zinc-500">Faol workout reja biriktirilmagan</p>
            </div>
          )}

          {size(filter(assignedTemplates, (t) => get(t, "type") === "WORKOUT" && get(t, "status") !== "ACTIVE")) > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Boshqa biriktirilganlar
              </p>
              {map(
                filter(
                  assignedTemplates,
                  (t) => get(t, "type") === "WORKOUT" && get(t, "status") !== "ACTIVE",
                ),
                (plan) => (
                  <div
                    key={get(plan, "id")}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4 bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <DumbbellIcon className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{get(plan, "title")}</p>
                        <p className="text-xs text-muted-foreground">
                          {get(plan, "status") === "PAUSED" ? "Pauza" : "Tugatilgan"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUnassignWorkoutPlan(get(plan, "id"))}
                    >
                      Olib tashlash
                    </Button>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPlansTab;
