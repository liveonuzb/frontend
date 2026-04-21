import {
  filter,
  find,
  forEach,
  get,
  map,
  size,
  toUpper,
  trim,
} from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";
import { numericFormatter } from "react-number-format";
import {
  getInviteMethodOptions,
  getWeekdayOptions,
  getPaymentDayOptions,
} from "../utils";
import { ArrowLeft2 } from "iconsax-reactjs";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { TimePicker } from "@/components/reui/time-picker";
import { toast } from "sonner";

const createDraft = () => ({
  contactMethod: "phone",
  identifier: "+998",
  agreedAmount: "",
  billingCycle: "MONTHLY",
  paymentDay: "",
  trainingSchedule: [{ day: "monday", time: "18:00" }],
  notes: "",
});

const NumericField = ({ value, onChange, placeholder, suffix }) => {
  const { t } = useTranslation();
  const currencySuffix = suffix || t("coach.clients.inviteSteps.pricing.currency", { defaultValue: "so'm" });
  
  const format = (val) =>
    numericFormatter(String(val), {
      thousandSeparator: " ",
      suffix: ` ${currencySuffix}`,
    });

  return (
    <NumberField
      value={value ? Number(value) : undefined}
      onValueChange={(val) => onChange(val !== undefined ? String(val) : "")}
      step={10000}
      min={0}
      className="flex"
    >
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput
          className="flex-1 px-3 text-center tabular-nums"
          value={format(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            onChange(raw);
          }}
          placeholder={placeholder}
        />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  );
};

const getInviteSchema = (t) =>
  z
    .object({
      contactMethod: z.enum(["phone"]),
      identifier: z
        .string()
        .min(1, t("coach.clients.inviteSteps.toasts.valueRequired")),
      agreedAmount: z.string().optional(),
      billingCycle: z.enum(["MONTHLY", "WEEKLY"]).optional(),
      paymentDay: z.string().optional(),
      trainingSchedule: z
        .array(
          z.object({
            day: z.string(),
            time: z.string(),
          }),
        )
        .min(1, t("coach.clients.inviteSteps.toasts.scheduleRequired")),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.contactMethod === "phone") {
        if (!isValidPhoneNumber(data.identifier || "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("coach.clients.inviteSteps.toasts.phoneError"),
            path: ["identifier"],
          });
        }
      }
    });

export function useInviteFlow({ inviteClient }) {
  const { t } = useTranslation();
  const options = getInviteMethodOptions(t);
  const [inviteStep, setInviteStep] = React.useState(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(getInviteSchema(t)),
    defaultValues: createDraft(),
  });

  const draft = watch();

  const reset = React.useCallback(() => {
    setInviteStep(null);
    resetForm(createDraft());
  }, [resetForm]);

  const open = React.useCallback(() => {
    resetForm(createDraft());
    setInviteStep("method");
  }, [resetForm]);

  const patch = React.useCallback(
    (update) => {
      forEach(update, (value, key) => {
        setValue(key, value, { shouldValidate: true });
      });
    },
    [setValue],
  );

  const patchScheduleSlot = React.useCallback(
    (index, update) => {
      const current = watch("trainingSchedule");
      const updated = map(current, (slot, i) =>
        i === index ? { ...slot, ...update } : slot,
      );
      setValue("trainingSchedule", updated, { shouldValidate: true });
    },
    [setValue, watch],
  );

  const addScheduleSlot = React.useCallback(() => {
    const current = watch("trainingSchedule");
    setValue(
      "trainingSchedule",
      [...current, { day: "monday", time: "18:00" }],
      { shouldValidate: true },
    );
  }, [setValue, watch]);

  const removeScheduleSlot = React.useCallback(
    (index) => {
      const current = watch("trainingSchedule");
      if (size(current) > 1) {
        setValue(
          "trainingSchedule",
          filter(current, (_, i) => i !== index),
          { shouldValidate: true },
        );
      }
    },
    [setValue, watch],
  );

  const onFinalSubmit = async (data) => {
    try {
      const hasAmount = trim(String(data.agreedAmount)) !== "";
      const amount = hasAmount ? Number(data.agreedAmount) : undefined;

      await inviteClient({
        contactMethod: toUpper(data.contactMethod),
        identifier: trim(data.identifier),
        agreedAmount: amount,
        billingCycle: data.billingCycle || "MONTHLY",
        paymentDay: data.paymentDay ? Number(data.paymentDay) : undefined,
        trainingSchedule: data.trainingSchedule,
        notes: trim(get(data, "notes", "")),
      });

      toast.success(t("coach.clients.inviteSteps.toasts.success"));
      reset();
    } catch (error) {
      const message =
        get(error, "response.data.message") || get(error, "message");
      toast.error(message || t("coach.clients.inviteSteps.toasts.error"));
    }
  };

  const selectedMethod =
    find(options, (o) => o.value === draft.contactMethod) ?? options[0];

  return {
    inviteStep,
    setInviteStep,
    draft,
    patch,
    patchScheduleSlot,
    addScheduleSlot,
    removeScheduleSlot,
    submit: handleSubmit(onFinalSubmit),
    open,
    reset,
    selectedMethod,
    options,
    errors,
    trigger,
    control,
  };
}

