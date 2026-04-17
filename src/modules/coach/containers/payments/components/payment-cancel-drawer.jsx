import React from "react";
import { XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const formatMoney = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Kelishiladi";
  }
  return `${new Intl.NumberFormat("uz-UZ").format(normalized)} so'm`;
};

const PaymentCancelDrawer = ({
  cancellingPayment,
  onClose,
  cancellationReason,
  setCancellationReason,
  onCancelPayment,
  isCancellingClientPayment,
}) => {
  return (
    <Drawer
      open={Boolean(cancellingPayment)}
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-destructive flex items-center gap-2 font-bold">
            <XCircleIcon className="size-5" />
            To&apos;lovni bekor qilish
          </DrawerTitle>
          <DrawerDescription>
            Haqiqatan ham **{cancellingPayment?.client?.name}** tomonidan
            qilingan **{formatMoney(cancellingPayment?.amount)}**
            to&apos;lovni bekor qilmoqchimisiz?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <div className="space-y-3">
            <Label
              htmlFor="cancel-reason"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Bekor qilish sababi (ixtiyoriy)
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              placeholder="Masalan: Xato kiritilgan"
              className="rounded-2xl bg-card border-border/50 focus:ring-destructive/20 min-h-[100px] resize-none"
            />
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            variant="destructive"
            onClick={onCancelPayment}
            disabled={isCancellingClientPayment}
          >
            {isCancellingClientPayment
              ? "Bekor qilinmoqda..."
              : "Ha, bekor qilish"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Orqaga qaytish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PaymentCancelDrawer;
