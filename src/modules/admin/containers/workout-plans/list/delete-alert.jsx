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
import { cn } from "@/lib/utils";

export const DeleteAlert = ({
  template,
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
            {t("admin.workoutPlans.delete.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {template
              ? t("admin.workoutPlans.delete.description", {
                  name: template.name,
                })
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              isDeleting && "pointer-events-none opacity-70",
            )}
            onClick={onConfirm}
          >
            {t("admin.common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
