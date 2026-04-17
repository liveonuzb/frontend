import {
  get,
  isNil,
  map,
  toNumber,
  toString,
} from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  NumberField, 
  NumberFieldGroup, 
  NumberFieldDecrement, 
  NumberFieldInput, 
  NumberFieldIncrement 
} from "@/components/reui/number-field";
import { getPaymentDayOptions } from "../../utils";

export const MarkPaymentDrawer = ({ 
  client, 
  amount, 
  setAmount, 
  paidAt, 
  setPaidAt, 
  note, 
  setNote, 
  onSave, 
  onClose, 
  isSubmitting 
}) => {
  const { t } = useTranslation();
  return (
    <Drawer open={!isNil(client)} onOpenChange={(open) => !open && onClose()} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t("coach.clients.drawers.markPayment.title")}</DrawerTitle>
          <DrawerDescription>
            {t("coach.clients.drawers.markPayment.description", { name: get(client, "name") })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label>{t("coach.clients.drawers.markPayment.amountLabel")}</Label>
            <NumberField
              minValue={0}
              step={10000}
              value={amount !== "" ? toNumber(amount) : undefined}
              onValueChange={(val) =>
                setAmount(val !== undefined ? toString(Math.round(val)) : "")
              }
            >
              <NumberFieldGroup className="h-11 rounded-2xl bg-card">
                <NumberFieldDecrement className="rounded-s-2xl px-3" />
                <NumberFieldInput className="px-3 text-sm" placeholder={t("coach.clients.drawers.markPayment.amountPlaceholder")} />
                <NumberFieldIncrement className="rounded-e-2xl px-3" />
              </NumberFieldGroup>
            </NumberField>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-client-payment-date">{t("coach.clients.drawers.markPayment.dateLabel")}</Label>
            <Input 
              id="coach-client-payment-date" 
              type="date" 
              value={paidAt} 
              onChange={(e) => setPaidAt(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-client-payment-note">{t("coach.clients.drawers.markPayment.noteLabel")}</Label>
            <Textarea 
              id="coach-client-payment-note" 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder={t("coach.clients.drawers.markPayment.notePlaceholder")} 
            />
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? t("coach.clients.drawers.markPayment.submitting") : t("coach.clients.drawers.markPayment.submit")}
          </Button>
          <Button variant="outline" onClick={onClose}>{t("coach.clients.drawers.markPayment.cancel")}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const PaymentDayDrawer = ({ 
  client, 
  day, 
  setDay, 
  billingCycle = "MONTHLY",
  setBillingCycle,
  onSave, 
  onClose, 
  isSubmitting 
}) => {
  const { t } = useTranslation();
  const paymentDayOptions =
    billingCycle === "WEEKLY"
      ? [
          { value: "1", label: t("common.weekdays.monday") },
          { value: "2", label: t("common.weekdays.tuesday") },
          { value: "3", label: t("common.weekdays.wednesday") },
          { value: "4", label: t("common.weekdays.thursday") },
          { value: "5", label: t("common.weekdays.friday") },
          { value: "6", label: t("common.weekdays.saturday") },
          { value: "7", label: t("common.weekdays.sunday") },
        ]
      : getPaymentDayOptions(t);
  return (
    <Drawer open={!isNil(client)} onOpenChange={(open) => !open && onClose()} direction="bottom">
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t("coach.clients.drawers.paymentDay.title")}</DrawerTitle>
          <DrawerDescription>
            {t("coach.clients.drawers.paymentDay.description", { name: get(client, "name") })}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="space-y-2">
            <Label>{t("coach.clients.drawers.paymentDay.billingCycle", { defaultValue: "Billing cycle" })}</Label>
            <Select
              value={billingCycle}
              onValueChange={(val) => {
                setBillingCycle?.(val);
                setDay("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-client-payment-day-update">{t("coach.clients.drawers.paymentDay.label")}</Label>
            <Select value={day || "none"} onValueChange={(val) => setDay(val === "none" ? "" : val)}>
              <SelectTrigger id="coach-client-payment-day-update" className="w-full">
                <SelectValue placeholder={t("coach.clients.drawers.paymentDay.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("coach.clients.drawers.paymentDay.placeholder")}</SelectItem>
                {map(paymentDayOptions, (o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? t("coach.clients.drawers.paymentDay.submitting") : t("coach.clients.drawers.paymentDay.submit")}
          </Button>
          <Button variant="outline" onClick={onClose}>{t("coach.clients.drawers.paymentDay.cancel")}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const CancelPaymentDialog = ({ 
  target, 
  onConfirm, 
  onClose, 
  isSubmitting 
}) => {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={!isNil(target)}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("coach.clients.drawers.cancelPayment.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("coach.clients.drawers.cancelPayment.description", { name: get(target, "clientName") })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>{t("coach.clients.drawers.cancelPayment.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? t("coach.clients.drawers.cancelPayment.submitting") : t("coach.clients.drawers.cancelPayment.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
