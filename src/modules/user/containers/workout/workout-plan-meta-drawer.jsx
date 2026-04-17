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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";

export default function WorkoutPlanMetaDrawer({
  open,
  mode = "create",
  name = "",
  description = "",
  isSubmitting = false,
  onNameChange,
  onDescriptionChange,
  onOpenChange,
  onSubmit,
}) {
  const { t } = useTranslation();
  const isEdit = mode === "edit";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="mx-auto max-w-lg rounded-t-[2.5rem]">
        <DrawerHeader className="px-6 py-5 text-left">
          <DrawerTitle>
            {isEdit
              ? t("components.workoutPlanBuilder.meta.editTitle")
              : t("components.workoutPlanBuilder.meta.createTitle")}
          </DrawerTitle>
          <DrawerDescription>
            {isEdit
              ? t("components.workoutPlanBuilder.meta.editDescription")
              : t("components.workoutPlanBuilder.meta.createDescription")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="user-workout-plan-name">
              {t("components.workoutPlanBuilder.meta.nameLabel")}
            </Label>
            <Input
              id="user-workout-plan-name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={t("components.workoutPlanBuilder.meta.namePlaceholder")}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-workout-plan-description">
              {t("components.workoutPlanBuilder.meta.descriptionLabel")}
            </Label>
            <Textarea
              id="user-workout-plan-description"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder={t(
                "components.workoutPlanBuilder.meta.descriptionPlaceholder",
              )}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DrawerFooter className="flex flex-col gap-2 px-6 py-4">
          <Button onClick={onSubmit} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
            ) : null}
            {t("components.workoutPlanBuilder.meta.continue")}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
            disabled={isSubmitting}
          >
            {t("components.workoutPlanBuilder.meta.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
