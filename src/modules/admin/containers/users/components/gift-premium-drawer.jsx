import React from "react";
import { get, isArray, join } from "lodash";
import { CheckIcon, GiftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import FormDrawerShell from "./form-drawer-shell.jsx";

const formatPrice = (price) => {
  if (!price) return "Bepul";
  return `${(price / 100).toLocaleString("uz-UZ")} so'm`;
};

const typeBadgeMap = {
  INDIVIDUAL: { label: "Individual", className: "bg-blue-50 text-blue-700 border-blue-200" },
  FAMILY: { label: "Oilaviy", className: "bg-purple-50 text-purple-700 border-purple-200" },
};

const GiftPremiumDrawer = ({ user, open, onOpenChange }) => {
  const [selectedSlug, setSelectedSlug] = React.useState("");
  const [daysOverride, setDaysOverride] = React.useState("");
  const [note, setNote] = React.useState("");

  const { data: plansResponse, isLoading: isLoadingPlans } = useGetQuery({
    url: "/admin/subscription-plans",
    queryProps: {
      queryKey: ["admin", "giftable-plans"],
      enabled: open,
    },
  });

  const rawPlans = get(plansResponse, "data", []);
  const plans = isArray(rawPlans) ? rawPlans : [];

  const giftMutation = usePostQuery({
    queryKey: ["admin-users"],
  });

  const selectedPlan = React.useMemo(
    () => plans.find((p) => p.slug === selectedSlug),
    [plans, selectedSlug],
  );

  React.useEffect(() => {
    if (open) {
      setSelectedSlug("");
      setDaysOverride("");
      setNote("");
    }
  }, [open]);

  const displayName =
    `${get(user, "firstName", "")} ${get(user, "lastName", "")}`.trim() ||
    get(user, "email") ||
    "Foydalanuvchi";

  const handleSubmit = React.useCallback(async () => {
    if (!selectedPlan) {
      toast.error("Planni tanlang");
      return;
    }

    try {
      await giftMutation.mutateAsync({
        url: `/admin/users/${user.id}/gift-premium`,
        attributes: {
          planSlug: selectedPlan.slug,
          days: daysOverride ? Number(daysOverride) : undefined,
          note: note.trim() || undefined,
        },
      });
      toast.success(
        `${user.firstName || user.email || "Foydalanuvchi"}ga premium sovg'a qilindi`,
      );
      onOpenChange(false);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Premium sovg'a qilib bo'lmadi",
      );
    }
  }, [selectedPlan, daysOverride, note, user, giftMutation, onOpenChange]);

  return (
    <FormDrawerShell
      open={open}
      onOpenChange={onOpenChange}
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
            onClick={() => onOpenChange(false)}
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
        {isLoadingPlans ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Planlar yuklanmoqda...
          </div>
        ) : (
          <div className="grid gap-2">
            {plans.map((plan) => {
              const isSelected = selectedSlug === plan.slug;
              return (
                <button
                  key={plan.slug}
                  type="button"
                  onClick={() => setSelectedSlug(plan.slug)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{plan.name}</span>
                      <Badge
                        variant="outline"
                        className={get(typeBadgeMap, [plan.type, "className"], "")}
                      >
                        {get(typeBadgeMap, [plan.type, "label"], plan.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(plan.price)} · {plan.durationDays} kun
                    </p>
                  </div>
                  {isSelected ? (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-3" />
                    </div>
                  ) : (
                    <div className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/25" />
                  )}
                </button>
              );
            })}
          </div>
        )}
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
