import React from "react";
import { get } from "lodash";
import { LoaderCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import WorkoutPlanBuilder from "@/components/workout-plan-builder";
import WorkoutPlanMetaDrawer from "./workout-plan-meta-drawer.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function WorkoutPlanFormDrawer({
  open = true,
  mode = "create",
  view = "meta",
  initialPlan = null,
  isLoading = false,
  isError = false,
  isSaving = false,
  metaName = "",
  metaDescription = "",
  onRetry,
  onOpenChange,
  onMetaNameChange,
  onMetaDescriptionChange,
  onMetaSubmit,
  onBuilderSave,
  onBuilderBack,
}) {
  const { t } = useTranslation();
  const isEdit = mode === "edit";

  if (isLoading || isError) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>
              {isEdit
                ? t("components.workoutPlanBuilder.form.editTitle")
                : t("components.workoutPlanBuilder.form.createTitle")}
            </DrawerTitle>
            <DrawerDescription>
              {isLoading
                ? t("components.workoutPlanBuilder.form.loading")
                : t("components.workoutPlanBuilder.form.loadError")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {isLoading ? (
              <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground">
                <LoaderCircleIcon className="size-5 animate-spin" />
                {t("components.workoutPlanBuilder.form.loadingState")}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                {t("components.workoutPlanBuilder.form.notFound")}
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            {isError ? (
              <Button onClick={onRetry} disabled={isSaving}>
                {t("components.workoutPlanBuilder.form.retry")}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("components.workoutPlanBuilder.form.close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  if (view === "meta") {
    return (
      <WorkoutPlanMetaDrawer
        open={open}
        mode={mode}
        name={metaName}
        description={metaDescription}
        isSubmitting={isSaving}
        onNameChange={onMetaNameChange}
        onDescriptionChange={onMetaDescriptionChange}
        onOpenChange={onOpenChange}
        onSubmit={onMetaSubmit}
      />
    );
  }

  const handleBuilderBack = () => {
    if (onBuilderBack) {
      onBuilderBack();
      return;
    }

    onOpenChange(false);
  };

  return (
    <WorkoutPlanBuilder
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleBuilderBack();
        }
      }}
      initialPlan={initialPlan}
      onSave={onBuilderSave}
      onClose={handleBuilderBack}
      isSaving={isSaving}
      lockWeekDays
      submitLabel={
        isSaving
          ? t("components.workoutPlanBuilder.form.saving")
          : isEdit
            ? t("components.workoutPlanBuilder.form.saveAction")
            : t("components.workoutPlanBuilder.form.createAction")
      }
      title={
        get(initialPlan, "name") ||
        (isEdit
          ? t("components.workoutPlanBuilder.form.editTitle")
          : t("components.workoutPlanBuilder.form.createTitle"))
      }
      description={
        isEdit
          ? t("components.workoutPlanBuilder.form.editDescription")
          : t("components.workoutPlanBuilder.form.createDescription")
      }
    />
  );
}
