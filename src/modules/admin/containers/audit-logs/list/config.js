export const ITEMS_PER_PAGE = 10;

export const AUDIT_LOG_SORT_FIELDS = [
  "createdAt",
  "action",
  "entityType",
  "adminUser",
];

export const AUDIT_LOG_SORT_DIRECTIONS = ["asc", "desc"];

export const auditActionLabels = {
  user_created: "User yaratildi",
  user_updated: "User yangilandi",
  user_deleted: "User o'chirildi",
  user_session_revoked: "User sessiyasi bekor qilindi",
  user_note_created: "User note yaratildi",
  user_note_updated: "User note yangilandi",
  user_note_deleted: "User note o'chirildi",
  premium_gifted: "Premium sovg'a qilindi",
  subscription_cancelled: "Obuna bekor qilindi",
  subscription_extended: "Obuna uzaytirildi",
  coach_status_updated: "Coach holati yangilandi",
  food_created: "Ovqat yaratildi",
  food_updated: "Ovqat yangilandi",
  food_deleted: "Ovqat trashga yuborildi",
  food_restored: "Ovqat tiklandi",
  food_verification_updated: "Ovqat tasdiqlanishi yangilandi",
  food_category_created: "Kategoriya yaratildi",
  food_category_updated: "Kategoriya yangilandi",
  food_category_deleted: "Kategoriya o'chirildi",
  language_created: "Til yaratildi",
  language_updated: "Til yangilandi",
  language_deleted: "Til o'chirildi",
  expense_created: "Xarajat yaratildi",
  expense_updated: "Xarajat yangilandi",
  expense_deleted: "Xarajat o'chirildi",
};

export const auditEntityLabels = {
  user: "User",
  coach: "Coach",
  subscription: "Obuna",
  language: "Til",
  food_category: "Kategoriya",
  food: "Ovqat",
  expense: "Xarajat",
};
