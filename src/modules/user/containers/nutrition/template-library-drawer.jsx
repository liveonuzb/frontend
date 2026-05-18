import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";
import { useMealPlanTemplates } from "@/hooks/app/use-meal-plan";
import {
  NutritionDrawerBody,
  NutritionDrawerContent,
} from "./nutrition-drawer-layout.jsx";

import { map, take } from "lodash";

const GOAL_FILTERS = [
  { value: "all", label: "Barchasi" },
  { value: "lose_weight", label: "Vazn yo'qotish" },
  { value: "gain_muscle", label: "Mushak olish" },
  { value: "maintenance", label: "Balans" },
];

const GOAL_LABELS = {
  lose_weight: "Vazn yo'qotish",
  gain_muscle: "Mushak olish",
  maintenance: "Balans",
};

const TemplateSkeleton = () => (
  <div className="rounded-2xl border bg-card p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
      </div>
      <Skeleton className="size-9 rounded-full" />
    </div>
  </div>
);

export default function TemplateLibraryDrawer({
  open,
  onOpenChange,
  onSelectTemplate,
}) {
  const [goal, setGoal] = React.useState("all");
  const [pendingTemplateId, setPendingTemplateId] = React.useState(null);
  const { templates, isLoading, isFetching, isError, refetch } =
    useMealPlanTemplates({
      goal,
      enabled: open,
    });
  const isBusy = isLoading || isFetching;

  const handleSelect = React.useCallback(
    async (template) => {
      if (!template?.id) return;

      setPendingTemplateId(template.id);
      try {
        await onSelectTemplate?.(template);
      } finally {
        setPendingTemplateId(null);
      }
    },
    [onSelectTemplate],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>Shablon kutubxonasi</DrawerTitle>
          <DrawerDescription>
            Tayyor ovqatlanish rejasidan boshlang
          </DrawerDescription>
        </DrawerHeader>

        <NutritionDrawerBody className="space-y-4 pb-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {map(GOAL_FILTERS, (filter) => (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={goal === filter.value ? "default" : "outline"}
                className="shrink-0"
                onClick={() => setGoal(filter.value)}
              >
                {filter.value !== "all" ? (
                  <TargetIcon className="size-4" />
                ) : (
                  <BookOpenIcon className="size-4" />
                )}
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {isBusy ? (
              map([0, 1, 2], (item) => <TemplateSkeleton key={item} />)
            ) : isError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Shablonlarni yuklab bo'lmadi.
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-2xl border bg-muted/30 p-5 text-center">
                <BookOpenIcon className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">
                  Bu filtrda shablon yo'q
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Boshqa maqsadni tanlab ko'ring.
                </p>
              </div>
            ) : (
              map(templates, (template) => {
                const isPending = pendingTemplateId === template.id;

                return (
                  <div
                    key={template.id}
                    className="rounded-2xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 truncate text-sm font-black">
                            {template.title}
                          </h3>
                          <Badge variant="secondary">
                            {GOAL_LABELS[template.goal] || "Balans"}
                          </Badge>
                        </div>
                        {template.description ? (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <UtensilsIcon className="size-3.5" />
                            {template.daysWithMeals || 0} kun ·{" "}
                            {template.mealsCount || 0} ta ovqat
                          </span>
                        </div>
                        {template.tags.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {map(take(template.tags, 4), (tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleSelect(template)}
                        disabled={isPending}
                      >
                        <CheckCircle2Icon className="size-4" />
                        Tanlash
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </NutritionDrawerBody>

        <DrawerFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => (isError ? refetch() : onOpenChange(false))}
          >
            {isError ? "Qayta urinish" : "Yopish"}
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
