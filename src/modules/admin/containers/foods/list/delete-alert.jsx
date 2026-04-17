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

export const DeleteAlert = ({ food, open, onOpenChange, onConfirm, isDeleting }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ovqatni trashga yuborish</AlertDialogTitle>
          <AlertDialogDescription>
            {food
              ? `"${food.name}" trashga yuboriladi va keyin tiklash mumkin bo'ladi.`
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
};

export const HardDeleteAlert = ({ target, open, onOpenChange, onConfirm, isDeleting }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Butunlay o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            {get(target, "ids.length") === 1
              ? `"${get(target, "label", "Ovqat")}" butunlay o'chiriladi va qayta tiklab bo'lmaydi.`
              : `${get(target, "ids.length", 0)} ta ovqat butunlay o'chiriladi va qayta tiklab bo'lmaydi.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            Butunlay o'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
