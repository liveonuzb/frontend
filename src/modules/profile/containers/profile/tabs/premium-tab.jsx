import React from "react";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import {
  CheckIcon,
  CircleDollarSignIcon,
  CrownIcon,
  GiftIcon,
  LoaderCircleIcon,
  MinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import PremiumPlanOption, {
  formatPremiumPrice,
  getPlanMonthlyEquivalent,
  getPlanSavings,
  getShortestPremiumPlan,
} from "@/components/premium/plan-option.jsx";
import { useGetQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api";
import usePremium from "@/hooks/app/use-premium";
import { getRequestErrorMessage } from "@/hooks/app/use-profile-settings";
import { cn } from "@/lib/utils";
import GiftPremiumDrawer from "@/modules/user/components/gift-premium-drawer.jsx";

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

const PLAN_FEATURES = [
  { label: "Kunlik kuzatuv (Suv, Ovqat, Mashq)", free: true, premium: true, family: true },
  { label: "Do'stlar tarmog'i va challenge", free: true, premium: true, family: true },
  { label: "Discover (Zallar, Ovqatlar, Murabbiylar)", free: true, premium: true, family: true },
  { label: "AI ovqat tahlili (kamera orqali)", free: false, premium: true, family: true },
  { label: "Cheksiz ovqat logi", free: false, premium: true, family: true },
  { label: "Premium Leaderboard", free: false, premium: true, family: true },
  { label: "Haftalik sog'liq hisoboti (PDF)", free: false, premium: true, family: true },
  { label: "Murabbiy ulanishi (Premium rejim)", free: false, premium: true, family: true },
  { label: "Reklama yo'q", free: false, premium: true, family: true },
  { label: "Oila a'zolari (5 tagacha)", free: false, premium: false, family: true },
  { label: "Oila leaderboard", free: false, premium: false, family: true },
];

const PlanComparisonSection = () => (
  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
    <h3 className="text-base font-bold">Tariflarni solishtirish</h3>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[360px] text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="pb-3 text-left font-medium text-muted-foreground">Xususiyat</th>
            <th className="pb-3 text-center font-medium text-muted-foreground">Bepul</th>
            <th className="pb-3 text-center font-bold text-amber-400">Premium</th>
            <th className="pb-3 text-center font-bold text-primary">Oilaviy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {PLAN_FEATURES.map((f) => (
            <tr key={f.label}>
              <td className="py-2.5 pr-4 text-xs leading-5">{f.label}</td>
              {["free", "premium", "family"].map((plan) => (
                <td key={plan} className="py-2.5 text-center">
                  {f[plan] ? (
                    <CheckIcon className="mx-auto size-4 text-emerald-400" />
                  ) : (
                    <MinusIcon className="mx-auto size-4 text-muted-foreground/30" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const FamilyPlanSection = () => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState(null);

  const { data, isLoading } = useGetQuery({
    url: "/users/me/family",
    queryProps: { queryKey: ["me", "family"] },
  });

  const group = data?.data?.group;

  const handleAddMember = async () => {
    if (!identifier.trim()) return;
    try {
      setIsAdding(true);
      await request.post("/users/me/family/members", {
        identifier: identifier.trim(),
      });
      setIdentifier("");
      queryClient.invalidateQueries({ queryKey: ["me", "family"] });
      toast.success("A'zo qo'shildi");
    } catch (err) {
      toast.error(getRequestErrorMessage(err, "A'zo qo'shilmadi"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      setRemovingId(memberId);
      await request.delete(`/users/me/family/members/${memberId}`);
      queryClient.invalidateQueries({ queryKey: ["me", "family"] });
      toast.success("A'zo olib tashlandi");
    } catch (err) {
      toast.error(getRequestErrorMessage(err, "Xatolik yuz berdi"));
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/[0.03] py-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Oilaviy plan</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-24 rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (!group) {
    return (
      <Card className="border-white/10 bg-white/[0.03] py-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Oilaviy plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 p-6 py-8 text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Oilaviy plan faol emas. Oilaviy plan sotib oling va oila
            a&apos;zolarini qo&apos;shing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03] py-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">Oilaviy plan</CardTitle>
          <Badge
            variant="outline"
            className="border-white/10 text-muted-foreground"
          >
            {group.members.length}/{group.maxMembers} a&apos;zo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {group.members.length < group.maxMembers ? (
          <div className="flex gap-2">
            <Input
              placeholder="Username, email yoki telefon"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              className="border-white/10 bg-white/5"
            />
            <Button
              type="button"
              size="sm"
              disabled={!identifier.trim() || isAdding}
              onClick={handleAddMember}
            >
              <UserPlusIcon className="mr-1.5 size-3.5" />
              Qo&apos;shish
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Maksimal a&apos;zolar soni to&apos;lgan ({group.maxMembers} ta).
          </p>
        )}

        {group.members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <UsersIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hali a&apos;zolar yo&apos;q
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {group.members.map((member) => {
              const initials = member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {initials || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{member.name}</p>
                      {member.username ? (
                        <p className="text-xs text-muted-foreground">
                          @{member.username}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={removingId === member.id}
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    {removingId === member.id ? "..." : "Olib tashlash"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PremiumTab = () => {
  const { t } = useTranslation();
  const currentLocale = t("common.locale", "uz-UZ");
  const currencyLabel = t("profile.coach.currency");
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
  const [giftDrawerOpen, setGiftDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!selectedPlan && plans.length > 0) {
      setSelectedPlan(plans[0]?.code ?? null);
    }
  }, [plans, selectedPlan]);

  const activePlan = React.useMemo(
    () => plans.find((plan) => plan.code === selectedPlan) ?? plans[0] ?? null,
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
      const response = await startPremiumCheckout({
        planCode: activePlan.code,
        paymentMethod: selectedPaymentMethod,
      });

      if (response?.redirect) {
        setCheckoutOpen(false);
        toast.success(t("profile.premium.checkoutOpened"));
        return;
      }

      setCheckoutOpen(false);
      toast.success(
        get(response, "data.message", t("profile.premium.activationSuccess")),
      );
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, t("profile.premium.activationError")),
      );
    }
  }, [activePlan, selectedPaymentMethod, startPremiumCheckout, t]);

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

  if (plans.length === 0) {
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
              {plans.map((plan) => {
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="h-12 rounded-2xl bg-amber-400 text-black hover:bg-amber-300"
                disabled={!activePlan || isActivating || isPreparingCheckout}
                onClick={() => setCheckoutOpen(true)}
              >
                {t("profile.premium.activate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 gap-2 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => setGiftDrawerOpen(true)}
              >
                <GiftIcon className="size-4" />
                {t("profile.premium.giftAction")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {history.length > 0 ? (
        <Card className="border-white/10 bg-white/[0.03] py-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              {t("profile.premium.historyTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 p-4"
              >
                <div>
                  <p className="font-medium">{item.planName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.startDate} - {item.endDate || t("profile.premium.unlimited")}
                  </p>
                </div>
                <Badge variant="secondary">
                  {statusLabel[item.status] || item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {recentPayments.length > 0 ? (
        <Card className="border-white/10 bg-white/[0.03] py-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              {t("profile.premium.paymentsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {recentPayments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 p-4"
              >
                <div>
                  <p className="font-medium">
                    {payment.planName || t("profile.premium.premiumPayment")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.date.slice(0, 10)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatPremiumPrice(payment.amount, currentLocale)}{" "}
                    {currencyLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethodLabel[payment.method] ||
                      payment.method ||
                      "Uzcard"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Drawer
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        direction="bottom"
      >
        <DrawerContent>
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
                  {PAYMENT_METHODS.map((method) => {
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
              onClick={() => setCheckoutOpen(false)}
            >
              {t("profile.general.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <PlanComparisonSection />

      <FamilyPlanSection />

      <GiftPremiumDrawer
        open={giftDrawerOpen}
        onOpenChange={setGiftDrawerOpen}
      />
    </div>
  );
};

export default PremiumTab;
