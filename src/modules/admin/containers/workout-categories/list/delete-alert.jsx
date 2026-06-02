import React from "react";
import find from "lodash/find";
import lodashValues from "lodash/values";
import trim from "lodash/trim";
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
    if (typeof direct === "string" && trim(direct)) {
      return trim(direct);
    }

    const uz = translations.uz;
    if (typeof uz === "string" && trim(uz)) {
      return trim(uz);
    }

    const first = find(
      lodashValues(translations),
      (value) => typeof value === "string" && trim(value),
    );
    if (typeof first === "string" && trim(first)) {
      return trim(first);
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



