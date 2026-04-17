import React from "react";
import _ from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2Icon,
  CreditCardIcon,
  PencilLineIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import {
  useCoachPaymentProfile,
  useSaveCoachPaymentProfile,
} from "@/hooks/app/use-coach";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const getErrorMessage = (error, fallback) =>
  _.get(error, "response.data.message") || _.get(error, "message") || fallback;

const getCardDigits = (value = "") => String(value).replace(/\D/g, "");

const createCardId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createEmptyCardDraft = () => ({
  id: "",
  maskedCard: "",
  cardHolder: "",
  bankName: "",
  displayLabel: "",
});

const formatMaskedCardDisplay = (value = "") => {
  const normalized = _.trim(String(value || ""));
  if (!normalized) {
    return "";
  }

  const digits = getCardDigits(normalized);
  const explicitMaskLength = normalized.replace(/[^*]/g, "").length;

  if (digits.length >= 12) {
    const maskLength = digits.length - 8;
    const maskChunks = [];
    for (let index = 0; index < maskLength; index += 4) {
      maskChunks.push("*".repeat(Math.min(4, maskLength - index)));
    }
    return [digits.slice(0, 4), ...maskChunks, digits.slice(-4)].join(" ");
  }

  if (digits.length >= 8) {
    const maskLength = Math.max(4, explicitMaskLength || 4);
    const maskChunks = [];
    for (let index = 0; index < maskLength; index += 4) {
      maskChunks.push("*".repeat(Math.min(4, maskLength - index)));
    }
    return [digits.slice(0, 4), ...maskChunks, digits.slice(-4)].join(" ");
  }

  return normalized;
};

const normalizeCardInput = (value = "") =>
  String(value).replace(/[^\d*\s-]/g, "").slice(0, 32);

const normalizeStoredCard = (card) => {
  const maskedCard = formatMaskedCardDisplay(_.get(card, "maskedCard", ""));
  if (!maskedCard) {
    return null;
  }

  return {
    id: _.get(card, "id") || createCardId(),
    maskedCard,
    cardHolder: _.trim(_.get(card, "cardHolder", "")),
    bankName: _.trim(_.get(card, "bankName", "")),
    displayLabel: _.trim(_.get(card, "displayLabel", "")),
  };
};

const createProfileState = (profile) => {
  const cards = _.compact(
    (_.get(profile, "cards", []) || []).map((card) => normalizeStoredCard(card)),
  );
  const legacyCard = normalizeStoredCard({
    id:
      _.get(profile, "activeCardId") ||
      (_.get(profile, "id") ? `legacy-${_.get(profile, "id")}` : undefined),
    maskedCard: _.get(profile, "maskedCard") || _.get(profile, "cardNumberMasked"),
    cardHolder: _.get(profile, "cardHolder"),
    bankName: _.get(profile, "bankName"),
    displayLabel: _.get(profile, "displayLabel"),
  });
  const mergedCards = cards.length > 0 ? cards : legacyCard ? [legacyCard] : [];
  const requestedActiveCardId = _.get(profile, "activeCardId", "");
  const activeCardId =
    mergedCards.find((card) => card.id === requestedActiveCardId)?.id ||
    _.get(mergedCards, "[0].id", null);

  return {
    paymentInstructions: _.get(profile, "paymentInstructions", ""),
    cards: mergedCards,
    activeCardId,
  };
};

const resolveActiveCard = (cards = [], activeCardId = null) =>
  cards.find((card) => card.id === activeCardId) || cards[0] || null;

const buildCardFromDraft = (cardDraft) => {
  const maskedCard = formatMaskedCardDisplay(cardDraft.maskedCard);
  if (getCardDigits(maskedCard).length < 8) {
    return null;
  }

  return {
    id: cardDraft.id || createCardId(),
    maskedCard,
    cardHolder: _.trim(cardDraft.cardHolder),
    bankName: _.trim(cardDraft.bankName),
    displayLabel: _.trim(cardDraft.displayLabel),
  };
};

const mergeDraftCardIntoProfile = (profileDraft, cardDraft) => {
  const nextCard = buildCardFromDraft(cardDraft);
  if (!nextCard) {
    return null;
  }

  const hasExistingCard = profileDraft.cards.some((card) => card.id === nextCard.id);
  const cards = hasExistingCard
    ? profileDraft.cards.map((card) => (card.id === nextCard.id ? nextCard : card))
    : [...profileDraft.cards, nextCard];

  return {
    ...profileDraft,
    cards,
    activeCardId: profileDraft.activeCardId || nextCard.id,
  };
};

