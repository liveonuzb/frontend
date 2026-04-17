import React from "react";
import { get, isEmpty, isNil, map, size } from "lodash";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BanknoteIcon, CalendarPlusIcon, WalletCardsIcon, XCircleIcon } from "lucide-react";

const formatNumber = (value, suffix = "") => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toLocaleString("en-US")}${suffix}`;
};

const formatLongDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const SummaryMetricCard = ({ icon: Icon, label, value, hint, isLoading }) => (
  <Card className="py-6">
    <CardContent className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        )}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="rounded-full border p-3">
        <Icon className="size-5" />
      </div>
    </CardContent>
  </Card>
);

const EmptyCardState = ({ children }) => (
  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

const ClientPaymentsTab = ({
  isLoading,
  payments,
  paymentSummary,
  onOpenPaymentDay,
  onOpenPayment,
  onCancelPayment,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryMetricCard
          icon={BanknoteIcon}
          label="Kelishilgan narx"
          value={
            !isNil(get(paymentSummary, "agreedAmount"))
              ? `${get(paymentSummary, "agreedAmount").toLocaleString()} so'm`
              : "—"
          }
          hint="Har oy uchun asosiy summa"
          isLoading={isLoading}
        />
        <SummaryMetricCard
          icon={CalendarPlusIcon}
          label="To'lov kuni"
          value={
            get(paymentSummary, "dayOfMonth")
              ? `${get(paymentSummary, "dayOfMonth")}-kun`
              : "Belgilanmagan"
          }
          hint={
            get(paymentSummary, "lastPaidAt")
              ? `Oxirgi to'lov ${formatLongDate(get(paymentSummary, "lastPaidAt"))}`
              : "To'lov hali qayd etilmagan"
          }
          isLoading={isLoading}
        />
        <SummaryMetricCard
          icon={WalletCardsIcon}
          label="To'lov holati"
          value={get(paymentSummary, "label", "Belgilanmagan")}
          hint={`${size(payments)} ta to'lov yozuvi`}
          isLoading={isLoading}
        />
      </div>

      <Card className="py-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>To&apos;lovlar jadvali</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onOpenPaymentDay}>
              To&apos;lov kuni
            </Button>
            <Button onClick={onOpenPayment}>
              Qo&apos;lda to&apos;lov qo&apos;shish
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            map(Array.from({ length: 4 }), (_, index) => (
              <Skeleton
                key={`payment-history-skeleton-${index}`}
                className="h-20 w-full rounded-xl"
              />
            ))
          ) : isEmpty(payments) ? (
            <EmptyCardState>
              Hozircha bu mijoz uchun to&apos;lov yozuvi yo&apos;q.
            </EmptyCardState>
          ) : (
            map(payments, (payment) => {
              const status = get(payment, "status");
              const amount = get(payment, "amount");
              const paidAt = get(payment, "paidAt");
              const note = get(payment, "note");
              const id = get(payment, "id");

              return (
                <div
                  key={id}
                  className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {amount != null
                        ? `${formatNumber(amount)} so'm`
                        : "Kelishiladi"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sana: {formatLongDate(paidAt)}
                    </p>
                    {note ? (
                      <p className="text-xs text-muted-foreground">
                        Izoh: {note}
                      </p>
                    ) : null}
                    {status === "cancelled" && payment.cancellationReason ? (
                      <p className="text-xs text-destructive">
                        Bekor sababi: {payment.cancellationReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        status === "cancelled"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      }
                    >
                      {status === "cancelled"
                        ? "Bekor qilingan"
                        : "Qabul qilingan"}
                    </Badge>
                    {status !== "cancelled" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onCancelPayment(payment)}
                      >
                        <XCircleIcon className="mr-1 size-4" />
                        Bekor qilish
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPaymentsTab;
