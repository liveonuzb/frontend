import React from "react";
import { get, map } from "lodash";
import { useGetQuery } from "@/hooks/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const emptyPromoCodeForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxUses: "",
  stackable: false,
  minPlanPrice: "",
  validFrom: "",
  validTo: "",
  applicablePlanIds: [],
  isActive: true,
};

const PromoCodeForm = ({ form, setForm }) => {
  const { data: plansData } = useGetQuery({
    url: "/admin/premium/plans",
    queryProps: { queryKey: ["admin", "premium-plans-for-promo"] },
  });
  const plans = get(plansData, "data.data", []);
  const activePlans = React.useMemo(
    () => plans.filter((p) => get(p, "isActive")),
    [plans],
  );

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const togglePlanId = (planId) => {
    setForm((current) => {
      const ids = current.applicablePlanIds || [];
      if (ids.includes(planId)) {
        return { ...current, applicablePlanIds: ids.filter((id) => id !== planId) };
      }
      return { ...current, applicablePlanIds: [...ids, planId] };
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Code */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Promo kod</Label>
        <Input
          value={form.code}
          onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
          placeholder="Masalan: SUMMER2025"
          className="font-mono"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Tavsif</Label>
        <Textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Promo kod haqida qisqacha"
          rows={2}
        />
      </div>

      {/* Discount Type */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Chegirma turi</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={form.discountType === "PERCENTAGE" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("discountType", "PERCENTAGE")}
          >
            Foiz (%)
          </Button>
          <Button
            type="button"
            variant={form.discountType === "FIXED_AMOUNT" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("discountType", "FIXED_AMOUNT")}
          >
            Summa (UZS)
          </Button>
        </div>
      </div>

      {/* Discount Value */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          {form.discountType === "PERCENTAGE" ? "Foiz (%)" : "Summa (UZS)"}
        </Label>
        <Input
          type="number"
          value={form.discountValue}
          onChange={(e) => handleChange("discountValue", e.target.value)}
          placeholder={
            form.discountType === "PERCENTAGE" ? "Masalan: 20" : "Masalan: 50000"
          }
          min={0}
        />
      </div>

      {/* Max Uses */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          Maksimal ishlatish (bo'sh = cheksiz)
        </Label>
        <Input
          type="number"
          value={form.maxUses}
          onChange={(e) => handleChange("maxUses", e.target.value)}
          placeholder="Cheksiz"
          min={0}
        />
      </div>

      {/* Stackable */}
      <div className="flex items-center gap-3">
        <Switch
          checked={form.stackable}
          onCheckedChange={(val) => handleChange("stackable", val)}
        />
        <Label className="text-sm font-medium">Stackable (boshqa kodlar bilan birga ishlatish)</Label>
      </div>

      {/* Min Plan Price */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          Minimal plan narxi (ixtiyoriy)
        </Label>
        <Input
          type="number"
          value={form.minPlanPrice}
          onChange={(e) => handleChange("minPlanPrice", e.target.value)}
          placeholder="Masalan: 100000"
          min={0}
        />
      </div>

      {/* Valid From */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Boshlanish sanasi</Label>
        <Input
          type="date"
          value={form.validFrom}
          onChange={(e) => handleChange("validFrom", e.target.value)}
        />
      </div>

      {/* Valid To */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Tugash sanasi</Label>
        <Input
          type="date"
          value={form.validTo}
          onChange={(e) => handleChange("validTo", e.target.value)}
        />
      </div>

      {/* Applicable Plans */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Tegishli planlar</Label>
        {activePlans.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3">
            {map(activePlans, (plan) => {
              const planId = get(plan, "id");
              const checked = (form.applicablePlanIds || []).includes(planId);
              return (
                <label
                  key={planId}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => togglePlanId(planId)}
                  />
                  <span className="text-sm">{get(plan, "name")}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Faol planlar topilmadi
          </p>
        )}
      </div>

      {/* Is Active */}
      <div className="flex items-center gap-3">
        <Switch
          checked={form.isActive}
          onCheckedChange={(val) => handleChange("isActive", val)}
        />
        <Label className="text-sm font-medium">Faol</Label>
      </div>
    </div>
  );
};

export default PromoCodeForm;
