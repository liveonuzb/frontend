import React from "react";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  SearchIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CurrencyAmountField,
  PaymentConfirmDialog,
  PaymentMethodPicker,
  PaymentSafetyNotice,
  ReceiptPreview,
} from "./payment-form-controls";
import {
  formatDate,
  formatDuePeriod,
  formatMoney,
  getDueRemainingAmount,
  toPositiveAmount,
} from "./payment-form-utils";

const getInitials = (value = "") =>
  String(value)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const PaymentAddDrawer = ({
  open,
  onOpenChange,
  filteredAddClients,
  isClientsLoading,
  selectedClientId,
  setSelectedClientId,
  paymentAmount,
  setPaymentAmount,
  paymentNote,
  setPaymentNote,
  paymentMethod,
  setPaymentMethod,
  receiptUrl,
  onClearReceipt,
  isUploading,
  selectedClient,
  paymentDues = [],
  selectedPaymentDueId,
  setSelectedPaymentDueId,
  isPaymentDuesLoading,
  duplicatePaymentWarning,
  amountRisk,
  addPaymentSearch,
  setAddPaymentSearch,
  onMarkPaid,
  isMarkingClientPayment,
  onFileUpload,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const selectedDue = React.useMemo(
    () =>
      paymentDues.find((due) => String(due.id) === String(selectedPaymentDueId)),
    [paymentDues, selectedPaymentDueId],
  );
  const amount = toPositiveAmount(paymentAmount);
  const isSubmitDisabled =
    isMarkingClientPayment || !selectedClientId || amount <= 0;
  const balanceSummary = selectedClient?.paymentSummary;
  const expectedAmount = selectedDue
    ? getDueRemainingAmount(selectedDue)
    : Math.max(
        Number(
          balanceSummary?.remainingAmount ??
            balanceSummary?.price ??
            balanceSummary?.agreedAmount ??
            0,
        ),
        0,
      );

  const handleSubmit = () => {
    if (amountRisk?.requiresConfirmation) {
      setIsConfirmOpen(true);
      return;
    }

    onMarkPaid();
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setAddPaymentSearch("");
        }
      }}
      direction="bottom"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Yangi to&apos;lovni qayd etish</DrawerTitle>
          <DrawerDescription>
            Mijoz to&apos;lovini tizimga qo&apos;shish.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Mijozni tanlang
              </Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Mijozni qidirish..."
                  className="pl-9 h-11"
                  value={addPaymentSearch}
                  onChange={(e) => setAddPaymentSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {filteredAddClients.map((client) => {
                const isSelected = selectedClientId === client.id;
                const expectedClientAmount = Math.max(
                  Number(
                    client.paymentSummary?.remainingAmount ??
                      client.paymentSummary?.price ??
                      client.paymentSummary?.agreedAmount ??
                      0,
                  ),
                  0,
                );
                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setSelectedPaymentDueId("");
                      if (expectedClientAmount > 0) {
                        setPaymentAmount(String(expectedClientAmount));
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all mb-2 last:mb-0",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border shadow-sm">
                        <AvatarImage src={client.avatar} alt={client.name} />
                        <AvatarFallback className="font-semibold text-xs text-muted-foreground">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {client.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {expectedClientAmount > 0
                            ? `${formatMoney(expectedClientAmount)} qoldiq`
                            : "Narx kelishilmagan"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-5 rounded-full border flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {isSelected && <CheckCircle2Icon className="size-3" />}
                    </div>
                  </div>
                );
              })}
              {filteredAddClients.length === 0 && !isClientsLoading && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Faol mijozlar topilmadi.
                </div>
              )}
            </div>
          </div>

          {selectedClient ? (
            <div className="grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Kutilgan summa
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formatMoney(
                    balanceSummary?.agreedAmount ?? balanceSummary?.price,
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Shu periodda to'langan
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formatMoney(balanceSummary?.paidThisPeriod)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Qoldiq
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formatMoney(expectedAmount)}
                </p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-xs text-muted-foreground">
                  To&apos;lov muddati: {formatDate(balanceSummary?.dueDate)} ·{" "}
                  {balanceSummary?.label || "Status belgilanmagan"}
                </p>
              </div>
            </div>
          ) : null}

          {selectedClient ? (
            <div className="space-y-3">
              <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                To&apos;lov periodi
              </Label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentDueId("")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all",
                    !selectedPaymentDueId
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:bg-muted/30",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Avtomatik joriy period
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tizim to&apos;lov sanasi bo&apos;yicha mos periodni
                      tanlaydi.
                    </p>
                  </div>
                  <CalendarClockIcon className="size-4 text-muted-foreground" />
                </button>

                {paymentDues.map((due) => {
                  const isSelected =
                    String(selectedPaymentDueId) === String(due.id);
                  const remainingAmount = getDueRemainingAmount(due);

                  return (
                    <button
                      key={due.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaymentDueId(due.id);
                        if (remainingAmount > 0) {
                          setPaymentAmount(String(remainingAmount));
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:bg-muted/30",
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {formatDuePeriod(due)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Muddat: {formatDate(due.dueDate)} · qoldiq{" "}
                          {formatMoney(remainingAmount)}
                        </p>
                      </div>
                      {isSelected ? (
                        <CheckCircle2Icon className="size-4 text-primary" />
                      ) : null}
                    </button>
                  );
                })}

                {!isPaymentDuesLoading && paymentDues.length === 0 ? (
                  <div className="flex gap-2 rounded-2xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    Ochiq to&apos;lov periodi topilmadi. To&apos;lov avtomatik
                    joriy periodga bog&apos;lanadi.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="space-y-6">
            <PaymentMethodPicker
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            <CurrencyAmountField
              id="payment-amount"
              label="Summa"
              value={paymentAmount}
              onChange={setPaymentAmount}
              description={
                expectedAmount > 0
                  ? `Kutilgan qoldiq: ${formatMoney(expectedAmount)}`
                  : "Summa so'mda saqlanadi."
              }
            />
          </div>

          <PaymentSafetyNotice
            risk={amountRisk}
            duplicateWarning={duplicatePaymentWarning}
          />

          <div className="space-y-3">
            <Label
              htmlFor="payment-note"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1"
            >
              Izoh
            </Label>
            <Textarea
              id="payment-note"
              value={paymentNote}
              onChange={(event) => setPaymentNote(event.target.value)}
              placeholder="Masalan: Dekabr oyi uchun to'lov"
              className="bg-card border-border/50 focus:ring-primary/20 min-h-[80px] resize-none"
            />
          </div>

          <ReceiptPreview
            receiptUrl={receiptUrl}
            onClearReceipt={onClearReceipt}
            isUploading={isUploading}
            onFileUpload={(event) => onFileUpload(event, false)}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            size="lg"
          >
            {isMarkingClientPayment ? "Saqlanmoqda..." : "To'lovni saqlash"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
      <PaymentConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={amountRisk?.title || "To'lovni tasdiqlash"}
        description={
          amountRisk?.description ||
          "To'lov summasi va mijoz ma'lumotlarini tekshirib tasdiqlang."
        }
        confirmLabel="Baribir saqlash"
        onConfirm={() => {
          setIsConfirmOpen(false);
          onMarkPaid();
        }}
        isSubmitting={isMarkingClientPayment}
      />
    </Drawer>
  );
};

export default PaymentAddDrawer;
