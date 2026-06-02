import React from "react";
import get from "lodash/get";
import trim from "lodash/trim";
import { AdminConfirmDialog } from "@/modules/admin/components/admin-confirm-dialog.jsx";

export const DeleteAlert = ({ user, open, onOpenChange, onConfirm }) => {
  const displayName =
    trim(`${get(user, "firstName", "")} ${get(user, "lastName", "")}`) ||
    "Nomsiz foydalanuvchi";

  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Foydalanuvchini o'chirish"
      description={`Rostdan ham "${displayName}" foydalanuvchisini o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
      confirmText="O'chirish"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
};
