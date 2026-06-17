import React from "react";
import flatMap from "lodash/flatMap";
import get from "lodash/get";
import map from "lodash/map";
import slice from "lodash/slice";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const severityClass = {
  fail: "border-destructive/25 bg-destructive/10 text-destructive",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
};

const IngredientImportPreviewDialog = ({
  open,
  onOpenChange,
  preview,
  isStarting,
  onStartImport,
}) => {
  const invalidCount = get(preview, "invalidCount", 0);
  const warningCount = get(preview, "quality.warnCount", 0);
  const groups = get(preview, "quality.groups", []);
  const allIssues = flatMap(groups, (group) => get(group, "issues", []));
  const visibleIssues = slice(allIssues, 0, 20);
  const canStart = Boolean(preview) && invalidCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ingredient Excel import preview</DialogTitle>
          <DialogDescription>
            {get(preview, "totalRows", 0)} ta qator Ingredients va
            RegionalPrices sheetlaridan tekshirildi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">Valid</div>
            <div className="text-lg font-semibold">
              {get(preview, "validCount", 0)}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">Xato</div>
            <div className="text-lg font-semibold text-destructive">
              {invalidCount}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">Warning</div>
            <div className="text-lg font-semibold text-amber-700">
              {warningCount}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              {invalidCount ? (
                <AlertTriangleIcon className="size-4 text-destructive" />
              ) : (
                <CheckCircle2Icon className="size-4 text-emerald-600" />
              )}
              {invalidCount ? "Bloklandi" : "Tayyor"}
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[46vh] pr-3">
          <div className="space-y-3">
            {map(groups, (group) => (
              <div key={group.key} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-medium">{group.title}</div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 px-1.5 text-[10px]",
                      severityClass[group.severity],
                    )}
                  >
                    {group.issueCount}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {map(group.examples, (issue) => (
                    <div
                      key={issue.id}
                      className="grid gap-1 rounded-md bg-muted/40 px-2 py-1.5 text-xs sm:grid-cols-[112px_1fr]"
                    >
                      <span className="font-medium">
                        {issue.sheet ? `${issue.sheet} ` : ""}Row{" "}
                        {issue.lineNumber}
                      </span>
                      <span className="text-muted-foreground">
                        {issue.error || issue.issue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!groups.length ? (
              <div className="rounded-lg border px-3 py-6 text-center text-sm text-muted-foreground">
                Xato yoki warning topilmadi.
              </div>
            ) : null}
            {allIssues.length > visibleIssues.length ? (
              <div className="text-xs text-muted-foreground">
                Faqat dastlabki 20 ta issue ko'rsatildi.
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={onStartImport} disabled={!canStart || isStarting}>
            {isStarting ? "Boshlanmoqda..." : "Import jobni boshlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IngredientImportPreviewDialog;
