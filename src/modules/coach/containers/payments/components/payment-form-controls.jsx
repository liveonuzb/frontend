import React from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ImageIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COACH_PAYMENT_METHOD_OPTIONS } from "@/modules/coach/lib/payment-methods";
import {
  formatCurrencyInput,
  formatMoney,
  parseCurrencyAmount,
} from "./payment-form-utils";

export const CurrencyAmountField = ({
  id,
  label = "Summa",
  value,
  onChange,
  placeholder = "500 000",
  description,
  max,
  disabled,
}) => {
  const numericValue = Number(parseCurrencyAmount(value));
  const isOverMax =
    max !== undefined &&
    Number.isFinite(numericValue) &&
    numericValue > Number(max);

  return (
    <div className="space-y-3">
      <Label
        htmlFor={id}
        className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={formatCurrencyInput(value)}
          onChange={(event) => onChange(parseCurrencyAmount(event.target.value))}
          placeholder={placeholder}
          className={cn(
            "h-11 pr-14 font-medium tabular-nums",
            isOverMax && "border-destructive",
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          so'm
        </span>
      </div>
      {description ? (
        <p className="ml-1 text-[11px] text-muted-foreground">{description}</p>
      ) : null}
      {isOverMax ? (
        <p className="ml-1 text-[11px] font-medium text-destructive">
          Maksimal summa {formatMoney(max)}.
        </p>
      ) : null}
    </div>
  );
};

export const PaymentMethodPicker = ({ value, onChange }) => (
  <div className="space-y-3">
    <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      To&apos;lov usuli
    </Label>
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-3">
      {COACH_PAYMENT_METHOD_OPTIONS.map((method) => (
        <button
          key={method.value}
          type="button"
          onClick={() => onChange(method.value)}
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all",
            value === method.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === method.value ? (
            <CheckCircle2Icon className="size-3.5" />
          ) : null}
          {method.shortLabel}
        </button>
      ))}
    </div>
  </div>
);

export const PaymentSafetyNotice = ({ risk, duplicateWarning }) => {
  const notice = risk || duplicateWarning;
  if (!notice) return null;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-3 text-sm",
        risk?.severity === "danger"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
      )}
    >
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold">{notice.title}</p>
        <p className="text-xs leading-5 opacity-90">{notice.description}</p>
      </div>
    </div>
  );
};

export const ReceiptPreview = ({
  receiptUrl,
  onClearReceipt,
  isUploading,
  onFileUpload,
}) => (
  <div className="space-y-3">
    <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      Kvitansiya
    </Label>
    <div className="flex flex-col gap-2">
      {receiptUrl ? (
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <ImageIcon className="size-4 shrink-0 text-primary" />
              <span className="truncate text-xs font-medium text-primary">
                {String(receiptUrl).split("/").pop()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <a href={receiptUrl} target="_blank" rel="noreferrer">
                  Ko'rish
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onClearReceipt}
              >
                <RotateCcwIcon className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <div className="border-t border-primary/10 bg-background/60 p-2">
            <img
              src={receiptUrl}
              alt="Kvitansiya preview"
              className="max-h-56 w-full rounded-xl object-contain"
              loading="lazy"
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={onFileUpload}
            disabled={isUploading}
            accept="image/*"
          />
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border border-dashed p-6 transition-all",
              isUploading
                ? "bg-muted"
                : "border-border/50 bg-muted/10 hover:bg-muted/20",
            )}
          >
            {isUploading ? (
              <RotateCcwIcon className="mb-2 size-6 animate-spin text-primary" />
            ) : (
              <PlusIcon className="mb-2 size-6 text-muted-foreground" />
            )}
            <p className="text-xs font-semibold text-muted-foreground">
              {isUploading ? "Yuklanmoqda..." : "Kvitansiya yuklash"}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

export const PaymentConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Tasdiqlash",
  onConfirm,
  isSubmitting,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isSubmitting}>
          Bekor qilish
        </AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
