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

export const SoftDeleteAlert = ({ notification, open, onOpenChange, onConfirm, isDeleting }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Bildirishnomani trashga yuborish</AlertDialogTitle>
        <AlertDialogDescription>
          {notification
            ? `"${get(notification, "title", "Bildirishnoma")}" trashga yuboriladi va keyin tiklash mumkin bo'ladi.`
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
            ? `"${get(target, "label", "Bildirishnoma")}" butunlay o'chiriladi va qayta tiklab bo'lmaydi.`
            : `${get(target, "ids.length", 0)} ta bildirishnoma butunlay o'chiriladi va qayta tiklab bo'lmaydi.`}
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
