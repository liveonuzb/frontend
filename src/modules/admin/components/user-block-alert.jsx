import React from "react";
import { get, trim } from "lodash";
import { AdminConfirmDialog } from "@/modules/admin/components/admin-confirm-dialog.jsx";

const getUserDisplayName = (user) =>
  trim(`${get(user, "firstName", "")} ${get(user, "lastName", "")}`) ||
  get(user, "displayName") ||
  get(user, "email") ||
  "Foydalanuvchi";

export const UserBlockAlert = ({
  user,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}) => {
  const isBlocked = get(user, "status") === "banned";
  const displayName = getUserDisplayName(user);

  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isBlocked
          ? "Foydalanuvchini blokdan chiqarish"
          : "Foydalanuvchini bloklash"
      }
      description={
        isBlocked
          ? `"${displayName}" foydalanuvchisini blokdan chiqarasizmi? Account yana platformadan foydalana oladi.`
          : `"${displayName}" foydalanuvchisini bloklaysizmi? Faol sessiyalar bekor qilinadi va account platformadan foydalana olmaydi.`
      }
      confirmText={isBlocked ? "Blokdan chiqarish" : "Bloklash"}
      variant={isBlocked ? "default" : "destructive"}
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
};
