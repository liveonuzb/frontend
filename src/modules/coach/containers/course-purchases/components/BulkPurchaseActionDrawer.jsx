import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BulkPurchaseActionDrawer = ({
  open,
  mode,
  selectedCount = 0,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const [extendDays, setExtendDays] = React.useState("");
  const [reviewNote, setReviewNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setExtendDays("");
      setReviewNote("");
    }
  }, [mode, open]);

  if (!mode) {
    return null;
  }

  const isApprove = mode === "approve";

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isApprove) {
      const parsed = Number(extendDays);
      onSubmit({
        extendDays: Number.isInteger(parsed) && parsed > 0 ? parsed : undefined,
      });
      return;
    }

    if (!reviewNote.trim()) {
      return;
    }

    onSubmit({
      reviewNote: reviewNote.trim(),
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>
            {isApprove ? "Bulk approve" : "Bulk reject"}
          </DrawerTitle>
          <DrawerDescription>
            Tanlangan purchase&apos;lar uchun bir xil action ishlatiladi.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
              <Badge variant="secondary">{selectedCount} ta tanlandi</Badge>
              <p className="mt-3 text-sm text-muted-foreground">
                Faqat joriy filtrdagi tanlangan purchase&apos;lar batch oqimiga tushadi.
              </p>
            </div>

            {isApprove ? (
              <div className="space-y-2">
                <Label htmlFor="bulk-extend-days">Access muddati (kun)</Label>
                <Input
                  id="bulk-extend-days"
                  type="number"
                  min="1"
                  max="3650"
                  value={extendDays}
                  onChange={(event) => setExtendDays(event.target.value)}
                  placeholder="Bo'sh qoldirilsa course default ishlatiladi"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="bulk-review-note">Reject note</Label>
                <Textarea
                  id="bulk-review-note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Masalan: receipt noto'g'ri yoki to'liq emas"
                  className="min-h-28"
                />
              </div>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button
              type="submit"
              disabled={isSubmitting || (!isApprove && !reviewNote.trim())}
            >
              {isApprove ? "Tanlanganlarni approve qilish" : "Tanlanganlarni reject qilish"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default BulkPurchaseActionDrawer;
