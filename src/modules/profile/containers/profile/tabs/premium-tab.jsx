import React from "react";
import { useTranslation } from "react-i18next";
import { find, get, map, size, split } from "lodash";
import {
  CircleDollarSignIcon,
  CrownIcon,
  HistoryIcon,
  LoaderCircleIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import PremiumPlanOption from "@/components/premium/plan-option.jsx";
import {
  formatPremiumPrice,
  getPlanMonthlyEquivalent,
  getPlanSavings,
  getShortestPremiumPlan,
} from "@/components/premium/plan-option-utils.js";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import useApi from "@/hooks/api/use-api";
import usePremium from "@/hooks/app/use-premium";
import { getRequestErrorMessage } from "@/hooks/app/use-profile-settings";
import { trackLaunchEvent } from "@/lib/analytics.js";
import { cn } from "@/lib/utils";

const getStatusLabels = (t) => ({
  active: t("profile.premium.status.active"),
  expired: t("profile.premium.status.expired"),
  cancelled: t("profile.premium.status.cancelled"),
  free: t("profile.premium.status.free"),
});

const getPaymentMethods = (t) => [
  {
    code: "MULTI",
    label: t("profile.premium.payment.multiCard"),
    description: t("profile.premium.payment.multiCardDesc"),
  },
];

const getPaymentMethodLabels = (t) => ({
  MULTI: t("profile.premium.payment.multiCard"),
  PAYME: "Payme",
  CLICK: "Click",
  UZCARD: "Uzcard",
  CASH: t("profile.premium.payment.cash"),
  FREE: t("profile.premium.payment.free"),
  XP: "XP",
});

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10";
    case "expired":
      return "bg-amber-500/10 text-amber-400 hover:bg-amber-500/10";
    case "cancelled":
      return "bg-rose-500/10 text-rose-400 hover:bg-rose-500/10";
    default:
      return "bg-white/10 text-muted-foreground hover:bg-white/10";
  }
};

const PaymentMethodOption = ({
  method,
  isSelected,
  onClick,
  selectedLabel,
}) => (
  <button type="button" onClick={onClick} className="block w-full text-left">
    <div
      className={cn(
        "rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition-all duration-200",
        isSelected
          ? "border-amber-400/80 bg-amber-500/[0.07] shadow-[0_0_0_1px_rgba(251,191,36,0.16)]"
          : "hover:border-white/20 hover:bg-white/[0.05]",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl border",
              isSelected
                ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                : "border-white/10 bg-white/5 text-muted-foreground",
            )}
          >
            <CircleDollarSignIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{method.label}</p>
            <p className="text-sm text-muted-foreground">{method.description}</p>
          </div>
        </div>

        {isSelected ? (
          <Badge className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-400">
            {selectedLabel}
          </Badge>
        ) : null}
      </div>
    </div>
  </button>
);

const formatPremiumDate = (value, locale = "uz-UZ") => {
  const rawValue = String(value ?? "");
  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return split(rawValue, "T")[0] || "-";
  }

  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BillingActionButton = ({
  count,
  description,
  icon: Icon,
  onClick,
  title,
}) => (
  <button
    type="button"
    className="flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-amber-400/30 hover:bg-amber-400/[0.06]"
    onClick={onClick}
  >
    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
      <Icon className="size-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
        {description}
      </span>
    </span>
    <Badge className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-foreground hover:bg-white/10">
      {count}
    </Badge>
  </button>
);