export default function GlobalPaymentDetailsCard({
  buttonOnly = false,
  buttonSize = "default",
  buttonClassName = "",
}) {
  const { t } = useTranslation();
  const { profile } = useCoachPaymentProfile();
  const { mutateAsync: savePaymentProfile, isPending: isSavingCard } =
    useSaveCoachPaymentProfile();

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isCardDrawerOpen, setIsCardDrawerOpen] = React.useState(false);
  const [profileDraft, setProfileDraft] = React.useState(() =>
    createProfileState(null),
  );
  const [cardDraft, setCardDraft] = React.useState(createEmptyCardDraft);
  const [editingCardId, setEditingCardId] = React.useState("");

  const resetCardDraft = React.useCallback(() => {
    setCardDraft(createEmptyCardDraft());
    setEditingCardId("");
  }, []);

  React.useEffect(() => {
    if (!isDrawerOpen && !isCardDrawerOpen) {
      setProfileDraft(createProfileState(profile));
      resetCardDraft();
    }
  }, [isCardDrawerOpen, isDrawerOpen, profile, resetCardDraft]);

  const activeCard = resolveActiveCard(
    profileDraft.cards,
    profileDraft.activeCardId,
  );
  const hasPaymentDetails = Boolean(
    activeCard || _.trim(profileDraft.paymentInstructions),
  );
  const hasCardDraft = Boolean(
    _.trim(cardDraft.maskedCard) ||
      _.trim(cardDraft.cardHolder) ||
      _.trim(cardDraft.bankName) ||
      _.trim(cardDraft.displayLabel),
  );

  const handleOpenDrawer = () => {
    setProfileDraft(createProfileState(profile));
    resetCardDraft();
    setIsDrawerOpen(true);
  };

  const handleDrawerChange = (open) => {
    setIsDrawerOpen(open);
    if (!open) {
      setIsCardDrawerOpen(false);
      setProfileDraft(createProfileState(profile));
      resetCardDraft();
    }
  };

  const handleCardDrawerChange = (open) => {
    setIsCardDrawerOpen(open);
    if (!open) {
      resetCardDraft();
    }
  };

  const handleOpenNewCardDrawer = () => {
    resetCardDraft();
    setIsCardDrawerOpen(true);
  };

  const buildProfilePayload = React.useCallback(
    (nextProfileDraft, { includeDraftInstructions = true } = {}) => ({
      paymentInstructions:
        _.trim(
          includeDraftInstructions
            ? nextProfileDraft.paymentInstructions
            : _.get(profile, "paymentInstructions", ""),
        ) || undefined,
      activeCardId: nextProfileDraft.activeCardId || undefined,
      cards: nextProfileDraft.cards.map((card) => ({
        id: card.id,
        maskedCard: card.maskedCard,
        cardHolder: _.trim(card.cardHolder) || undefined,
        bankName: _.trim(card.bankName) || undefined,
        displayLabel: _.trim(card.displayLabel) || undefined,
        isActive: card.id === nextProfileDraft.activeCardId,
      })),
    }),
    [profile],
  );

  const persistProfileDraft = React.useCallback(
    async (nextProfileDraft, options = {}) => {
      await savePaymentProfile({
        url: "/coach/payment-profile",
        attributes: buildProfilePayload(nextProfileDraft, options),
      });
      setProfileDraft(nextProfileDraft);
    },
    [buildProfilePayload, savePaymentProfile],
  );

  const handleSaveCard = async (event) => {
    event.preventDefault();

    const nextProfileDraft = mergeDraftCardIntoProfile(profileDraft, cardDraft);
    if (!nextProfileDraft) {
      toast.error(t("coach.commerce.telegram.validation.cardRequired"));
      return;
    }

    try {
      await persistProfileDraft(nextProfileDraft, {
        includeDraftInstructions: false,
      });
      toast.success(t("coach.commerce.telegram.cardItemSaved"));
      handleCardDrawerChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, t("coach.commerce.telegram.error")));
    }
  };

  const handleEditCard = (card) => {
    setEditingCardId(card.id);
    setCardDraft({
      id: card.id,
      maskedCard: card.maskedCard,
      cardHolder: card.cardHolder || "",
      bankName: card.bankName || "",
      displayLabel: card.displayLabel || "",
    });
    setIsCardDrawerOpen(true);
  };

  const handleDeleteCard = async (cardId) => {
    const cards = profileDraft.cards.filter((card) => card.id !== cardId);
    const nextProfileDraft = {
      ...profileDraft,
      cards,
      activeCardId:
        profileDraft.activeCardId === cardId
          ? _.get(cards, "[0].id", null)
          : profileDraft.activeCardId,
    };

    try {
      await persistProfileDraft(nextProfileDraft, {
        includeDraftInstructions: false,
      });
      if (editingCardId === cardId) {
        handleCardDrawerChange(false);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t("coach.commerce.telegram.error")));
    }
  };

  const handleSetActiveCard = async (cardId) => {
    const nextProfileDraft = {
      ...profileDraft,
      activeCardId: cardId,
    };

    try {
      await persistProfileDraft(nextProfileDraft, {
        includeDraftInstructions: false,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, t("coach.commerce.telegram.error")));
    }
  };

  const handleSaveProfile = async () => {
    try {
      await persistProfileDraft(profileDraft, {
        includeDraftInstructions: true,
      });
      toast.success(t("coach.commerce.telegram.cardSaved"));
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, t("coach.commerce.telegram.error")));
    }
  };

  const triggerButton = (
    <Button
      type="button"
      size={buttonSize}
      onClick={handleOpenDrawer}
      className={buttonClassName || "gap-2 rounded-2xl px-5"}
    >
      <PlusIcon className="size-4" />
      {buttonOnly
        ? t("coach.commerce.telegram.actions.addPaymentDetails")
        : hasPaymentDetails
          ? t("coach.commerce.telegram.actions.editPaymentDetails")
          : t("coach.commerce.telegram.actions.addPaymentDetails")}
    </Button>
  );

  return (
    <>
      {buttonOnly ? (
        triggerButton
      ) : (
        <Card className="border-border/60 bg-card/70 shadow-xl backdrop-blur-sm">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCardIcon className="size-5" />
                </div>
                <div>
                  <CardTitle>{t("coach.commerce.telegram.paymentTitle")}</CardTitle>
                  <CardDescription className="mt-1">
                    {t("coach.commerce.telegram.paymentDescription")}
                  </CardDescription>
                </div>
              </div>
              {triggerButton}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={hasPaymentDetails ? "secondary" : "outline"}
                className="rounded-full px-3 py-1"
              >
                {hasPaymentDetails
                  ? t("coach.commerce.telegram.status.configured")
                  : t("coach.commerce.telegram.status.empty")}
              </Badge>
              {activeCard ? (
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {activeCard.maskedCard}
                </Badge>
              ) : null}
              {activeCard?.displayLabel ? (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {activeCard.displayLabel}
                </Badge>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("coach.commerce.telegram.summary.activeCard")}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {activeCard?.maskedCard ||
                    t("coach.commerce.telegram.summary.notSet")}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("coach.commerce.telegram.summary.cardHolder")}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {activeCard?.cardHolder ||
                    t("coach.commerce.telegram.summary.notSet")}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("coach.commerce.telegram.summary.bankName")}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {activeCard?.bankName ||
                    t("coach.commerce.telegram.summary.notSet")}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("coach.commerce.telegram.summary.savedCards")}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {profileDraft.cards.length}
                </p>
              </div>
            </div>

            {profileDraft.cards.length > 0 ? (
              <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t("coach.commerce.telegram.cardsListTitle")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileDraft.cards.map((card) => (
                    <Badge
                      key={card.id}
                      variant={
                        card.id === profileDraft.activeCardId ? "secondary" : "outline"
                      }
                      className="rounded-full px-3 py-1"
                    >
                      {card.maskedCard}
                      {card.id === profileDraft.activeCardId
                        ? ` · ${t("coach.commerce.telegram.status.activeCard")}`
                        : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground/90">
                    {t("coach.commerce.telegram.summary.instructions")}
                  </p>
                  <p className="mt-1 leading-6">
                    {profileDraft.paymentInstructions ||
                      t("coach.commerce.telegram.securityHint")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer
        open={isDrawerOpen}
        onOpenChange={handleDrawerChange}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:max-w-2xl">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>{t("coach.commerce.telegram.drawerTitle")}</DrawerTitle>
            <DrawerDescription>
              {t("coach.commerce.telegram.drawerDescription")}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-6 px-6 pb-2">
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground/90">
                    {t("coach.commerce.telegram.summary.instructions")}
                  </p>
                  <p className="mt-1 leading-6">
                    {t("coach.commerce.telegram.securityHint")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach-payment-instructions">
                {t("coach.commerce.telegram.fields.paymentInstructions")}
              </Label>
              <Textarea
                id="coach-payment-instructions"
                value={profileDraft.paymentInstructions}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    paymentInstructions: event.target.value,
                  }))
                }
                placeholder={t(
                  "coach.commerce.telegram.placeholders.paymentInstructions",
                )}
                rows={4}
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {t("coach.commerce.telegram.cardsListTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("coach.commerce.telegram.cardsListDescription")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-2xl"
                  onClick={handleOpenNewCardDrawer}
                >
                  <PlusIcon className="size-4" />
                  {t("coach.commerce.telegram.actions.addCard")}
                </Button>
              </div>

              {profileDraft.cards.length > 0 ? (
                <div className="space-y-3">
                  {profileDraft.cards.map((card) => {
                    const isActive = card.id === profileDraft.activeCardId;
                    return (
                      <div
                        key={card.id}
                        className="rounded-2xl border border-border/70 bg-card/70 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-foreground">
                                {card.maskedCard}
                              </p>
                              {isActive ? (
                                <Badge variant="secondary" className="rounded-full">
                                  {t("coach.commerce.telegram.status.activeCard")}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {card.displayLabel ||
                                card.bankName ||
                                t("coach.commerce.telegram.summary.notSet")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {card.cardHolder ||
                                t("coach.commerce.telegram.summary.notSet")}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {!isActive ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSavingCard}
                                onClick={() => handleSetActiveCard(card.id)}
                              >
                                {t("coach.commerce.telegram.actions.setActiveCard")}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={isSavingCard}
                              onClick={() => handleEditCard(card)}
                            >
                              <PencilLineIcon className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={isSavingCard}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-5 text-sm text-muted-foreground">
                  {t("coach.commerce.telegram.cardsEmpty")}
                </div>
              )}
            </div>
          </DrawerBody>

          <DrawerFooter className="px-6 py-4">
            <Button
              type="button"
              disabled={isSavingCard}
              onClick={handleSaveProfile}
              className="gap-2 rounded-2xl px-5"
            >
              <CheckCircle2Icon className="size-4" />
              {t("coach.commerce.telegram.actions.savePaymentDetails")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => handleDrawerChange(false)}>
              {t("coach.commerce.telegram.actions.closeDrawer")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isCardDrawerOpen}
        onOpenChange={handleCardDrawerChange}
        direction="bottom"
      >
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:max-w-xl">
          <DrawerHeader className="px-6 py-5 text-left">
            <DrawerTitle>
              {editingCardId
                ? t("coach.commerce.telegram.cardEditor.editTitle")
                : t("coach.commerce.telegram.cardEditor.addTitle")}
            </DrawerTitle>
            <DrawerDescription>
              {t("coach.commerce.telegram.cardEditor.description")}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-4 px-6 pb-2">
            <div className="space-y-2">
              <Label htmlFor="coach-payment-masked-card">
                {t("coach.commerce.telegram.fields.maskedCard")}
              </Label>
              <Input
                id="coach-payment-masked-card"
                value={cardDraft.maskedCard}
                onChange={(event) =>
                  setCardDraft((current) => ({
                    ...current,
                    maskedCard: normalizeCardInput(event.target.value),
                  }))
                }
                placeholder="8600 0000 0000 1234"
                className="rounded-2xl"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coach-payment-holder">
                  {t("coach.commerce.telegram.fields.cardHolder")}
                </Label>
                <Input
                  id="coach-payment-holder"
                  value={cardDraft.cardHolder}
                  onChange={(event) =>
                    setCardDraft((current) => ({
                      ...current,
                      cardHolder: event.target.value,
                    }))
                  }
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coach-payment-bank">
                  {t("coach.commerce.telegram.fields.bankName")}
                </Label>
                <Input
                  id="coach-payment-bank"
                  value={cardDraft.bankName}
                  onChange={(event) =>
                    setCardDraft((current) => ({
                      ...current,
                      bankName: event.target.value,
                    }))
                  }
                  className="rounded-2xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coach-payment-label">
                {t("coach.commerce.telegram.fields.displayLabel")}
              </Label>
              <Input
                id="coach-payment-label"
                value={cardDraft.displayLabel}
                onChange={(event) =>
                  setCardDraft((current) => ({
                    ...current,
                    displayLabel: event.target.value,
                  }))
                }
                className="rounded-2xl"
              />
            </div>
          </DrawerBody>

          <DrawerFooter className="px-6 py-4">
            <Button
              type="button"
              disabled={isSavingCard}
              onClick={handleSaveCard}
              className="gap-2 rounded-2xl"
            >
              <CheckCircle2Icon className="size-4" />
              {editingCardId
                ? t("coach.commerce.telegram.actions.updateCard")
                : t("coach.commerce.telegram.actions.saveCard")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSavingCard}
              onClick={() => handleCardDrawerChange(false)}
            >
              {hasCardDraft || editingCardId
                ? t("coach.commerce.telegram.actions.cancelEdit")
                : t("coach.commerce.telegram.actions.closeDrawer")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
