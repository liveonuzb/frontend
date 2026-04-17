import { get } from "lodash";
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

export const DeleteAlert = ({ client, open, onOpenChange, onConfirm, isDeleting }) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[28px] border-border/60 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("coach.clients.actions.deleteClient")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("coach.clients.deleteConfirm", {
              name: get(client, "name"),
              defaultValue: `Rostdan ham "${get(client, "name")}" mijozni o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-2xl">
            {t("common.cancel", { defaultValue: "Bekor qilish" })}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("common.delete", { defaultValue: "O'chirish" })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
