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

export const DeleteAlert = ({ open, onOpenChange, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[28px] border-border/60 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("coach.workoutPlans.deleteDialog.title", {
              defaultValue: "Mashq rejasini o'chirish",
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("coach.workoutPlans.deleteDialog.description", {
              defaultValue:
                "Rostdan ham bu mashq rejasini o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-2xl">
            {t("coach.mealPlans.deleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("coach.mealPlans.deleteDialog.confirm", {
              defaultValue: "O'chirish",
            })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
