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
  payment,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[28px] border-border/60 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("coach.payments.drawers.cancel.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("coach.payments.drawers.cancel.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-2xl" disabled={isPending}>
            {t("coach.mealPlans.deleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("coach.payments.drawers.cancel.submit", {
              defaultValue: "Bekor qilish",
            })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
