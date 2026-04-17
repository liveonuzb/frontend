import React from "react";
import { get } from "lodash";
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

export const DeleteAlert = ({ user, open, onOpenChange, onConfirm }) => {
  const displayName =
    `${get(user, "firstName", "")} ${get(user, "lastName", "")}`.trim() ||
    "Nomsiz foydalanuvchi";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[28px] border-border/60 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            Rostdan ham &quot;{displayName}&quot; foydalanuvchisini o'chirib
            yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-2xl">
            Bekor qilish
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            O&apos;chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
