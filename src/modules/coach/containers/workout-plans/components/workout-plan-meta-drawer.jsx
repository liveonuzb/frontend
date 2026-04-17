import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const WorkoutPlanMetaDrawer = ({
  open,
  onOpenChange,
  mode,
  name,
  setName,
  description,
  setDescription,
  onPrimaryAction,
  onSecondaryAction,
}) => {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 py-5 text-left">
          <DrawerTitle>
            {mode === "create"
              ? t("coach.workoutPlans.drawers.meta.createTitle")
              : t("coach.workoutPlans.drawers.meta.editTitle")}
          </DrawerTitle>
          <DrawerDescription>
            {t("coach.workoutPlans.drawers.meta.description")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>{t("coach.workoutPlans.drawers.meta.nameLabel")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("coach.workoutPlans.drawers.meta.namePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("coach.workoutPlans.drawers.meta.descLabel")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("coach.workoutPlans.drawers.meta.descPlaceholder")}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
        <DrawerFooter className="px-6 py-4 flex flex-col gap-2">
          <Button onClick={onPrimaryAction} className="w-full">
            {mode === "create"
              ? t("coach.workoutPlans.drawers.meta.createAction")
              : t("coach.workoutPlans.drawers.meta.saveEditAction")}
          </Button>
          {mode === "edit" && onSecondaryAction && (
            <Button variant="secondary" onClick={onSecondaryAction} className="w-full">
              {t("coach.workoutPlans.drawers.meta.saveOnlyAction")}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default WorkoutPlanMetaDrawer;
