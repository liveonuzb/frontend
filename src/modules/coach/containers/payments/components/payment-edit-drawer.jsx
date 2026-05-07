import React from "react";
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
  PaymentMethodPicker,
  PaymentSafetyNotice,
  ReceiptPreview,
} from "./payment-form-controls";
import { formatMoney, toPositiveAmount } from "./payment-form-utils";

const PaymentEditDrawer = ({
  editingPayment,
  onClose,
  editAmount,
  setEditAmount,
  editNote,
  setEditNote,
  editMethod,
  setEditMethod,
  editReceiptUrl,
  onClearReceipt,
  isEditUploading,
  onUpdatePayment,
  isUpdatingClientPayment,
  onFileUpload,
  onCancelFromEdit,
  amountRisk,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const amount = toPositiveAmount(editAmount);
  const isSubmitDisabled = isUpdatingClientPayment || amount <= 0;

  const handleSubmit = () => {
    if (amountRisk?.requiresConfirmation) {
      setIsConfirmOpen(true);
      return;
    }

    onUpdatePayment();
  };

  return (
    <Drawer
      open={Boolean(editingPayment)}
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>To&apos;lovni tahrirlash</DrawerTitle>
          <DrawerDescription>
            {editingPayment?.client?.name} tomonidan qilingan to&apos;lov
            ma&apos;lumotlarini o&apos;zgartirish.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <div className="space-y-6">
            <PaymentMethodPicker value={editMethod} onChange={setEditMethod} />

            <CurrencyAmountField
              id="edit-payment-amount"
              label="Summa"
              value={editAmount}
              onChange={setEditAmount}
              description={`Oldingi summa: ${formatMoney(editingPayment?.amount)}`}
            />
          </div>

          <PaymentSafetyNotice risk={amountRisk} />

          <div className="space-y-3">
            <Label
              htmlFor="edit-note"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Izoh
            </Label>
            <Textarea
              id="edit-note"
              value={editNote}
              onChange={(event) => setEditNote(event.target.value)}
              placeholder="Izoh yozing..."
              className="bg-card border-border/50 focus:ring-primary/20 min-h-[100px] resize-none"
            />
          </div>

          <ReceiptPreview
            receiptUrl={editReceiptUrl}
            onClearReceipt={onClearReceipt}
            isUploading={isEditUploading}
            onFileUpload={(event) => onFileUpload(event, true)}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            size="lg"
          >
            {isUpdatingClientPayment
              ? "Saqlanmoqda..."
              : "O'zgarishlarni saqlash"}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={onCancelFromEdit}
          >
            To&apos;lovni o&apos;chirish
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Orqaga
          </Button>
        </DrawerFooter>
      </DrawerContent>
      <PaymentConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={amountRisk?.title || "O'zgarishni tasdiqlash"}
        description={
          amountRisk?.description ||
          "To'lov summasi keskin o'zgargan. Ma'lumotlarni tekshirib tasdiqlang."
        }
        confirmLabel="Baribir saqlash"
        onConfirm={() => {
          setIsConfirmOpen(false);
          onUpdatePayment();
        }}
        isSubmitting={isUpdatingClientPayment}
      />
    </Drawer>
  );
};

export default PaymentEditDrawer;
