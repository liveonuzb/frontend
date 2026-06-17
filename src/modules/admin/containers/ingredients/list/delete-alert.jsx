import React from "react";
import filter from "lodash/filter";
import get from "lodash/get";
import map from "lodash/map";
import toPairs from "lodash/toPairs";
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

const IngredientDependencyImpactSummary = ({ impact, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Impact hisoblanmoqda...
      </div>
    );
  }

  if (!impact) return null;

  const dependencyRows = filter(
    toPairs(get(impact, "dependencies", {})),
    ([, count]) => Number(count) > 0,
  );

  return (
    <div className="mt-3 space-y-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
      <div className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-3">
        <span>Jami: {get(impact, "totalIngredients", 0)}</span>
        <span>Active: {get(impact, "activeCount", 0)}</span>
        <span>Trash: {get(impact, "trashedCount", 0)}</span>
      </div>
      {dependencyRows.length ? (
        <div className="space-y-1">
          {map(dependencyRows, ([key, count]) => (
            <div key={key} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Direct dependency topilmadi.</p>
      )}
    </div>
  );
};

const IngredientDeleteAlert = ({
  ingredient,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  impact,
  isLoadingImpact,
}) => {
  const isConfirmDisabled = isDeleting || isLoadingImpact;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ingredientni trashga yuborish</AlertDialogTitle>
          <AlertDialogDescription>
            {ingredient
              ? `"${ingredient.name}" trashga yuboriladi. Recipe, pantry yoki shopping list dependency bo'lsa bloklanadi.`
              : ""}
          </AlertDialogDescription>
          <IngredientDependencyImpactSummary
            impact={impact}
            isLoading={isLoadingImpact}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConfirmDisabled}>
            Trashga yuborish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IngredientDeleteAlert;
