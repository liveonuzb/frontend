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

export const SoftDeleteAlert = ({ payment, open, onOpenChange, onConfirm, isDeleting }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>To'lovni trashga yuborish</AlertDialogTitle>
        <AlertDialogDescription>
          {payment
            ? `Bu to'lov trashga yuboriladi va keyin tiklash mumkin bo'ladi.`
            : ""}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isDeleting}>Bekor qilish</AlertDialogCancel>
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
            ? `Bu to'lov butunlay o'chiriladi va qayta tiklab bo'lmaydi.`
            : `${get(target, "ids.length", 0)} ta to'lov butunlay o'chiriladi va qayta tiklab bo'lmaydi.`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isDeleting}>Bekor qilish</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Butunlay o&apos;chirish
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
