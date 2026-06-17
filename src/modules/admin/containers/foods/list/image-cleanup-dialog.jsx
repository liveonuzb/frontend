import React from "react";
import get from "lodash/get";
import lodashMap from "lodash/map";
import slice from "lodash/slice";
import toNumber from "lodash/toNumber";
import {
  ImageOffIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
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

const formatBytes = (value) => {
  const size = toNumber(value) || 0;

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatDateTime = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const FoodImageCleanupDialog = ({
  open,
  onOpenChange,
  preview,
  isLoading,
  isCleaning,
  onCleanup,
  onRefresh,
}) => {
  const candidates = get(preview, "candidates", []);
  const visibleCandidates = slice(candidates, 0, 20);
  const removable = get(preview, "removable", 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Food image cleanup preview</DialogTitle>
          <DialogDescription>
            Faqat foodga bog'lanmagan va cutoffdan eski rasm assetlari
            ko'rsatiladi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">Tekshirildi</div>
            <div className="text-lg font-semibold">
              {get(preview, "checked", 0)}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">Cleanup mumkin</div>
            <div className="text-lg font-semibold text-destructive">
              {removable}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <div className="text-xs text-muted-foreground">Cutoff</div>
            <div className="truncate text-sm font-medium">
              {formatDateTime(get(preview, "cutoff"))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-emerald-600" />
            Attached food rasmlari cleanupga kirmaydi.
          </div>
        </div>

        <ScrollArea className="max-h-[46vh] pr-3">
          <div className="space-y-2">
            {isLoading ? (
              <div className="rounded-lg border px-3 py-6 text-center text-sm text-muted-foreground">
                Preview yuklanmoqda...
              </div>
            ) : null}
            {!isLoading && !visibleCandidates.length ? (
              <div className="rounded-lg border px-3 py-6 text-center text-sm text-muted-foreground">
                Orphan rasm assetlari topilmadi.
              </div>
            ) : null}
            {lodashMap(visibleCandidates, (candidate) => {
              const imageUrl = get(candidate, "url");

              return (
                <div
                  key={get(candidate, "id")}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[56px_1fr_auto]"
                >
                  <div className="flex size-14 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ImageOffIcon className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {get(candidate, "originalName") ||
                        get(candidate, "objectKey")}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {get(candidate, "objectKey")}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="h-5 px-1.5">
                        {formatBytes(get(candidate, "size"))}
                      </Badge>
                      <Badge variant="outline" className="h-5 px-1.5">
                        {formatDateTime(get(candidate, "createdAt"))}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="h-6 border-destructive/25 bg-destructive/10 px-2 text-destructive"
                  >
                    Orphan
                  </Badge>
                </div>
              );
            })}
            {candidates.length > visibleCandidates.length ? (
              <div className="text-xs text-muted-foreground">
                Faqat dastlabki 20 ta asset ko'rsatildi.
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading || isCleaning}
            className="gap-1.5"
          >
            <RotateCcwIcon
              className={cn("size-4", isLoading && "animate-spin")}
            />
            Qayta tekshirish
          </Button>
          <Button
            variant="destructive"
            onClick={onCleanup}
            disabled={!removable || isCleaning}
            className="gap-1.5"
          >
            <Trash2Icon className="size-4" />
            {isCleaning ? "Tozalanmoqda..." : "Cleanup qilish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FoodImageCleanupDialog;
