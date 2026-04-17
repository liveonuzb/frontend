import React from "react";
import { get } from "lodash";
import {
  ArrowLeftIcon,
  CircleDollarSignIcon,
  GiftIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import PremiumPlanOption, {
  formatPremiumPrice,
  getShortestPremiumPlan,
} from "@/components/premium/plan-option.jsx";
import { api } from "@/hooks/api/use-api";
import usePremium from "@/hooks/app/use-premium";
import { getRequestErrorMessage } from "@/hooks/app/use-profile-settings";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = (t) => [
  {
    code: "MULTI",
    label: t("profile.premium.payment.multiCard"),
    description: t("profile.premium.payment.multiCardDesc"),
  },
];

const STEPS = {
  RECIPIENT: "recipient",
  PLAN: "plan",
  PAYMENT: "payment",
  REVIEW: "review",
};

const MIN_IDENTIFIER_LENGTH = 3;

const resolveInitials = (name) => {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const resolveRecipientName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.name ||
  user?.username ||
  user?.email ||
  user?.phone ||
  "Foydalanuvchi";

const resolveRecipientSubtitle = (user) =>
  user?.username
    ? `@${String(user.username).replace(/^@/, "")}`
    : user?.email || user?.phone || "";

const resolveRecipientIdentifier = (user) =>
  user?.email || user?.phone || user?.username || "";

const resolveRecipientInputValue = (user) =>
  resolveRecipientSubtitle(user) || resolveRecipientIdentifier(user) || resolveRecipientName(user);

const unwrapCandidateItems = (response) =>
  get(response, "data.data.items", get(response, "data.items", []));

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

const RecipientSummaryCard = ({
  recipient,
  title,
  subtitle,
  selectedLabel,
  changeLabel,
  onChange,
}) => (
  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
    <div className="flex items-center gap-3">
      {recipient ? (
        <Avatar className="size-12">
          <AvatarImage
            src={recipient.avatarUrl || recipient.avatar}
            alt={title}
          />
          <AvatarFallback>{resolveInitials(title)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-muted-foreground">
          @
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{title}</p>
          {selectedLabel ? (
            <Badge className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-semibold text-black hover:bg-amber-400">
              {selectedLabel}
            </Badge>
          ) : null}
        </div>
        {subtitle ? (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {onChange ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl text-xs"
          onClick={onChange}
        >
          {changeLabel}
        </Button>
      ) : null}
    </div>
  </div>
);

const GiftStepDrawer = ({
  stepKey,
  activeStep,
  stepSequence,
  open,
  onClose,
  onBack,
  title,
  description,
  counterLabel,
  children,
  footer,
}) => {
  const currentStepIndex = stepSequence.indexOf(stepKey);

  return (
    <Drawer
      direction="bottom"
      open={open && activeStep === stepKey}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DrawerContent>
        <DrawerHeader className="relative border-b border-white/10 pb-4 pt-5 text-center">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 size-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
              onClick={onBack}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
          ) : null}

          <div className="w-full px-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {counterLabel}
            </p>

            <div className="mt-3 flex items-center justify-center gap-1.5">
              {stepSequence.map((step, index) => (
                <span
                  key={step}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === currentStepIndex
                      ? "w-8 bg-amber-400"
                      : index < currentStepIndex
                        ? "w-5 bg-amber-400/55"
                        : "w-5 bg-white/10",
                  )}
                />
              ))}
            </div>

            <DrawerTitle className="mt-4 text-2xl font-semibold tracking-tight">
              {title}
            </DrawerTitle>
            <DrawerDescription className="mt-2 text-sm text-muted-foreground">
              {description}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        {children}
        {footer}
      </DrawerContent>
    </Drawer>
  );
};

export default function GiftPremiumDrawer({
  open,
  onOpenChange,
  recipientUser,
}) {
  const { t } = useTranslation();
  const currentLocale = t("common.locale", "uz-UZ");
  const currencyLabel = t("profile.coach.currency");
  const paymentMethods = React.useMemo(() => PAYMENT_METHODS(t), [t]);
  const initialStep = recipientUser ? STEPS.PLAN : STEPS.RECIPIENT;
  const stepSequence = React.useMemo(
    () =>
      recipientUser
        ? [STEPS.PLAN, STEPS.PAYMENT, STEPS.REVIEW]
        : [STEPS.RECIPIENT, STEPS.PLAN, STEPS.PAYMENT, STEPS.REVIEW],
    [recipientUser],
  );
  const { plans, giftPremium, isGifting } = usePremium();

  const [activeStep, setActiveStep] = React.useState(initialStep);
  const [recipientInput, setRecipientInput] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedRecipient, setSelectedRecipient] = React.useState(
    recipientUser || null,
  );
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState(
    paymentMethods[0].code,
  );
  const [promoCode, setPromoCode] = React.useState("");
  const [note, setNote] = React.useState("");

  const searchTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setActiveStep(initialStep);
    setRecipientInput(recipientUser ? resolveRecipientInputValue(recipientUser) : "");
    setSearchResults([]);
    setSelectedRecipient(recipientUser || null);
    setSelectedPlan(null);
    setSelectedPaymentMethod(paymentMethods[0].code);
    setPromoCode("");
    setNote("");
  }, [initialStep, open, paymentMethods, recipientUser]);

  React.useEffect(() => {
    if (!selectedPlan && plans.length > 0) {
      setSelectedPlan(plans[0]?.code ?? null);
    }
  }, [plans, selectedPlan]);

  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!open || activeStep !== STEPS.RECIPIENT || selectedRecipient) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    const query = recipientInput.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await api.get("/users/me/friends/candidates", {
          params: { q: query },
        });
        setSearchResults(unwrapCandidateItems(response));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [activeStep, open, recipientInput, selectedRecipient]);

  const activePlan = React.useMemo(
    () => plans.find((plan) => plan.code === selectedPlan) ?? plans[0] ?? null,
    [plans, selectedPlan],
  );
  const shortestPlan = React.useMemo(
    () => getShortestPremiumPlan(plans),
    [plans],
  );
  const selectedRecipientName = selectedRecipient
    ? resolveRecipientName(selectedRecipient)
    : recipientInput.trim();
  const selectedRecipientSubtitle = selectedRecipient
    ? resolveRecipientSubtitle(selectedRecipient)
    : t("profile.premium.gift.recipient.manualLabel");
  const recipientIdentifier =
    resolveRecipientIdentifier(selectedRecipient) || recipientInput.trim();
  const hasManualRecipient =
    !selectedRecipient && recipientInput.trim().length >= MIN_IDENTIFIER_LENGTH;
  const canContinueRecipient = Boolean(selectedRecipient) || hasManualRecipient;

  const closeDrawer = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const goToNextStep = React.useCallback(() => {
    const currentIndex = stepSequence.indexOf(activeStep);
    const nextStep = stepSequence[currentIndex + 1];

    if (nextStep) {
      setActiveStep(nextStep);
    }
  }, [activeStep, stepSequence]);

  const goToPreviousStep = React.useCallback(() => {
    const currentIndex = stepSequence.indexOf(activeStep);
    const previousStep = stepSequence[currentIndex - 1];

    if (previousStep) {
      setActiveStep(previousStep);
    }
  }, [activeStep, stepSequence]);

  const handleRecipientInputChange = React.useCallback(
    (event) => {
      const nextValue = event.target.value;
      setRecipientInput(nextValue);

      if (
        selectedRecipient &&
        nextValue !== resolveRecipientInputValue(selectedRecipient)
      ) {
        setSelectedRecipient(null);
      }
    },
    [selectedRecipient],
  );

  const handleSelectRecipient = React.useCallback((user) => {
    setSelectedRecipient(user);
    setRecipientInput(resolveRecipientInputValue(user));
    setSearchResults([]);
  }, []);

  const handleClearSelectedRecipient = React.useCallback(() => {
    setSelectedRecipient(null);
    setRecipientInput("");
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!activePlan?.code || !recipientIdentifier) {
      return;
    }

    try {
      const data = await giftPremium({
        planSlug: activePlan.code,
        paymentMethod: selectedPaymentMethod,
        recipientIdentifier,
        promoCode: promoCode.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (data.mode === "redirect" && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      toast.success(
        t("profile.premium.gift.toasts.success", {
          name: selectedRecipientName,
        }),
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          t("profile.premium.gift.toasts.error"),
        ),
      );
    }
  }, [
    activePlan,
    giftPremium,
    note,
    onOpenChange,
    promoCode,
    recipientIdentifier,
    selectedPaymentMethod,
    selectedRecipientName,
    t,
  ]);

  return (
    <>
      <GiftStepDrawer
        stepKey={STEPS.RECIPIENT}
        activeStep={activeStep}
        stepSequence={stepSequence}
        open={open}
        onClose={closeDrawer}
        title={t("profile.premium.gift.recipient.title")}
        description={t("profile.premium.gift.recipient.description")}
        counterLabel={t("profile.premium.gift.stepCounter", {
          current: stepSequence.indexOf(STEPS.RECIPIENT) + 1,
          total: stepSequence.length,
        })}
        footer={
          <DrawerFooter className="border-t border-white/10 p-4">
            <Button
              type="button"
              className="h-12 rounded-2xl bg-amber-400 text-black hover:bg-amber-300"
              disabled={!canContinueRecipient}
              onClick={goToNextStep}
            >
              {t("profile.premium.gift.actions.next")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={closeDrawer}
            >
              {t("profile.premium.gift.actions.cancel")}
            </Button>
          </DrawerFooter>
        }
      >
        <DrawerBody className="pb-4 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="premium-gift-recipient"
                className="ml-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t("profile.premium.gift.recipient.inputLabel")}
              </Label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                <Input
                  id="premium-gift-recipient"
                  value={recipientInput}
                  onChange={handleRecipientInputChange}
                  placeholder={t("profile.premium.gift.recipient.placeholder")}
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-10 shadow-none focus-visible:ring-1 focus-visible:ring-amber-300/40"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("profile.premium.gift.recipient.helper")}
              </p>
            </div>

            {selectedRecipient ? (
              <RecipientSummaryCard
                recipient={selectedRecipient}
                title={selectedRecipientName}
                subtitle={selectedRecipientSubtitle}
                selectedLabel={t("profile.premium.selected")}
                changeLabel={t("profile.premium.gift.recipient.change")}
                onChange={handleClearSelectedRecipient}
              />
            ) : hasManualRecipient ? (
              <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] p-4">
                <p className="font-medium">
                  {t("profile.premium.gift.recipient.manualTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("profile.premium.gift.recipient.manualDescription", {
                    value: recipientInput.trim(),
                  })}
                </p>
              </div>
            ) : null}

            {isSearching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                {t("profile.premium.gift.recipient.searching")}
              </div>
            ) : null}

            {!selectedRecipient && !isSearching && searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => {
                  const name = resolveRecipientName(user);
                  const subtitle = resolveRecipientSubtitle(user);
                  const isActive = selectedRecipient?.id === user.id;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-3 text-left transition-colors",
                        isActive
                          ? "border-amber-400/60 bg-amber-500/[0.08]"
                          : "hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                      onClick={() => handleSelectRecipient(user)}
                    >
                      <Avatar className="size-11">
                        <AvatarImage
                          src={user.avatarUrl || user.avatar}
                          alt={name}
                        />
                        <AvatarFallback>{resolveInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        {subtitle ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold",
                          isActive
                            ? "bg-amber-400 text-black hover:bg-amber-400"
                            : "bg-white/10 text-muted-foreground hover:bg-white/10",
                        )}
                      >
                        {isActive
                          ? t("profile.premium.selected")
                          : t("profile.premium.gift.recipient.pick")}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!selectedRecipient &&
            !isSearching &&
            recipientInput.trim().length >= 2 &&
            searchResults.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">
                {t("profile.premium.gift.recipient.noResults")}
              </p>
            ) : null}
          </div>
        </DrawerBody>
      </GiftStepDrawer>

      <GiftStepDrawer
        stepKey={STEPS.PLAN}
        activeStep={activeStep}
        stepSequence={stepSequence}
        open={open}
        onClose={closeDrawer}
        onBack={stepSequence[0] === STEPS.PLAN ? null : goToPreviousStep}
        title={t("profile.premium.gift.plan.title")}
        description={t("profile.premium.gift.plan.description", {
          name: selectedRecipientName,
        })}
        counterLabel={t("profile.premium.gift.stepCounter", {
          current: stepSequence.indexOf(STEPS.PLAN) + 1,
          total: stepSequence.length,
        })}
        footer={
          <DrawerFooter className="border-t border-white/10 p-4">
            <Button
              type="button"
              className="h-12 rounded-2xl bg-amber-400 text-black hover:bg-amber-300"
              disabled={!activePlan}
              onClick={goToNextStep}
            >
              {t("profile.premium.gift.actions.next")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={
                stepSequence[0] === STEPS.PLAN ? closeDrawer : goToPreviousStep
              }
            >
              {stepSequence[0] === STEPS.PLAN
                ? t("profile.premium.gift.actions.cancel")
                : t("profile.premium.gift.actions.back")}
            </Button>
          </DrawerFooter>
        }
      >
        <DrawerBody className="pb-4 pt-4">
          <div className="space-y-4">
            <RecipientSummaryCard
              recipient={selectedRecipient}
              title={selectedRecipientName}
              subtitle={selectedRecipientSubtitle}
            />

            <div className="space-y-3">
              {plans.map((plan) => (
                <PremiumPlanOption
                  key={plan.code}
                  plan={plan}
                  locale={currentLocale}
                  basePlan={shortestPlan}
                  isSelected={selectedPlan === plan.code}
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
              ))}

              {!plans.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("profile.premium.noPlans")}
                </p>
              ) : null}
            </div>
          </div>
        </DrawerBody>
      </GiftStepDrawer>

      <GiftStepDrawer
        stepKey={STEPS.PAYMENT}
        activeStep={activeStep}
        stepSequence={stepSequence}
        open={open}
        onClose={closeDrawer}
        onBack={goToPreviousStep}
        title={t("profile.premium.gift.payment.title")}
        description={t("profile.premium.gift.payment.description")}
        counterLabel={t("profile.premium.gift.stepCounter", {
          current: stepSequence.indexOf(STEPS.PAYMENT) + 1,
          total: stepSequence.length,
        })}
        footer={
          <DrawerFooter className="border-t border-white/10 p-4">
            <Button
              type="button"
              className="h-12 rounded-2xl bg-amber-400 text-black hover:bg-amber-300"
              onClick={goToNextStep}
            >
              {t("profile.premium.gift.actions.next")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={goToPreviousStep}
            >
              {t("profile.premium.gift.actions.back")}
            </Button>
          </DrawerFooter>
        }
      >
        <DrawerBody className="pb-4 pt-4">
          <div className="space-y-5">
            <RecipientSummaryCard
              recipient={selectedRecipient}
              title={selectedRecipientName}
              subtitle={selectedRecipientSubtitle}
            />

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
                {t("profile.premium.gift.payment.methodTitle")}
              </p>
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <PaymentMethodOption
                    key={method.code}
                    method={method}
                    isSelected={selectedPaymentMethod === method.code}
                    onClick={() => setSelectedPaymentMethod(method.code)}
                    selectedLabel={t("profile.premium.selected")}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="premium-gift-promo"
                className="ml-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t("profile.premium.gift.payment.promoLabel")}
              </Label>
              <Input
                id="premium-gift-promo"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder={t("profile.premium.gift.payment.promoPlaceholder")}
                className="h-12 rounded-2xl border-white/10 bg-white/[0.03] shadow-none focus-visible:ring-1 focus-visible:ring-amber-300/40"
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.premium.gift.payment.promoHint")}
              </p>
            </div>
          </div>
        </DrawerBody>
      </GiftStepDrawer>

      <GiftStepDrawer
        stepKey={STEPS.REVIEW}
        activeStep={activeStep}
        stepSequence={stepSequence}
        open={open}
        onClose={closeDrawer}
        onBack={goToPreviousStep}
        title={t("profile.premium.gift.review.title")}
        description={t("profile.premium.gift.review.description")}
        counterLabel={t("profile.premium.gift.stepCounter", {
          current: stepSequence.indexOf(STEPS.REVIEW) + 1,
          total: stepSequence.length,
        })}
        footer={
          <DrawerFooter className="border-t border-white/10 p-4">
            <Button
              type="button"
              className="h-12 rounded-2xl bg-amber-400 text-black hover:bg-amber-300"
              disabled={!activePlan || !recipientIdentifier || isGifting}
              onClick={handleSubmit}
            >
              {isGifting ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <GiftIcon className="mr-2 size-4" />
              )}
              {t("profile.premium.gift.actions.confirm")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              onClick={goToPreviousStep}
            >
              {t("profile.premium.gift.actions.back")}
            </Button>
          </DrawerFooter>
        }
      >
        <DrawerBody className="pb-4 pt-4">
          <div className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {t("profile.premium.gift.review.summaryTitle")}
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    {t("profile.premium.gift.review.recipientLabel")}
                  </span>
                  <div className="max-w-[60%] text-right">
                    <p className="font-medium">{selectedRecipientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRecipientSubtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    {t("profile.premium.gift.review.planLabel")}
                  </span>
                  <div className="max-w-[60%] text-right">
                    <p className="font-medium">{activePlan?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activePlan?.period}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    {t("profile.premium.gift.review.paymentMethodLabel")}
                  </span>
                  <p className="font-medium">
                    {paymentMethods.find(
                      (method) => method.code === selectedPaymentMethod,
                    )?.label || selectedPaymentMethod}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    {t("profile.premium.gift.review.priceLabel")}
                  </span>
                  <p className="text-lg font-semibold">
                    {formatPremiumPrice(activePlan?.price, currentLocale)}{" "}
                    {currencyLabel}
                  </p>
                </div>

                {promoCode.trim() ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {t("profile.premium.gift.review.promoCodeLabel")}
                      </span>
                      <span className="font-medium">{promoCode.trim()}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("profile.premium.gift.review.promoHint")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="premium-gift-note"
                className="ml-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t("profile.premium.gift.review.messageLabel")}
              </Label>
              <Textarea
                id="premium-gift-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("profile.premium.gift.review.messagePlaceholder")}
                className="min-h-[100px] rounded-2xl border-white/10 bg-white/[0.03] shadow-none focus-visible:ring-1 focus-visible:ring-amber-300/40"
                maxLength={255}
              />
            </div>
          </div>
        </DrawerBody>
      </GiftStepDrawer>
    </>
  );
}
