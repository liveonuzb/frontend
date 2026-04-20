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

export const SoftDeleteAlert = ({ snippet, open, onOpenChange, onConfirm, isDeleting }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Shablonni trashga yuborish</AlertDialogTitle>
        <AlertDialogDescription>
          {snippet
            ? `"${snippet.title}" trashga yuboriladi va keyin tiklash mumkin bo'ladi.`
            : ""}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
          Trashga yuborish
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const HardDeleteAlert = ({ target, open, onOpenChange, onConfirm, isDeleting }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Butunlay o&apos;chirish</AlertDialogTitle>
        <AlertDialogDescription>
          {get(target, "ids.length") === 1
            ? `"${get(target, "label", "Shablon")}" butunlay o'chiriladi va qayta tiklab bo'lmaydi.`
            : `${get(target, "ids.length", 0)} ta shablon butunlay o'chiriladi va qayta tiklab bo'lmaydi.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
          Butunlay o&apos;chirish
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
