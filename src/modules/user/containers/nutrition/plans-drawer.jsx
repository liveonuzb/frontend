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

export default function PlansDrawer({
  open,
  onOpenChange,
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
