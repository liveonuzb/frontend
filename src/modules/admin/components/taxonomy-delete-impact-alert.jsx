import React from "react";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import toPairs from "lodash/toPairs";
import lodashFilter from "lodash/filter";
import { LoaderCircleIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useGetQuery } from "@/hooks/api";

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", null));

const dependencyLabelMap = {
  foods: "Foods",
  recipes: "Recipes",
  templates: "Templates",
  onboarding: "Onboarding",
};

const TaxonomyDeleteImpactAlert = ({
  item,
  open,
  onOpenChange,
  onConfirm,
  impactUrl,
  title,
  description,
  confirmLabel = "O'chirish",
  isDeleting = false,
}) => {
  const impactQuery = useGetQuery({
    url: impactUrl || "/admin/nutrition/taxonomy/governance",
    queryProps: {
      queryKey: ["admin", "taxonomy-delete-impact", impactUrl],
      enabled: Boolean(open && impactUrl),
    },
  });
  const impact = getResponsePayload(impactQuery.data);
  const dependencies = get(impact, "dependencies", {});
  const dependencyEntries = lodashFilter(
    toPairs(dependencies),
    ([, value]) => typeof value === "number" && value > 0,
  );
  const unavailable = get(impact, "unavailableDependencyCounts", []);
  const hasBlockingDependencies = Boolean(
    get(impact, "hasBlockingDependencies"),
  );
  const isConfirmDisabled =
    isDeleting || impactQuery.isLoading || hasBlockingDependencies;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {impactQuery.isLoading ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Impact count yuklanmoqda...
          </div>
        ) : null}

        {impact ? (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-2">
              {size(dependencyEntries) ? (
                map(dependencyEntries, ([key, value]) => (
                  <Badge key={key} variant="outline">
                    {dependencyLabelMap[key] || key}: {value}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Blocking dependency yo'q</Badge>
              )}
            </div>
            {hasBlockingDependencies ? (
              <p className="text-destructive">
                Bu item ishlatilmoqda. O'chirish o'rniga nofaol qiling.
              </p>
            ) : null}
            {size(unavailable) ? (
              <div className="text-xs text-muted-foreground">
                {map(unavailable, (entry) => (
                  <p key={get(entry, "key")}>
                    {get(entry, "label")}: {get(entry, "reason")}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => void onConfirm(item)}
            disabled={isConfirmDisabled}
          >
            {isDeleting ? <LoaderCircleIcon className="animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TaxonomyDeleteImpactAlert;
