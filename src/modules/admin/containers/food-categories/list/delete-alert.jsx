import React from "react";
import TaxonomyDeleteImpactAlert from "@/modules/admin/components/taxonomy-delete-impact-alert.jsx";

export const DeleteAlert = ({ category, open, onOpenChange, onConfirm, resolveLabel, currentLanguage }) => {
  const name = category
    ? resolveLabel(category.translations, category.name, currentLanguage)
    : "";

  return (
    <TaxonomyDeleteImpactAlert
      item={category}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      impactUrl={
        category
          ? `/admin/nutrition/food-categories/${category.id}/deletion-impact`
          : null
      }
      title="Kategoriyani o'chirish"
      description={
        category
          ? `"${name}" kategoriyasini o'chirmoqchimisiz?`
          : "Bu kategoriyani o'chirmoqchimisiz?"
      }
    />
  );
};
