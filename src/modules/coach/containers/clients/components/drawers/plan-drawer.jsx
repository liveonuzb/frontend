import { get, map, size } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UtensilsIcon, DumbbellIcon, ArrowRightIcon } from "lucide-react";

export const PlanDrawer = ({ 
  open, 
  onOpenChange, 
  planType, 
  plans, 
  onAssign, 
  selectedCount 
}) => {
  const { t } = useTranslation();
  const isMeal = planType === "meal";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto flex h-[70dvh] flex-col data-[vaul-drawer-direction=bottom]:md:max-w-lg">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            {isMeal ? <UtensilsIcon className="size-5" /> : <DumbbellIcon className="size-5" />}
            {isMeal ? t("coach.clients.plans.assignMealTitle") : t("coach.clients.plans.assignWorkoutTitle")}
          </DrawerTitle>
          <DrawerDescription>
            {t("coach.clients.plans.description", { count: selectedCount })}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 py-6">
            {map(plans, (plan) => (
              <button
                key={get(plan, "id")}
                type="button"
                className="group relative w-full overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
                onClick={() => onAssign(get(plan, "id"))}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-tight">
                        {get(plan, "name")}
                      </span>
                      {get(plan, "isPublic") && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1 text-[9px] uppercase tracking-wider bg-primary/5 text-primary border-none"
                        >
                          Public
                        </Badge>
                      )}
                    </div>
                    {get(plan, "description") && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {get(plan, "description")}
                      </p>
                    )}
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/5 text-primary transition-transform group-hover:translate-x-1 group-hover:bg-primary group-hover:text-white">
                    <ArrowRightIcon className="size-4" />
                  </div>
                </div>
              </button>
            ))}
            {size(plans) === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                   {isMeal ? <UtensilsIcon className="size-6 text-muted-foreground" /> : <DumbbellIcon className="size-6 text-muted-foreground" />}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("coach.clients.plans.emptyTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("coach.clients.plans.emptyDesc")}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t">
          <Button variant="outline" className="h-12 rounded-2xl" onClick={() => onOpenChange(false)}>
            {t("coach.clients.plans.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
