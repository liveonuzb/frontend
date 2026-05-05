import React from "react";
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

export const AdminConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "Bekor qilish",
  confirmText = "Tasdiqlash",
  variant = "default",
  isPending = false,
  onConfirm,
  contentClassName,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent
      className={cn(
        "rounded-[24px] border-border/70 bg-card/95 backdrop-blur-xl",
        contentClassName,
      )}
    >
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelText}</AlertDialogCancel>
        <AlertDialogAction
          variant={variant === "destructive" ? "destructive" : undefined}
          onClick={onConfirm}
          disabled={isPending}
        >
          {confirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
