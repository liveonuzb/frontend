import { map } from "lodash";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  CheckIcon,
  ChevronRightIcon,
  PencilIcon,
  PlayIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import {
  NutritionDrawerContent,
  NutritionDrawerBody,
} from "./nutrition-drawer-layout.jsx";
import NutritionPlansList from "./nutrition-plans-list.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";

const PlanCardSkeleton = () => (
  <div className="rounded-3xl border bg-card p-4">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="size-10 rounded-full" />
    </div>
  </div>
);

export default function PlansDrawer({
  open,
  onOpenChange,
  isLoading = false,
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
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="sm">
        <DrawerHeader>
          <DrawerTitle>Mening rejalarim</DrawerTitle>
          <DrawerDescription>
            Rejalarni tanlang, boshqaring yoki yangi reja yarating
          </DrawerDescription>
        </DrawerHeader>

        <NutritionDrawerBody className="pb-5">
          <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              [0, 1, 2].map((item) => <PlanCardSkeleton key={item} />)
            ) : (
              <NutritionPlansList
                orderedPlans={orderedPlans}
                currentPlan={currentPlan}
                planInsightsMap={planInsightsMap}
                getPlanStatusMeta={getPlanStatusMeta}
                getPlanSourceMeta={getPlanSourceMeta}
                onActivatePlan={onActivatePlan}
                onOpenPlanActions={onOpenPlanActions}
                onRemovePlan={onRemovePlan}
                onSelectPlanForShopping={onSelectPlanForShopping}
              />
            )}
          </div>
        </NutritionDrawerBody>
        <DrawerFooter>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" onClick={onCreateManual}>
              <PencilIcon className="size-4" />
              Qo&apos;lda yaratish
            </Button>
            <Button onClick={onCreateAI}>
              <SparklesIcon className="size-4" />
              AI bilan yaratish
            </Button>
          </div>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