const PremiumInvoicesDrawer = ({
  currencyLabel,
  currentLocale,
  onOpenChange,
  open,
  paymentMethodLabel,
  payments,
  t,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader className="border-b border-white/10 pb-4 pt-5 text-left">
        <DrawerTitle className="text-xl font-semibold tracking-tight">
          {t("profile.premium.invoicesTitle")}
        </DrawerTitle>
        <DrawerDescription>
          {t("profile.premium.invoicesDescription")}
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="space-y-3 px-4 pb-5 pt-4">
        {size(payments) === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <ReceiptTextIcon className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("profile.premium.invoicesEmpty")}
            </p>
          </div>
        ) : (
          map(payments, (payment) => (
            <div
              key={payment.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {payment.planName || t("profile.premium.premiumPayment")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPremiumDate(payment.date, currentLocale)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">
                    {formatPremiumPrice(payment.amount, currentLocale)}{" "}
                    {currencyLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paymentMethodLabel[payment.method] ||
                      payment.method ||
                      "Uzcard"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

const PremiumHistoryDrawer = ({ history, onOpenChange, open, statusLabel, t }) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader className="border-b border-white/10 pb-4 pt-5 text-left">
        <DrawerTitle className="text-xl font-semibold tracking-tight">
          {t("profile.premium.historyTitle")}
        </DrawerTitle>
        <DrawerDescription>
          {t("profile.premium.historyDescription")}
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="space-y-3 px-4 pb-5 pt-4">
        {size(history) === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <HistoryIcon className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("profile.premium.historyEmpty")}
            </p>
          </div>
        ) : (
          map(history, (item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {item.planName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.startDate} -{" "}
                    {item.endDate || t("profile.premium.unlimited")}
                  </p>
                </div>
                <Badge variant="secondary">
                  {statusLabel[item.status] || item.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

export const PremiumTab = () => {
  const { t } = useTranslation();
  const currentLocale = t("common.locale", "uz-UZ");
  const currencyLabel = t("profile.premium.currency", "so'm");
  const statusLabel = getStatusLabels(t);
  const paymentMethodLabel = getPaymentMethodLabels(t);
  const PAYMENT_METHODS = React.useMemo(() => getPaymentMethods(t), [t]);
  const { request } = useApi();
  const queryClient = useQueryClient();

  const {
    premium,
    plans,
    history,
    recentPayments,
    startPremiumCheckout,
    cancelPremium,
    isLoading,
    isPreparingCheckout,
    isActivating,
    isCancelling,
    isFinalizingCheckout,
  } = usePremium();
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState(
    PAYMENT_METHODS[0].code,
  );
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const {
    activeProfileDrawer,
    closeProfileDrawer,
    openProfileDrawer,
  } = useProfileOverlay();
  const isCheckoutOpen = checkoutOpen || activeProfileDrawer === "checkout";
  const isInvoicesOpen = activeProfileDrawer === "invoices";
  const isHistoryOpen = activeProfileDrawer === "history";
  const handleCheckoutOpenChange = React.useCallback(
    (nextOpen) => {
      setCheckoutOpen(nextOpen);
      if (nextOpen) {
        openProfileDrawer("checkout", "premium");
        return;
      }

      closeProfileDrawer();
    },
    [closeProfileDrawer, openProfileDrawer],
  );
  const handlePremiumDrawerOpenChange = React.useCallback(
    (drawerId, nextOpen) => {
      if (nextOpen) {
        openProfileDrawer(drawerId, "premium");
        return;
      }

      closeProfileDrawer();
    },
    [closeProfileDrawer, openProfileDrawer],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!selectedPlan && size(plans) > 0) {
      setSelectedPlan(get(plans, "[0].code", null));
    }
  }, [plans, selectedPlan]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const activePlan = React.useMemo(
    () =>
      find(plans, (plan) => plan.code === selectedPlan) ??
      get(plans, "[0]", null),
    [plans, selectedPlan],
  );
  const shortestPlan = React.useMemo(
    () => getShortestPremiumPlan(plans),
    [plans],
  );
  const selectedPlanMonthlyEquivalent = React.useMemo(
    () => getPlanMonthlyEquivalent(activePlan),
    [activePlan],
  );
  const selectedPlanSavings = React.useMemo(
    () => getPlanSavings(activePlan, shortestPlan),
    [activePlan, shortestPlan],
  );

  const handleActivate = React.useCallback(async () => {
    if (!activePlan?.code) {
      return;
    }

    try {
      void trackLaunchEvent("premium_checkout_opened", {
        source: "premium",
        properties: {
          planCode: activePlan.code,
          paymentMethod: selectedPaymentMethod,
        },
      });
      const response = await startPremiumCheckout({
        planCode: activePlan.code,
        paymentMethod: selectedPaymentMethod,
      });

      if (response?.redirect) {
        handleCheckoutOpenChange(false);
        void trackLaunchEvent("premium_checkout_session_created", {
          source: "premium",
          properties: {
            planCode: activePlan.code,
            paymentMethod: selectedPaymentMethod,
            redirect: true,
          },
        });
        toast.success(t("profile.premium.checkoutOpened"));
        return;
      }

      handleCheckoutOpenChange(false);
      void trackLaunchEvent("premium_checkout_succeeded", {
        source: "premium",
        properties: {
          planCode: activePlan.code,
          paymentMethod: selectedPaymentMethod,
          redirect: false,
        },
      });
      toast.success(
        get(response, "data.message", t("profile.premium.activationSuccess")),
      );
    } catch (error) {
      void trackLaunchEvent("premium_checkout_failed", {
        source: "premium",
        properties: {
          planCode: activePlan.code,
          paymentMethod: selectedPaymentMethod,
        },
      });
      toast.error(
        getRequestErrorMessage(error, t("profile.premium.activationError")),
      );
    }
  }, [
    activePlan,
    handleCheckoutOpenChange,
    selectedPaymentMethod,
    startPremiumCheckout,
    t,
  ]);

  const handleCancel = React.useCallback(async () => {
    try {
      await cancelPremium();
      toast.success(t("profile.premium.cancelSuccess"));
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, t("profile.premium.cancelError")),
      );
    }
  }, [cancelPremium, t]);

  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = React.useState(false);
  const handleToggleAutoRenew = React.useCallback(async (value) => {
    try {
      setIsTogglingAutoRenew(true);
      await request.patch("/users/me/premium/auto-renew", { autoRenew: value });
      queryClient.invalidateQueries({ queryKey: ["me", "premium"] });
    } catch (error) {
      toast.error(getRequestErrorMessage(error, "Xatolik yuz berdi"));
    } finally {
      setIsTogglingAutoRenew(false);
    }
  }, [request, queryClient]);

  if (isLoading || isFinalizingCheckout) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
        {isFinalizingCheckout
          ? t("profile.premium.confirmingPayment")
          : t("profile.premium.loadingData")}
      </div>
    );
  }

  if (size(plans) === 0) {
    return (
      <Card className="border-white/10 bg-white/[0.03] py-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">
            {t("profile.tabs.premium")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t("profile.premium.noPlans")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
        <div className="space-y-6 p-6 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <CrownIcon className="size-3.5 text-amber-400" />
                {t("profile.tabs.premium")}
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t("profile.premium.title")}
                </h2>
                <p className="max-w-lg text-sm text-muted-foreground">
                  {t("profile.premium.description")}
                </p>
              </div>
            </div>

            {activePlan ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left md:min-w-[220px] md:text-right">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {t("profile.premium.selectedPlan")}
                </p>
                <p className="mt-1 font-semibold">{activePlan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activePlan.period} •{" "}
                  {formatPremiumPrice(activePlan.price, currentLocale)}{" "}
                  {currencyLabel}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {t("profile.premium.currentStatus")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-semibold tracking-tight">
                    {premium?.planName || t("profile.premium.freePlan")}
                  </p>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusBadgeClass(premium?.status),
                    )}
                  >
                    {statusLabel[premium?.status] ||
                      t("profile.premium.status.free")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {premium?.endDate
                    ? `${t("profile.premium.expires")}: ${premium.endDate}`
                    : t("profile.premium.notActive")}
                </p>
              </div>

              {premium?.status === "active" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm font-medium">Avtomatik yangilash</p>
                    <Switch
                      checked={premium.autoRenew ?? false}
                      disabled={isTogglingAutoRenew}
                      onCheckedChange={handleToggleAutoRenew}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                    disabled={isCancelling}
                    onClick={handleCancel}
                  >
                    {isCancelling
                      ? t("profile.general.cancelling")
                      : t("profile.general.cancel")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">
                {t("profile.premium.planSelectorTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("profile.premium.planSelectorDescription")}
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {map(plans, (plan) => {
                const isSelected = selectedPlan === plan.code;
                const isCurrent =
                  premium?.planCode === plan.code && premium?.status === "active";

                return (
                  <PremiumPlanOption
                    key={plan.code}
                    plan={plan}
                    locale={currentLocale}
                    basePlan={shortestPlan}
                    isSelected={isSelected}
                    isCurrent={isCurrent}
                    onClick={() => setSelectedPlan(plan.code)}
                    currencyLabel={currencyLabel}
                    selectedLabel={t("profile.premium.selected")}
                    currentLabel={t("profile.premium.current")}
                    bestValueLabel={t("profile.premium.planUi.bestValue")}
                    perMonthLabel={t("profile.premium.planUi.perMonth")}
                    savingsLabel={t("profile.premium.planUi.saving")}
                    durationLabel={(count) =>
                      t("profile.premium.planUi.duration", { count })
                    }
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {t("profile.premium.selectedPlan")}
                </p>
                <p className="text-lg font-semibold tracking-tight">
                  {activePlan?.name || t("profile.premium.premiumPlan")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activePlan?.period || ""} •{" "}
                  {formatPremiumPrice(activePlan?.price, currentLocale)}{" "}
                  {currencyLabel}
                </p>
              </div>

              <div className="text-left md:text-right">
                {selectedPlanMonthlyEquivalent ? (
                  <p className="text-sm font-medium text-foreground/85">
                    ~
                    {formatPremiumPrice(
                      selectedPlanMonthlyEquivalent,
                      currentLocale,
                    )}{" "}
                    {currencyLabel} / {t("profile.premium.planUi.perMonth")}
                  </p>
                ) : null}
                {selectedPlanSavings ? (
                  <p className="mt-1 text-xs font-medium text-emerald-400">
                    {formatPremiumPrice(selectedPlanSavings, currentLocale)}{" "}
                    {currencyLabel} {t("profile.premium.planUi.saving")}
                  </p>
                ) : activePlan?.durationDays ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("profile.premium.planUi.duration", {
                      count: activePlan.durationDays,
                    })}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl bg-amber-400 text-black hover:bg-amber-300"
                disabled={!activePlan || isActivating || isPreparingCheckout}
                onClick={() => handleCheckoutOpenChange(true)}
              >
                {t("profile.premium.activate")}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Card className="border-white/10 bg-white/[0.03] py-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ReceiptTextIcon className="size-5 text-amber-300" />
            {t("profile.premium.billingTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-6">
          <BillingActionButton
            icon={ReceiptTextIcon}
            title={t("profile.premium.invoicesTitle")}
            description={t("profile.premium.invoicesDescription")}
            count={size(recentPayments)}
            onClick={() => handlePremiumDrawerOpenChange("invoices", true)}
          />
          <BillingActionButton
            icon={HistoryIcon}
            title={t("profile.premium.historyTitle")}
            description={t("profile.premium.historyDescription")}
            count={size(history)}
            onClick={() => handlePremiumDrawerOpenChange("history", true)}
          />
        </CardContent>
      </Card>
      <Drawer
        open={isCheckoutOpen}
        onOpenChange={handleCheckoutOpenChange}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader className="border-b border-white/10 pb-4 pt-5 text-center">
            <DrawerTitle className="text-xl font-semibold tracking-tight">
              {t("profile.premium.checkoutTitle")}
            </DrawerTitle>
            <DrawerDescription>
              {t("profile.premium.checkoutSubtitle")}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="pb-4 pt-4">
            <div className="space-y-5">
              {activePlan ? (
                <PremiumPlanOption
                  plan={activePlan}
                  locale={currentLocale}
                  basePlan={shortestPlan}
                  isSelected
                  compact
                  interactive={false}
                  currencyLabel={currencyLabel}
                  selectedLabel={t("profile.premium.selected")}
                  currentLabel={t("profile.premium.current")}
                  bestValueLabel={t("profile.premium.planUi.bestValue")}
                  perMonthLabel={t("profile.premium.planUi.perMonth")}
                  savingsLabel={t("profile.premium.planUi.saving")}
                  durationLabel={(count) =>
                    t("profile.premium.planUi.duration", { count })
                  }
                />
              ) : null}

              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {t("profile.premium.paymentMethod")}
                </p>
                <div className="grid gap-3">
                  {map(PAYMENT_METHODS, (method) => {
                    const isSelected = selectedPaymentMethod === method.code;

                    return (
                      <PaymentMethodOption
                        key={method.code}
                        method={method}
                        isSelected={isSelected}
                        onClick={() => setSelectedPaymentMethod(method.code)}
                        selectedLabel={t("profile.premium.selected")}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </DrawerBody>

          <DrawerFooter className="border-t border-white/10 p-4">
            <Button
              type="button"
              className="h-12 rounded-2xl bg-amber-400 text-black hover:bg-amber-300"
              disabled={!activePlan || isActivating || isPreparingCheckout}
              onClick={handleActivate}
            >
              {isPreparingCheckout
                ? t("profile.premium.preparingCheckout")
                : isActivating
                  ? t("profile.premium.confirmingPayment")
                  : t("profile.premium.goToPayment")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              disabled={isActivating || isPreparingCheckout}
              onClick={() => handleCheckoutOpenChange(false)}
            >
              {t("profile.general.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <PremiumInvoicesDrawer
        open={isInvoicesOpen}
        onOpenChange={(nextOpen) =>
          handlePremiumDrawerOpenChange("invoices", nextOpen)
        }
        payments={recentPayments}
        currentLocale={currentLocale}
        currencyLabel={currencyLabel}
        paymentMethodLabel={paymentMethodLabel}
        t={t}
      />
      <PremiumHistoryDrawer
        open={isHistoryOpen}
        onOpenChange={(nextOpen) =>
          handlePremiumDrawerOpenChange("history", nextOpen)
        }
        history={history}
        statusLabel={statusLabel}
        t={t}
      />
    </div>
  );
};

export default PremiumTab;
