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

export const SoftDeleteAlert = ({ plan, open, onOpenChange, onConfirm, isDeleting }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Ovqatlanish rejasini trashga yuborish</AlertDialogTitle>
        <AlertDialogDescription>
          {plan
            ? `"${plan.title}" trashga yuboriladi va keyin tiklash mumkin bo'ladi.`
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
            ? `"${get(target, "label", "Ovqatlanish rejasi")}" butunlay o'chiriladi va qayta tiklab bo'lmaydi.`
            : `${get(target, "ids.length", 0)} ta ovqatlanish rejasi butunlay o'chiriladi va qayta tiklab bo'lmaydi.`}
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
