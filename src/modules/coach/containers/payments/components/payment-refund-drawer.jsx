import React from "react";
import { RotateCcwIcon } from "lucide-react";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
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

const PaymentRefundDrawer = ({
  refundingPayment,
  onClose,
  refundReason,
  setRefundReason,
  refundAmount,
  setRefundAmount,
  onRefundPayment,
  isRefundingClientPayment,
}) => {
  return (
    <Drawer
      open={Boolean(refundingPayment)}
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-orange-600 flex items-center gap-2 font-bold">
            <RotateCcwIcon className="size-5" />
            To&apos;lovni qaytarish
          </DrawerTitle>
          <DrawerDescription>
            **{refundingPayment?.client?.name}** tomonidan qilingan **
            {formatMoney(refundingPayment?.amount)}** to&apos;lovni qaytarib
            bermoqchimisiz?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Summa (so&apos;mda)
            </Label>
            <NumberField
              value={refundAmount ? Number(refundAmount) : undefined}
              min={0}
              max={Number(refundingPayment?.amount || 0)}
              step={10000}
              onValueChange={(value) =>
                setRefundAmount(
                  value === null || Number.isNaN(value) ? "" : String(value),
                )
              }
            >
              <NumberFieldGroup>
                <NumberFieldDecrement />
                <NumberFieldInput
                  placeholder="Qaytarish summasi"
                  className="h-11"
                />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
            <p className="text-[10px] text-muted-foreground ml-1 italic">
              Maksimal summa: {formatMoney(refundingPayment?.amount)}
            </p>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="refund-reason"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1"
            >
              Qaytarish sababi (ixtiyoriy)
            </Label>
            <Textarea
              id="refund-reason"
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="Masalan: Mijoz voz kechdi"
              className="rounded-2xl bg-card border-border/50 focus:ring-orange-500/20 min-h-[100px] resize-none"
            />
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={onRefundPayment}
            disabled={isRefundingClientPayment}
          >
            {isRefundingClientPayment ? "Qaytarilmoqda..." : "Ha, qaytarish"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PaymentRefundDrawer;
