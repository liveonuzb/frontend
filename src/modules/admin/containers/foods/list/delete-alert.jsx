import React from "react";
import lodashFilter from "lodash/filter";
import get from "lodash/get";
import lodashMap from "lodash/map";
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

const DependencyImpactSummary = ({ impact, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Impact hisoblanmoqda...
      </div>
    );
  }

  if (!impact) return null;

  const dependencies = get(impact, "dependencies", {});
  const dependencyRows = lodashFilter(
    toPairs(dependencies),
    ([, count]) => Number(count) > 0,
  );
  const unavailableCounts = get(impact, "unavailableDependencyCounts", []);

  return (
    <div className="mt-3 space-y-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
      <div className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-4">
        <span>Jami: {get(impact, "totalFoods", 0)}</span>
        <span>Active: {get(impact, "activeCount", 0)}</span>
        <span>Trash: {get(impact, "trashedCount", 0)}</span>
        <span>Recipe: {get(impact, "recipeFoodCount", 0)}</span>
      </div>
      {dependencyRows.length ? (
        <div className="space-y-1">
          {lodashMap(dependencyRows, ([key, count]) => (
            <div key={key} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Direct dependency topilmadi.</p>
      )}
      {unavailableCounts.length ? (
        <p className="text-muted-foreground">
          Meal log, saved meal va template snapshotlari direct foodId bilan
          sanalmaydi.
        </p>
      ) : null}
    </div>
  );
};

export const DeleteAlert = ({
  food,
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
          <AlertDialogTitle>Ovqatni trashga yuborish</AlertDialogTitle>
          <AlertDialogDescription>
            {food
              ? `"${food.name}" trashga yuboriladi va keyin tiklash mumkin bo'ladi.`
              : ""}
          </AlertDialogDescription>
          <DependencyImpactSummary
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

export const HardDeleteAlert = ({
  target,
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
          <AlertDialogTitle>Butunlay o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            {get(target, "ids.length") === 1
              ? `"${get(target, "label", "Ovqat")}" butunlay o'chiriladi va qayta tiklab bo'lmaydi.`
              : `${get(target, "ids.length", 0)} ta ovqat butunlay o'chiriladi va qayta tiklab bo'lmaydi.`}
          </AlertDialogDescription>
          <DependencyImpactSummary
            impact={impact}
            isLoading={isLoadingImpact}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConfirmDisabled}>
            Butunlay o'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
