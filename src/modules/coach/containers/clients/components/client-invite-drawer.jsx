import React from "react";
import { get, map, size, filter, trim } from "lodash";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const INVITE_METHOD_OPTIONS = [
  {
    value: "phone",
    label: "Telefon orqali",
    description: "Mijozning telefon raqami bilan taklif yuboriladi.",
    icon: null,
    placeholder: "+998 90 123 45 67",
  },
  {
    value: "email",
    label: "Email orqali",
    description: "Mijozning email manzili orqali taklif yuboriladi.",
    icon: null,
    placeholder: "client@example.com",
  },
  {
    value: "telegram",
    label: "Telegram orqali",
    description: "Telegram username orqali foydalanuvchi topiladi.",
    icon: null,
    placeholder: "@username",
  },
];

const WEEKDAY_OPTIONS = [
  { value: "monday", label: "Dushanba" },
  { value: "tuesday", label: "Seshanba" },
  { value: "wednesday", label: "Chorshanba" },
  { value: "thursday", label: "Payshanba" },
  { value: "friday", label: "Juma" },
  { value: "saturday", label: "Shanba" },
  { value: "sunday", label: "Yakshanba" },
];

const PAYMENT_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  return {
    value: String(day),
    label: `${day}-kun`,
  };
});

const ClientInviteDrawer = ({
  inviteStep,
  inviteDraft,
  isInviting,
  onReset,
  onSetStep,
  onUpdateDraft,
  onUpdateTrainingSlot,
  onAddTrainingSlot,
  onRemoveTrainingSlot,
  onSubmit,
  INVITE_METHOD_OPTIONS: methodOptions,
  WEEKDAY_OPTIONS: weekdayOptions,
  PAYMENT_DAY_OPTIONS: paymentDayOptions,
}) => {
  // Use the passed-in options or fall back to local defaults
  const inviteMethodOptions = methodOptions || INVITE_METHOD_OPTIONS;
  const weekdays = weekdayOptions || WEEKDAY_OPTIONS;
  const paymentDays = paymentDayOptions || PAYMENT_DAY_OPTIONS;

  const selectedInviteMethod = React.useMemo(
    () =>
      get(
        {
          v: inviteMethodOptions.find(
            (item) => get(item, "value") === get(inviteDraft, "contactMethod"),
          ),
        },
        "v",
        get(inviteMethodOptions, "[0]"),
      ),
    [inviteDraft.contactMethod, inviteMethodOptions],
  );

  return (
    <>
      {/* Step 1: Method selection */}
      <Drawer
        direction="bottom"
        open={inviteStep === "method"}
        onOpenChange={(open) => {
          if (!open) {
            onReset();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Client qo'shish usuli</DrawerTitle>
            <DrawerDescription>
              Avval qanday yo'l bilan mijoz qo'shishni tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4 py-4">
            {map(inviteMethodOptions, (option) => {
              const Icon = get(option, "icon");

              return (
                <button
                  key={get(option, "value")}
                  type="button"
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                    get(inviteDraft, "contactMethod") === get(option, "value")
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40",
                  )}
                  onClick={() =>
                    onUpdateDraft({ contactMethod: get(option, "value") })
                  }
                >
                  <div className="flex items-start gap-3">
                    {Icon ? (
                      <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                        <Icon className="size-5" />
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      <div className="font-medium">{get(option, "label")}</div>
                      <div className="text-sm text-muted-foreground">
                        {get(option, "description")}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <DrawerFooter>
            <Button onClick={() => onSetStep("identifier")}>
              Davom etish
            </Button>
            <Button variant="outline" onClick={onReset}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Step 2: Identifier input */}
      <Drawer
        direction="bottom"
        open={inviteStep === "identifier"}
        onOpenChange={(open) => {
          if (!open) {
            onReset();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Qiymatni kiriting</DrawerTitle>
            <DrawerDescription>
              {selectedInviteMethod?.label} uchun kerakli qiymatni kiriting.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coach-client-identifier">Qiymat</Label>
              {inviteDraft.contactMethod === "phone" ? (
                <PhoneInput
                  id="coach-client-identifier"
                  value={inviteDraft.identifier}
                  onChange={(value) =>
                    onUpdateDraft({
                      identifier: get({ v: value }, "v", ""),
                    })
                  }
                  defaultCountry="UZ"
                  placeholder={selectedInviteMethod?.placeholder}
                />
              ) : (
                <Input
                  id="coach-client-identifier"
                  value={inviteDraft.identifier}
                  onChange={(event) =>
                    onUpdateDraft({ identifier: event.target.value })
                  }
                  placeholder={selectedInviteMethod?.placeholder}
                />
              )}
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                if (!trim(get(inviteDraft, "identifier", ""))) {
                  toast.error("Qiymat kiriting");
                  return;
                }
                onSetStep("pricing");
              }}
            >
              Davom etish
            </Button>
            <Button variant="outline" onClick={() => onSetStep("method")}>
              Orqaga
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Step 3: Pricing */}
      <Drawer
        direction="bottom"
        open={inviteStep === "pricing"}
        onOpenChange={(open) => {
          if (!open) {
            onReset();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Kelishuv tafsilotlari</DrawerTitle>
            <DrawerDescription>
              Narx va oylik to&apos;lov kunini xohlasangiz hozir kiriting,
              xohlasangiz keyin.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coach-client-agreed-amount">
                Kelishilgan summa
              </Label>
              <NumberField
                value={
                  inviteDraft.agreedAmount
                    ? Number(inviteDraft.agreedAmount)
                    : undefined
                }
                min={0}
                step={10000}
                onValueChange={(value) =>
                  onUpdateDraft({
                    agreedAmount:
                      value === null || Number.isNaN(value)
                        ? ""
                        : String(value),
                  })
                }
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement />
                  <NumberFieldInput
                    id="coach-client-agreed-amount"
                    placeholder="Masalan: 500000"
                  />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-client-payment-day">To&apos;lov kuni</Label>
              <select
                id="coach-client-payment-day"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                value={inviteDraft.paymentDay}
                onChange={(event) =>
                  onUpdateDraft({ paymentDay: event.target.value })
                }
              >
                <option value="">Kunni tanlang</option>
                {map(paymentDays, (option) => (
                  <option
                    key={get(option, "value")}
                    value={get(option, "value")}
                  >
                    {get(option, "label")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                const hasAgreedAmount =
                  trim(String(get(inviteDraft, "agreedAmount", ""))) !== "";
                const amount = hasAgreedAmount
                  ? Number(inviteDraft.agreedAmount)
                  : null;
                if (
                  hasAgreedAmount &&
                  (!Number.isFinite(amount) || amount < 0)
                ) {
                  toast.error("Kelishilgan summani to'g'ri kiriting");
                  return;
                }
                onSetStep("schedule");
              }}
            >
              Davom etish
            </Button>
            <Button
              variant="outline"
              onClick={() => onSetStep("identifier")}
            >
              Orqaga
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Step 4: Schedule */}
      <Drawer
        direction="bottom"
        open={inviteStep === "schedule"}
        onOpenChange={(open) => {
          if (!open) {
            onReset();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mashg'ulot vaqtlari</DrawerTitle>
            <DrawerDescription>
              Mashg'ulot kunlari va soatlarini kiriting, so'ng taklif
              yuboriladi.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-3">
              {map(get(inviteDraft, "trainingSchedule", []), (slot, index) => (
                <div
                  key={`${get(slot, "day")}-${index}`}
                  className="rounded-2xl border p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Kun</Label>
                      <select
                        className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                        value={get(slot, "day")}
                        onChange={(event) =>
                          onUpdateTrainingSlot(index, { day: event.target.value })
                        }
                      >
                        {map(weekdays, (option) => (
                          <option
                            key={get(option, "value")}
                            value={get(option, "value")}
                          >
                            {get(option, "label")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Soat</Label>
                      <Input
                        type="time"
                        value={get(slot, "time")}
                        onChange={(event) =>
                          onUpdateTrainingSlot(index, {
                            time: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  {size(get(inviteDraft, "trainingSchedule")) > 1 ? (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveTrainingSlot(index)}
                      >
                        Olib tashlash
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={onAddTrainingSlot}>
              Yana vaqt qo'shish
            </Button>
          </div>
          <DrawerFooter>
            <Button onClick={() => onSetStep("notes")}>Davom etish</Button>
            <Button variant="outline" onClick={() => onSetStep("pricing")}>
              Orqaga
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Step 5: Notes + Submit */}
      <Drawer
        direction="bottom"
        open={inviteStep === "notes"}
        onOpenChange={(open) => {
          if (!open) {
            onReset();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Izoh</DrawerTitle>
            <DrawerDescription>
              Ixtiyoriy izoh qoldiring va taklifni yuboring.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coach-client-note">Izoh</Label>
              <Textarea
                id="coach-client-note"
                value={inviteDraft.notes}
                onChange={(event) =>
                  onUpdateDraft({ notes: event.target.value })
                }
                placeholder="Masalan: individual kuzatuv, haftasiga 3 mashg'ulot"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={onSubmit} disabled={isInviting}>
              Taklif yuborish
            </Button>
            <Button variant="outline" onClick={() => onSetStep("schedule")}>
              Orqaga
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ClientInviteDrawer;
