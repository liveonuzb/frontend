import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const DeleteAlert = ({
  workout,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("admin.workouts.delete.moveToTrashTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {workout
              ? t("admin.workouts.delete.moveToTrashDescription", {
                  name: workout.name,
                })
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {t("admin.workouts.delete.moveToTrashAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const HardDeleteAlert = ({
  target,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("admin.workouts.delete.hardDeleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {target?.ids?.length === 1
              ? t("admin.workouts.delete.hardDeleteSingleDescription", {
                  name: target?.label ?? t("admin.workouts.delete.workoutFallback"),
                })
              : t("admin.workouts.delete.hardDeleteManyDescription", {
                  count: target?.ids?.length ?? 0,
                })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {t("admin.workouts.delete.hardDeleteAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
