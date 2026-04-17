import React from "react";
import { find, values } from "lodash";
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

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = translations[language];
    if (typeof direct === "string" && direct.trim()) {
      return direct.trim();
    }

    const uz = translations.uz;
    if (typeof uz === "string" && uz.trim()) {
      return uz.trim();
    }

    const first = find(
      values(translations),
      (value) => typeof value === "string" && value.trim(),
    );
    if (typeof first === "string" && first.trim()) {
      return first.trim();
    }
  }

  return fallback;
};

export const DeleteAlert = ({
  category,
  open,
  onOpenChange,
  onConfirm,
  currentLanguage,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kategoriyani o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            {category
              ? `"${resolveLabel(
                  category.translations,
                  category.name,
                  currentLanguage,
                )}" kategoriyasini o'chirmoqchimisiz?`
              : "Bu kategoriyani o'chirmoqchimisiz?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            O'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
