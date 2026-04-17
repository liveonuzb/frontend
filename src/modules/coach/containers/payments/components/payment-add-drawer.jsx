import React from "react";
import {
  CheckCircle2Icon,
  ImageIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
} from "lucide-react";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
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

const formatMoney = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Kelishiladi";
  }
  return `${new Intl.NumberFormat("uz-UZ").format(normalized)} so'm`;
};

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
  addPaymentSearch,
  setAddPaymentSearch,
  onMarkPaid,
  isMarkingClientPayment,
  onFileUpload,
}) => {
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
                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      if (client.paymentSummary?.price) {
                        setPaymentAmount(String(client.paymentSummary.price));
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
                          {client.paymentSummary?.price > 0
                            ? `${formatMoney(client.paymentSummary.price)} kutilmoqda`
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

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                To&apos;lov usuli
              </Label>
              <div className="flex bg-muted p-1 rounded-lg gap-1 h-11">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={cn(
                    "flex-1 rounded-md text-xs font-medium transition-all",
                    paymentMethod === "CASH"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Naqd
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CLICK")}
                  className={cn(
                    "flex-1 rounded-md text-xs font-medium transition-all",
                    paymentMethod !== "CASH"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Karta
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Summa (so&apos;mda)
              </Label>
              <NumberField
                value={paymentAmount ? Number(paymentAmount) : undefined}
                min={0}
                step={10000}
                onValueChange={(value) =>
                  setPaymentAmount(
                    value === null || Number.isNaN(value)
                      ? ""
                      : String(value),
                  )
                }
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement />
                  <NumberFieldInput
                    placeholder="Masalan: 500000"
                    className="h-11"
                  />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </div>

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

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Kvitansiya (rasm)
            </Label>
            <div className="flex flex-col gap-2">
              {receiptUrl ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ImageIcon className="size-4 text-primary shrink-0" />
                    <span className="text-xs text-primary font-medium truncate">
                      {receiptUrl.split("/").pop()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={onClearReceipt}
                  >
                    <RotateCcwIcon className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => onFileUpload(e, false)}
                    disabled={isUploading}
                    accept="image/*"
                  />
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-6 border border-dashed rounded-xl transition-all",
                      isUploading
                        ? "bg-muted"
                        : "bg-muted/10 hover:bg-muted/20 border-border/50",
                    )}
                  >
                    {isUploading ? (
                      <RotateCcwIcon className="size-6 text-primary animate-spin mb-2" />
                    ) : (
                      <PlusIcon className="size-6 text-muted-foreground mb-2" />
                    )}
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isUploading ? "Yuklanmoqda..." : "Kvitansiya yuklash"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            onClick={onMarkPaid}
            disabled={isMarkingClientPayment || !selectedClientId}
            size="lg"
          >
            {isMarkingClientPayment ? "Saqlanmoqda..." : "To'lovni saqlash"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PaymentAddDrawer;