export function InviteDrawers({
  inviteStep,
  setInviteStep,
  draft,
  patch,
  patchScheduleSlot,
  addScheduleSlot,
  removeScheduleSlot,
  submit,
  reset,
  selectedMethod,
  isInviting,
  control,
  errors,
  trigger,
}) {
  const { t } = useTranslation();
  const options = getInviteMethodOptions(t);
  const weekdayOptions = getWeekdayOptions(t);
  const paymentDayOptions =
    draft.billingCycle === "WEEKLY"
      ? [
          { value: "1", label: t("common.weekdays.monday") },
          { value: "2", label: t("common.weekdays.tuesday") },
          { value: "3", label: t("common.weekdays.wednesday") },
          { value: "4", label: t("common.weekdays.thursday") },
          { value: "5", label: t("common.weekdays.friday") },
          { value: "6", label: t("common.weekdays.saturday") },
          { value: "7", label: t("common.weekdays.sunday") },
        ]
      : getPaymentDayOptions();

  const drawerProps = (step) => ({
    direction: "bottom",
    open: inviteStep === step,
    onOpenChange: (open) => {
      if (!open) reset();
    },
  });

  return (
    <>
      <Drawer {...drawerProps("method")}>
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="relative items-center text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-5 size-8 rounded-full z-10"
              onClick={reset}
            >
              <ArrowLeft2 className="size-4" />
            </Button>
            <div className="w-full px-12">
              <DrawerTitle>
                {t("coach.clients.inviteSteps.method.title")}
              </DrawerTitle>
              <DrawerDescription>
                {t("coach.clients.inviteSteps.method.description")}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div className="space-y-3 px-4 py-4">
            {map(options, (option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                    draft.contactMethod === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                  onClick={() => patch({ contactMethod: option.value })}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <DrawerFooter>
            <Button onClick={() => setInviteStep("identifier")}>
              {t("coach.clients.inviteSteps.method.submit")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer {...drawerProps("identifier")}>
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="relative items-center text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-5 size-8 rounded-full z-10"
              onClick={() => setInviteStep("method")}
            >
              <ArrowLeft2 className="size-4" />
            </Button>
            <div className="w-full px-12">
              <DrawerTitle>
                {t("coach.clients.inviteSteps.identifier.title")}
              </DrawerTitle>
              <DrawerDescription>
                {t("coach.clients.inviteSteps.identifier.description", {
                  method: selectedMethod.label,
                })}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <Controller
              name="identifier"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="coach-invite-identifier">
                    {t("coach.clients.inviteSteps.identifier.phoneLabel")}
                  </FieldLabel>
                  <PhoneInput
                    {...field}
                    id="coach-invite-identifier"
                    defaultCountry="UZ"
                    placeholder={selectedMethod.placeholder}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={async () => {
                const isValid = await trigger("identifier");
                if (isValid) {
                  setInviteStep("pricing");
                }
              }}
            >
              {t("coach.clients.inviteSteps.identifier.submit")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer {...drawerProps("pricing")}>
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="relative items-center text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-5 size-8 rounded-full z-10"
              onClick={() => setInviteStep("identifier")}
            >
              <ArrowLeft2 className="size-4" />
            </Button>
            <div className="w-full px-12">
              <DrawerTitle>
                {t("coach.clients.inviteSteps.pricing.title")}
              </DrawerTitle>
              <DrawerDescription>
                {t("coach.clients.inviteSteps.pricing.description")}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <Controller
              name="agreedAmount"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="coach-invite-amount">
                    {t("coach.clients.inviteSteps.pricing.amountLabel")}
                  </FieldLabel>
                  <NumericField 
                    {...field} 
                    placeholder={t("coach.clients.inviteSteps.pricing.amountPlaceholder")} 
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="billingCycle"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>
                    {t("coach.clients.inviteSteps.pricing.billingCycleLabel", { defaultValue: "Billing cycle" })}
                  </FieldLabel>
                  <Select
                    value={field.value || "MONTHLY"}
                    onValueChange={(value) => {
                      field.onChange(value);
                      patch({ paymentDay: "" });
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
                </Field>
              )}
            />
            <Controller
              name="paymentDay"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="coach-invite-payment-day">
                    {t("coach.clients.inviteSteps.pricing.paymentDayLabel")}
                  </FieldLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="coach-invite-payment-day"
                      className="w-full"
                    >
                      <SelectValue
                        placeholder={t(
                          "coach.clients.inviteSteps.pricing.paymentDayPlaceholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {map(paymentDayOptions, (o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={async () => {
                const isValid = await trigger(["agreedAmount", "paymentDay"]);
                if (isValid) {
                  setInviteStep("schedule");
                }
              }}
            >
              {t("coach.clients.inviteSteps.pricing.submit")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer {...drawerProps("schedule")}>
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="relative items-center text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-5 size-8 rounded-full z-10"
              onClick={() => setInviteStep("pricing")}
            >
              <ArrowLeft2 className="size-4" />
            </Button>
            <div className="w-full px-12">
              <DrawerTitle>
                {t("coach.clients.inviteSteps.schedule.title")}
              </DrawerTitle>
              <DrawerDescription>
                {t("coach.clients.inviteSteps.schedule.description")}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-3">
              {map(get(draft, "trainingSchedule", []), (slot, index) => (
                <div
                  key={`${get(slot, "day")}-${index}`}
                  className="rounded-2xl border p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Controller
                      name={`trainingSchedule.${index}.day`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("coach.clients.inviteSteps.schedule.dayLabel")}
                          </FieldLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {map(weekdayOptions, (o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`trainingSchedule.${index}.time`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            {t("coach.clients.inviteSteps.schedule.timeLabel")}
                          </FieldLabel>
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  {size(get(draft, "trainingSchedule")) > 1 && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleSlot(index)}
                      >
                        {t("coach.clients.inviteSteps.schedule.remove")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="rounded-xl w-full"
              onClick={addScheduleSlot}
            >
              {t("coach.clients.inviteSteps.schedule.addMore")}
            </Button>
          </div>
          <DrawerFooter>
            <Button
              onClick={async () => {
                const isValid = await trigger("trainingSchedule");
                if (isValid) {
                  setInviteStep("notes");
                }
              }}
            >
              {t("coach.clients.inviteSteps.schedule.submit")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer {...drawerProps("notes")}>
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
          <DrawerHeader className="relative items-center text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-5 size-8 rounded-full z-10"
              onClick={() => setInviteStep("schedule")}
            >
              <ArrowLeft2 className="size-4" />
            </Button>
            <div className="w-full px-12">
              <DrawerTitle>
                {t("coach.clients.inviteSteps.notes.title")}
              </DrawerTitle>
              <DrawerDescription>
                {t("coach.clients.inviteSteps.notes.description")}
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-4">
            <Controller
              name="notes"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="coach-invite-notes">
                    {t("coach.clients.inviteSteps.notes.label")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="coach-invite-notes"
                    placeholder={t(
                      "coach.clients.inviteSteps.notes.placeholder",
                    )}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <DrawerFooter>
            <Button onClick={submit} disabled={isInviting}>
              {t("coach.clients.inviteSteps.notes.submit")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
