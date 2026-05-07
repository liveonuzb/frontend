import React from "react";
import { RotateCcwIcon } from "lucide-react";
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
import {
  CurrencyAmountField,
  PaymentConfirmDialog,
  PaymentSafetyNotice,
} from "./payment-form-controls";
import { buildAmountRisk, formatMoney, toPositiveAmount } from "./payment-form-utils";

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
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const paymentAmount = Number(refundingPayment?.amount || 0);
  const amount = toPositiveAmount(refundAmount);
  const amountRisk = buildAmountRisk({
    amount,
    expectedAmount: paymentAmount,
    type: "refund",
  });
  const isFullRefund = paymentAmount > 0 && amount >= paymentAmount;
  const risk = isFullRefund
    ? {
        severity: "warning",
        title: "To'liq refund",
        description: `${formatMoney(amount)} to'liq qaytariladi. Balans va payout holatini tekshiring.`,
        requiresConfirmation: true,
      }
    : amountRisk;
  const isSubmitDisabled =
    isRefundingClientPayment ||
    amount <= 0 ||
    (paymentAmount > 0 && amount > paymentAmount);

  const handleSubmit = () => {
    if (risk?.requiresConfirmation) {
      setIsConfirmOpen(true);
      return;
    }

    onRefundPayment();
  };

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
          <CurrencyAmountField
            id="refund-payment-amount"
            label="Qaytarish summasi"
            value={refundAmount}
            onChange={setRefundAmount}
            max={paymentAmount}
            description={`Maksimal summa: ${formatMoney(paymentAmount)}`}
          />

          <PaymentSafetyNotice risk={risk} />

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
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isRefundingClientPayment ? "Qaytarilmoqda..." : "Ha, qaytarish"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
      <PaymentConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={risk?.title || "Refundni tasdiqlash"}
        description={
          risk?.description ||
          "Refund summasini tekshirib, davom etishni tasdiqlang."
        }
        confirmLabel="Baribir qaytarish"
        onConfirm={() => {
          setIsConfirmOpen(false);
          onRefundPayment();
        }}
        isSubmitting={isRefundingClientPayment}
      />
    </Drawer>
  );
};

export default PaymentRefundDrawer;
