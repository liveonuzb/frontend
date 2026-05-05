import React from "react";
import { get } from "lodash";
import { AdminConfirmDialog } from "@/modules/admin/components/admin-confirm-dialog.jsx";

export const DeleteAlert = ({
  item,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}) => {
  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Achievementni o'chirish"
      description={`Haqiqatan ham "${get(item, "name") || get(item, "key")}" achievementini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
      confirmText="O'chirish"
      variant="destructive"
      isPending={isDeleting}
      onConfirm={onConfirm}
    />
  );
};
