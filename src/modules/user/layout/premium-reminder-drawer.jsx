import React from "react";
import { get } from "lodash";
import {
  ArrowLeftIcon,
  CheckIcon,
  CircleDollarSignIcon,
  CrownIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import usePremium from "@/hooks/app/use-premium";
import { getRequestErrorMessage } from "@/hooks/app/use-profile-settings";
import { cn } from "@/lib/utils";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import { useAuthStore } from "@/store";

const REMINDER_INTERVAL_MS = 60 * 60 * 1000;
const storageKeyPrefix = "premium-reminder:last-opened-at";

const getPaymentMethods = (t) => [
  {
    code: "MULTI",
    label: "Multi Card",
    description: t("profile.premium.payment.multiCardDesc"),
  },
];

const formatPrice = (value, t) =>
  new Intl.NumberFormat(t("common.locale", "uz-UZ")).format(Number(value) || 0);

const getPlanMonthlyEquivalent = (plan) => {
  const durationDays = Number(plan?.durationDays) || 0;
  const price = Number(plan?.price) || 0;

  if (durationDays <= 30 || price <= 0) {
    return null;
  }

  return Math.round(price / (durationDays / 30));
};

const getPlanSavings = (plan, basePlan) => {
  const planDurationDays = Number(plan?.durationDays) || 0;
  const baseDurationDays = Number(basePlan?.durationDays) || 0;
  const planPrice = Number(plan?.price) || 0;
  const basePrice = Number(basePlan?.price) || 0;

  if (
    !basePlan ||
    planDurationDays <= baseDurationDays ||
    planPrice <= 0 ||
    basePrice <= 0
  ) {
    return null;
  }

  const comparablePrice = Math.round(
    (basePrice / baseDurationDays) * planDurationDays,
  );
  const savings = comparablePrice - planPrice;

  return savings > 0 ? savings : null;
};

const getStorageKey = (userId) => `${storageKeyPrefix}:${userId}`;

const readLastReminderAt = (userId) => {
  if (!userId || typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(getStorageKey(userId));
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const writeLastReminderAt = (userId, timestamp) => {
  if (!userId || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), String(timestamp));
};

const hasActivePremium = (user) => user?.premium?.status === "active";

const DrawerBackButton = ({ onClick }) => (
  <Button type="button" variant="ghost" size="icon" onClick={onClick}>
    <ArrowLeftIcon className="size-4" />
  </Button>
);

const PremiumReminderDrawer = ({ forceOpen = false }) => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { openProfile } = useProfileOverlay();
  const userId = user?.id ?? null;
  const {
    plans,
    startPremiumCheckout,
    isLoading,
    isPreparingCheckout,
    isActivating,
    isFinalizingCheckout,
  } = usePremium();

  const PAYMENT_METHODS = React.useMemo(() => getPaymentMethods(t), [t]);

  const [selectedPlanCode, setSelectedPlanCode] = React.useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState(
    PAYMENT_METHODS[0].code,
  );
  const [reminderOpen, setReminderOpen] = React.useState(false);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [lastReminderAt, setLastReminderAt] = React.useState(() =>
    readLastReminderAt(userId),
  );
  const previousAuthStateRef = React.useRef(isAuthenticated);
  const isPremiumActive = hasActivePremium(user);

  React.useEffect(() => {
    setLastReminderAt(readLastReminderAt(userId));
    setReminderOpen(false);
    setPlanOpen(false);
    setPaymentOpen(false);
    setSuccessOpen(false);
  }, [userId]);

  React.useEffect(() => {
    if (!selectedPlanCode && plans.length > 0) {
      setSelectedPlanCode(plans[0]?.code ?? null);
    }
  }, [plans, selectedPlanCode]);

  const selectedPlan = React.useMemo(
    () =>
      plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0] ?? null,
    [plans, selectedPlanCode],
  );
  const shortestPlan = React.useMemo(() => {
    const comparablePlans = plans.filter(
      (plan) => Number(plan?.durationDays) > 0 && Number(plan?.price) > 0,
    );

    if (comparablePlans.length === 0) {
      return null;
    }

    return [...comparablePlans].sort(
      (left, right) => Number(left.durationDays) - Number(right.durationDays),
    )[0];
  }, [plans]);

  const closeAllDrawers = React.useCallback(() => {
    setReminderOpen(false);
    setPlanOpen(false);
    setPaymentOpen(false);
    setSuccessOpen(false);
  }, []);

  const openReminder = React.useCallback(() => {
    closeAllDrawers();
    setReminderOpen(true);
  }, [closeAllDrawers]);

  React.useEffect(() => {
    const wasAuthenticated = previousAuthStateRef.current;
    previousAuthStateRef.current = isAuthenticated;

    if (!isAuthenticated || wasAuthenticated || !userId || isPremiumActive) {
      return;
    }

    const nextTimestamp = Date.now();
    writeLastReminderAt(userId, nextTimestamp);
    setLastReminderAt(nextTimestamp);
    openReminder();
  }, [closeAllDrawers, isAuthenticated, isPremiumActive, openReminder, userId]);

  React.useEffect(() => {
    if (forceOpen) {
      openReminder();
    }
  }, [forceOpen, openReminder]);

  React.useEffect(() => {
    if (!userId || isPremiumActive) {
      closeAllDrawers();
      return;
    }

    const elapsed = lastReminderAt
      ? Date.now() - lastReminderAt
      : REMINDER_INTERVAL_MS;
    const delay = Math.max(0, REMINDER_INTERVAL_MS - elapsed);

    const timerId = window.setTimeout(() => {
      const nextTimestamp = Date.now();
      writeLastReminderAt(userId, nextTimestamp);
      setLastReminderAt(nextTimestamp);
      openReminder();
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [closeAllDrawers, isPremiumActive, lastReminderAt, openReminder, userId]);

  React.useEffect(() => {
    if (isPremiumActive && !successOpen) {
      closeAllDrawers();
    }
  }, [closeAllDrawers, isPremiumActive, successOpen]);

  const handleContinueFromReminder = React.useCallback(() => {
    setReminderOpen(false);
    setPlanOpen(true);
  }, []);

  const handleContinueToPayment = React.useCallback(() => {
    if (!selectedPlan?.code) {
      return;
    }

    setPlanOpen(false);
    setPaymentOpen(true);
  }, [selectedPlan]);

  const handleActivatePremium = React.useCallback(async () => {
    if (!selectedPlan?.code) {
      return;
    }

    try {
      const response = await startPremiumCheckout({
        planCode: selectedPlan.code,
        paymentMethod: selectedPaymentMethod,
      });

      if (response?.redirect) {
        setPaymentOpen(false);
        closeAllDrawers();
        toast.success(t("profile.premiumReminder.toasts.checkoutOpened"));
        return;
      }

      setPaymentOpen(false);
      setSuccessOpen(true);
      toast.success(
        get(
          response,
          "data.message",
          t("profile.premiumReminder.toasts.success"),
        ),
      );
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          t("profile.premiumReminder.toasts.error"),
        ),
      );
    }
  }, [
    closeAllDrawers,
    selectedPaymentMethod,
    selectedPlan,
    startPremiumCheckout,
    t,
  ]);

  React.useEffect(() => {
    if (!isPremiumActive || !isFinalizingCheckout) {
      return;
    }

    closeAllDrawers();
    setSuccessOpen(true);
  }, [closeAllDrawers, isFinalizingCheckout, isPremiumActive]);

  const handleOpenPremiumDetails = React.useCallback(() => {
    setSuccessOpen(false);
    openProfile("premium");
  }, [openProfile]);

  if (!userId || (isPremiumActive && !successOpen)) {
    return null;
  }

  return (
    <>
      <Drawer
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col items-center justify-center space-y-1 text-center">
            <DrawerTitle className="flex items-center justify-center gap-2 leading-tight">
              <SparklesIcon className="size-4 shrink-0" />
              Go wild with Pro
            </DrawerTitle>
            <DrawerDescription>
              {t("profile.premiumReminder.description")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4 pb-2 text-left">
            <div className="rounded-2xl border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CrownIcon className="size-4" />
                {t("profile.premiumReminder.benefits.title")}
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckIcon className="size-4" />
                  <span>{t("profile.premiumReminder.benefits.mealPlan")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="size-4" />
                  <span>{t("profile.premiumReminder.benefits.analytics")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="size-4" />
                  <span>
                    {t("profile.premiumReminder.benefits.newFeatures")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button
              type="button"
              className={"h-11"}
              onClick={handleContinueFromReminder}
            >
              See pro plans
            </Button>
            <Button
              type="button"
              variant="link"
              className={"underline h-11"}
              onClick={() => setReminderOpen(false)}
            >
              {t("profile.premiumReminder.actions.later")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={planOpen} onOpenChange={setPlanOpen} direction="bottom">
        <DrawerContent>
          <DrawerHeader className="flex flex-col items-center justify-center space-y-1 text-center">
            <DrawerTitle>
              {t("profile.premiumReminder.plans.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("profile.premiumReminder.plans.description")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4 pb-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <LoaderCircleIcon className="mr-2 size-4 animate-spin" />
                {t("profile.premiumReminder.plans.loading")}
              </div>
            ) : plans.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-center text-sm text-muted-foreground">
                {t("profile.premium.noPlans")}
              </div>
            ) : (
              plans.map((plan) => {
                const isSelected = selectedPlan?.code === plan.code;
                const monthlyEquivalent = getPlanMonthlyEquivalent(plan);
                const savings = getPlanSavings(plan, shortestPlan);
                const hasFeatures =
                  Array.isArray(plan.features) && plan.features.length > 0;

                return (
                  <button
                    key={plan.code}
                    type="button"
                    onClick={() => setSelectedPlanCode(plan.code)}
                    className="block w-full text-left transition-transform active:scale-[0.99]"
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] p-5 transition-all duration-200",
                        isSelected
                          ? "border-amber-400/90 bg-amber-500/[0.07] shadow-[0_0_0_1px_rgba(251,191,36,0.18)]"
                          : "hover:border-white/20 hover:bg-white/[0.04]",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent",
                          isSelected && "via-amber-300/90",
                        )}
                      />
                      <div className="flex gap-4">
                        <div
                          className={cn(
                            "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                            isSelected
                              ? "border-amber-400 bg-amber-400 text-black"
                              : "border-white/15 bg-transparent text-transparent",
                          )}
                        >
                          <CheckIcon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-semibold tracking-tight">
                                  {plan.name}
                                </p>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                  {plan.period}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {plan.description || plan.period}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {isSelected ? (
                                <Badge className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-400">
                                  {t("profile.premiumReminder.plans.selected")}
                                </Badge>
                              ) : savings ? (
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                                  {t("profile.premiumReminder.plans.bestValue")}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-5 flex items-end justify-between gap-4">
                            <div>
                              <p className="text-[2rem] font-semibold leading-none tracking-tight">
                                {formatPrice(plan.price, t)}
                              </p>
                              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                UZS
                              </p>
                            </div>
                            <div className="text-right">
                              {monthlyEquivalent ? (
                                <p className="text-sm font-medium text-foreground/85">
                                  ~{formatPrice(monthlyEquivalent, t)} UZS /{" "}
                                  {t("profile.premiumReminder.plans.perMonth")}
                                </p>
                              ) : (
                                <p className="text-sm font-medium text-foreground/85">
                                  {plan.period}
                                </p>
                              )}
                              {savings ? (
                                <p className="mt-1 text-xs font-medium text-emerald-400">
                                  {formatPrice(savings, t)} UZS{" "}
                                  {t("profile.premiumReminder.plans.saving")}
                                </p>
                              ) : plan.durationDays ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {t("profile.premiumReminder.plans.duration", {
                                    count: plan.durationDays,
                                  })}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {hasFeatures ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {plan.features.slice(0, 2).map((feature) => (
                                <span
                                  key={feature}
                                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <DrawerFooter>
            <Button
              type="button"
              disabled={!selectedPlan || isLoading}
              onClick={handleContinueToPayment}
            >
              {t("profile.premiumReminder.plans.continue")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader className="relative flex flex-col items-center justify-center space-y-1 text-center">
            <div className="absolute left-4 top-5">
              <DrawerBackButton
                onClick={() => {
                  setPaymentOpen(false);
                  setPlanOpen(true);
                }}
              />
            </div>
            <DrawerTitle>
              {t("profile.premiumReminder.payment.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("profile.premiumReminder.payment.description")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-2">
            <div className="rounded-2xl border p-4">
              <p className="font-medium">
                {selectedPlan?.name ||
                  t("profile.premiumReminder.payment.planLabel")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedPlan?.period ||
                  t("profile.premiumReminder.payment.periodLabel")}{" "}
                • {formatPrice(selectedPlan?.price, t)} UZS
              </p>
            </div>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedPaymentMethod === method.code;

                return (
                  <button
                    key={method.code}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.code)}
                    className="block w-full text-left"
                  >
                    <div
                      className={`rounded-2xl border p-4 ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CircleDollarSignIcon className="size-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{method.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {method.description}
                            </p>
                          </div>
                        </div>
                        {isSelected ? (
                          <Badge>
                            {t("profile.premiumReminder.plans.selected")}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <DrawerFooter>
            <Button
              type="button"
              disabled={!selectedPlan || isActivating || isPreparingCheckout}
              onClick={handleActivatePremium}
            >
              {isPreparingCheckout
                ? t("profile.premiumReminder.payment.preparing")
                : isActivating
                  ? t("profile.premiumReminder.payment.activating")
                  : t("profile.premiumReminder.payment.action")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPaymentOpen(false);
                setPlanOpen(true);
              }}
            >
              {t("profile.premiumReminder.plans.back")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={successOpen}
        onOpenChange={setSuccessOpen}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col items-center justify-center space-y-1 text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckIcon className="size-6" />
            </div>
            <DrawerTitle>
              {t("profile.premiumReminder.success.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("profile.premiumReminder.success.description")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <div className="rounded-2xl border p-4 text-left">
              <p className="font-medium">
                {selectedPlan?.name ||
                  t("profile.premiumReminder.payment.planLabel")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("profile.premium.paymentMethod")}:{" "}
                {PAYMENT_METHODS.find(
                  (method) => method.code === selectedPaymentMethod,
                )?.label || selectedPaymentMethod}
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button type="button" onClick={handleOpenPremiumDetails}>
              {t("profile.premiumReminder.success.details")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessOpen(false);
              }}
            >
              {t("profile.premiumReminder.success.close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default PremiumReminderDrawer;
