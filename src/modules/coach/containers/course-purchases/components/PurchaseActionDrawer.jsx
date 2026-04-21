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

const ACTION_META = {
  approve: {
    title: "Purchase approve qilish",
    description:
      "Access muddatini belgilang va kerak bo'lsa coach note qoldiring.",
    button: "Approve",
  },
  reject: {
    title: "Purchase reject qilish",
    description: "Reject sababini yozing. Bu note audit va review oqimiga tushadi.",
    button: "Reject",
  },
  extend: {
    title: "Access muddatini uzaytirish",
    description: "Faol access uchun qo'shimcha kun belgilang.",
    button: "Uzaytirish",
  },
  revoke: {
    title: "Accessni bekor qilish",
    description: "Telegram group access revoke qilinadi va purchase cancelled bo'ladi.",
    button: "Revoke access",
  },
};

const resolveUserLabel = (purchase) =>
  purchase?.user?.name ||
  purchase?.telegramUser?.firstName ||
  purchase?.telegramUser?.username ||
  "Noma'lum foydalanuvchi";

const PurchaseActionDrawer = ({
  open,
  mode,
  purchase,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const [extendDays, setExtendDays] = React.useState("");
  const [days, setDays] = React.useState("");
  const [reviewNote, setReviewNote] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setExtendDays(
      mode === "approve" && purchase?.course?.accessDurationDays
        ? String(purchase.course.accessDurationDays)
        : "",
    );
    setDays("");
    setReviewNote(purchase?.reviewNote || "");
    setReason("");
  }, [mode, open, purchase]);

  if (!mode || !purchase) {
    return null;
  }

  const meta = ACTION_META[mode];
  const latestReceipt = purchase.receipts?.[0] || null;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mode === "approve") {
      const parsed = Number(extendDays);
      onSubmit({
        extendDays: Number.isInteger(parsed) && parsed > 0 ? parsed : undefined,
        reviewNote: reviewNote.trim() || undefined,
      });
      return;
    }

    if (mode === "reject") {
      if (!reviewNote.trim()) {
        return;
      }

      onSubmit({
        reviewNote: reviewNote.trim(),
      });
      return;
    }

    if (mode === "extend") {
      const parsed = Number(days);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        return;
      }

      onSubmit({
        days: parsed,
        reviewNote: reviewNote.trim() || undefined,
      });
      return;
    }

    onSubmit({
      reason: reason.trim() || undefined,
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>{meta.title}</DrawerTitle>
          <DrawerDescription>{meta.description}</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{purchase.status}</Badge>
                <Badge variant="outline">{purchase.course?.title || "Kurs"}</Badge>
              </div>
              <h3 className="mt-3 text-base font-semibold">
                {resolveUserLabel(purchase)}
              </h3>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <span>
                  So&apos;rov:{" "}
                  {purchase.requestedAt
                    ? new Date(purchase.requestedAt).toLocaleString("uz-UZ")
                    : "—"}
                </span>
                <span>
                  Access:{" "}
                  {purchase.accessEndsAt
                    ? new Date(purchase.accessEndsAt).toLocaleDateString("uz-UZ")
                    : "—"}
                </span>
              </div>
              {latestReceipt ? (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                  <img
                    src={latestReceipt.imageUrl}
                    alt="Receipt"
                    className="size-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">So&apos;nggi receipt</p>
                    <p className="text-muted-foreground">
                      {latestReceipt.note || latestReceipt.fileName || "Telegram receipt"}
                    </p>
                    <a
                      href={latestReceipt.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-primary underline-offset-4 hover:underline"
                    >
                      Receiptni ochish
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            {mode === "approve" ? (
              <div className="space-y-2">
                <Label htmlFor="approve-extend-days">Access muddati (kun)</Label>
                <Input
                  id="approve-extend-days"
                  type="number"
                  min="1"
                  max="3650"
                  value={extendDays}
                  onChange={(event) => setExtendDays(event.target.value)}
                  placeholder="Bo'sh qoldirilsa kurs default muddati ishlatiladi"
                />
                <p className="text-xs text-muted-foreground">
                  Qiymat berilsa approve paytida course default muddatini override qiladi.
                </p>
              </div>
            ) : null}

            {mode === "extend" ? (
              <div className="space-y-2">
                <Label htmlFor="extend-days">Qo&apos;shimcha kunlar</Label>
                <Input
                  id="extend-days"
                  type="number"
                  min="1"
                  max="3650"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  placeholder="Masalan: 30"
                />
              </div>
            ) : null}

            {mode === "revoke" ? (
              <div className="space-y-2">
                <Label htmlFor="revoke-reason">Sabab</Label>
                <Textarea
                  id="revoke-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ixtiyoriy sabab"
                  className="min-h-24"
                />
              </div>
            ) : null}

            {mode !== "revoke" ? (
              <div className="space-y-2">
                <Label htmlFor="purchase-review-note">
                  {mode === "reject" ? "Reject note" : "Coach note"}
                </Label>
                <Textarea
                  id="purchase-review-note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder={
                    mode === "reject"
                      ? "Reject sababini yozing"
                      : "Ixtiyoriy coach note"
                  }
                  className="min-h-28"
                />
                {mode === "reject" ? (
                  <p className="text-xs text-muted-foreground">
                    Reject uchun note majburiy.
                  </p>
                ) : null}
              </div>
            ) : null}
          </DrawerBody>

          <DrawerFooter>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (mode === "reject" && !reviewNote.trim()) ||
                (mode === "extend" &&
                  (!Number.isInteger(Number(days)) || Number(days) <= 0))
              }
            >
              {meta.button}
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

export default PurchaseActionDrawer;
