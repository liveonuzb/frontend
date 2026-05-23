import React from "react";
import { get, isArray, join, filter, toNumber, trim } from "lodash";
import { GiftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import FormDrawerShell from "./form-drawer-shell.jsx";

const DEFAULT_AI_CREDITS = 300;
const MIN_AI_CREDITS = 1;
const MAX_AI_CREDITS = 10000;

const formatPrice = (price) => {
  if (!price) return "Bepul";
  return `${(price / 100).toLocaleString("uz-UZ")} so'm`;
};

const typeLabelMap = {
  INDIVIDUAL: "Individual",
  FAMILY: "Oilaviy",
};

const GiftPremiumDrawer = ({
  user,
  open,
  onOpenChange,
  queryKey = ["admin-users"],
  listKey,
  onGifted,
}) => {
  const [selectedSlug, setSelectedSlug] = React.useState("");
  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [daysOverride, setDaysOverride] = React.useState("");
  const [aiCredits, setAiCredits] = React.useState(String(DEFAULT_AI_CREDITS));
  const [note, setNote] = React.useState("");

  const giftMutation = usePostQuery({ queryKey, listKey });

  const resetForm = React.useCallback(() => {
    setSelectedSlug("");
    setSelectedPlan(null);
    setDaysOverride("");
    setAiCredits(String(DEFAULT_AI_CREDITS));
    setNote("");
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm],
  );

  const displayName =
    trim(`${get(user, "firstName", "")} ${get(user, "lastName", "")}`) ||
    get(user, "email") ||
    "Foydalanuvchi";

  const handleSubmit = React.useCallback(async () => {
    if (!selectedSlug) {
      toast.error("Planni tanlang");
      return;
    }

    const aiCreditsValue = toNumber(aiCredits);
    if (
      !Number.isInteger(aiCreditsValue) ||
      aiCreditsValue < MIN_AI_CREDITS ||
      aiCreditsValue > MAX_AI_CREDITS
    ) {
      toast.error("AI kredit miqdori 1 dan 10000 gacha bo'lishi kerak");
      return;
    }

    try {
      await giftMutation.mutateAsync({
        url: `/admin/users/${user.id}/gift-premium`,
        attributes: {
          planSlug: selectedSlug,
          days: daysOverride ? toNumber(daysOverride) : undefined,
          aiCredits: aiCreditsValue,
          note: trim(note) || undefined,
        },
      });
      toast.success(
        `${user.firstName || user.email || "Foydalanuvchi"}ga premium sovg'a qilindi`,
      );
      await onGifted?.();
      handleOpenChange(false);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Premium sovg'a qilib bo'lmadi",
      );
    }
  }, [
    selectedSlug,
    daysOverride,
    aiCredits,
    note,
    user,
    giftMutation,
    onGifted,
    handleOpenChange,
  ]);

  return (
    <FormDrawerShell
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <span className="flex items-center gap-2">
          <GiftIcon className="size-5 text-amber-500" />
          Premium sovg'a qilish
        </span>
      }
      description={`"${displayName}" foydalanuvchisiga premium obuna sovg'a qiling.`}
      footer={
        <>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
          >
            Bekor qilish
          </Button>
          <Button
            className="flex-1"
            disabled={!selectedSlug || giftMutation.isPending}
            onClick={handleSubmit}
          >
            {giftMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <GiftIcon className="size-4" />
            )}
            Sovg'a qilish
          </Button>
        </>
      }
    >
      {/* Plan selection */}
      <div className="space-y-2">
        <Label>Plan</Label>
        <OptionDrawerPicker
          value={selectedSlug}
          onChange={(nextSlug) => setSelectedSlug(nextSlug)}
          onOptionChange={setSelectedPlan}
          url="/admin/subscription-plans"
          queryKey={["admin", "giftable-plans"]}
          enabled={open}
          valueKey="slug"
          labelKey="name"
          getOptionDescription={(plan) =>
            filter([
              get(typeLabelMap, plan.type, plan.type),
              formatPrice(plan.price),
              plan.durationDays ? `${plan.durationDays} kun` : null,
            ], Boolean)
              .join(" · ")
          }
          title="Premium plan tanlang"
          description={`"${displayName}" foydalanuvchisiga beriladigan premium planni tanlang.`}
          placeholder="Planni tanlang"
          searchPlaceholder="Plan qidirish..."
          loadingText="Planlar yuklanmoqda..."
          emptyText="Sovg'a qilish uchun aktiv premium plan yo'q."
          triggerClassName="h-11"
        />
        {selectedPlan ? (
          <p className="text-xs text-muted-foreground">
            {formatPrice(selectedPlan.price)} · {selectedPlan.durationDays} kun
          </p>
        ) : null}
      </div>
      {/* Days override */}
      <div className="space-y-2">
        <Label htmlFor="gift-days">Kunlar soni (ixtiyoriy)</Label>
        <Input
          id="gift-days"
          type="number"
          min="1"
          placeholder={
            selectedPlan?.durationDays
              ? `Plan standarti: ${selectedPlan.durationDays}`
              : "Kunlar sonini kiriting"
          }
          value={daysOverride}
          onChange={(e) => setDaysOverride(e.target.value)}
        />
      </div>
      {/* AI credits */}
      <div className="space-y-2">
        <Label htmlFor="gift-ai-credits">AI kredit bonusi</Label>
        <Input
          id="gift-ai-credits"
          type="number"
          min={MIN_AI_CREDITS}
          max={MAX_AI_CREDITS}
          step="1"
          inputMode="numeric"
          value={aiCredits}
          onChange={(e) => setAiCredits(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Premium bilan birga userga bir martalik AI credit beriladi.
        </p>
      </div>
      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="gift-note">Izoh (ixtiyoriy)</Label>
        <Textarea
          id="gift-note"
          maxLength={255}
          placeholder="Sovg'a uchun izoh..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        {note.length > 0 ? (
          <p className="text-xs text-muted-foreground text-right">
            {note.length}/255
          </p>
        ) : null}
      </div>
    </FormDrawerShell>
  );
};

export default GiftPremiumDrawer;
