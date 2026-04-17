import React from "react";
import { get, map } from "lodash";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const emptyForm = {
  slug: "",
  name: "",
  description: "",
  type: "INDIVIDUAL",
  price: "",
  originalPrice: "",
  discountPercent: "",
  durationDays: "",
  trialDays: "",
  maxFamilyMembers: "2",
  autoRenewDefault: true,
  isActive: true,
  features: [],
};

const parseFeatures = (features) => {
  if (!features || typeof features !== "object") return [];
  if (Array.isArray(features)) return features;
  return Object.entries(features).map(([key, value]) => ({ key, value: String(value) }));
};

const PlanForm = ({ defaultValues, onSubmit, isSubmitting, submitLabel }) => {
  const [form, setForm] = React.useState(() => {
    if (!defaultValues) return { ...emptyForm };

    return {
      slug: defaultValues.slug || "",
      name: defaultValues.name || "",
      description: defaultValues.description || "",
      type: defaultValues.type || "INDIVIDUAL",
      price: defaultValues.price != null ? String(defaultValues.price) : "",
      originalPrice:
        defaultValues.originalPrice != null
          ? String(defaultValues.originalPrice)
          : "",
      discountPercent:
        defaultValues.discountPercent != null
          ? String(defaultValues.discountPercent)
          : "",
      durationDays:
        defaultValues.durationDays != null
          ? String(defaultValues.durationDays)
          : "",
      trialDays:
        defaultValues.trialDays != null
          ? String(defaultValues.trialDays)
          : "",
      maxFamilyMembers:
        defaultValues.maxFamilyMembers != null
          ? String(defaultValues.maxFamilyMembers)
          : "2",
      autoRenewDefault:
        defaultValues.autoRenewDefault != null
          ? defaultValues.autoRenewDefault
          : true,
      isActive:
        defaultValues.isActive != null ? defaultValues.isActive : true,
      features: parseFeatures(defaultValues.features),
    };
  });

  const updateField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleNameChange = (value) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugify(value),
    }));
  };

  const handleAddFeature = () => {
    setForm((current) => ({
      ...current,
      features: [...current.features, { key: "", value: "" }],
    }));
  };

  const handleUpdateFeature = (index, field, value) => {
    setForm((current) => {
      const features = [...current.features];
      features[index] = { ...features[index], [field]: value };
      return { ...current, features };
    });
  };

  const handleRemoveFeature = (index) => {
    setForm((current) => ({
      ...current,
      features: current.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = React.useCallback(() => {
    const payload = {
      slug: form.slug,
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      price: form.price ? Number(form.price) : 0,
      originalPrice: form.originalPrice
        ? Number(form.originalPrice)
        : undefined,
      discountPercent: form.discountPercent
        ? Number(form.discountPercent)
        : undefined,
      durationDays: form.durationDays ? Number(form.durationDays) : undefined,
      trialDays: form.trialDays ? Number(form.trialDays) : undefined,
      maxFamilyMembers:
        form.type === "FAMILY" ? Number(form.maxFamilyMembers) : undefined,
      autoRenewDefault: form.autoRenewDefault,
      isActive: form.isActive,
      features:
        form.features.length > 0
          ? form.features.reduce((acc, f) => {
              if (f.key.trim()) acc[f.key.trim()] = f.value;
              return acc;
            }, {})
          : undefined,
    };

    onSubmit(payload);
  }, [form, onSubmit]);

  return (
    <>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Nomi</Label>
          <Input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Masalan: Premium Pro"
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Slug</Label>
          <Input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            placeholder="premium-pro"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Tavsif</Label>
          <Textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Plan haqida qisqacha ma'lumot"
          />
        </div>

        {/* Type toggle */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Turi</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.type === "INDIVIDUAL" ? "default" : "outline"}
              size="sm"
              onClick={() => updateField("type", "INDIVIDUAL")}
            >
              Individual
            </Button>
            <Button
              type="button"
              variant={form.type === "FAMILY" ? "default" : "outline"}
              size="sm"
              onClick={() => updateField("type", "FAMILY")}
            >
              Oilaviy
            </Button>
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Narxi (UZS)</Label>
          <Input
            type="number"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        {/* Discount Percent */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Chegirma foizi</Label>
          <Input
            type="number"
            value={form.discountPercent}
            onChange={(e) => updateField("discountPercent", e.target.value)}
            placeholder="0"
            min="0"
            max="100"
          />
        </div>

        {/* Original Price — show when discountPercent > 0 */}
        {Number(form.discountPercent) > 0 ? (
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">
              Asl narxi (UZS, chegirmadan oldingi)
            </Label>
            <Input
              type="number"
              value={form.originalPrice}
              onChange={(e) => updateField("originalPrice", e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        ) : null}

        {/* Duration Days */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Muddat (kun)</Label>
          <Input
            type="number"
            value={form.durationDays}
            onChange={(e) => updateField("durationDays", e.target.value)}
            placeholder="30 (bo'sh qoldirsangiz cheksiz)"
            min="0"
          />
        </div>

        {/* Trial Days */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Sinov muddati (kun)</Label>
          <Input
            type="number"
            value={form.trialDays}
            onChange={(e) => updateField("trialDays", e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>

        {/* Max Family Members — only for FAMILY type */}
        {form.type === "FAMILY" ? (
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">
              Maksimal oila a'zolari soni
            </Label>
            <Input
              type="number"
              value={form.maxFamilyMembers}
              onChange={(e) => updateField("maxFamilyMembers", e.target.value)}
              placeholder="2"
              min="2"
              max="5"
            />
          </div>
        ) : null}

        {/* Auto-Renew Default */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Avtomatik yangilash</p>
            <p className="text-xs text-muted-foreground">
              Standart holatda avtomatik yangilansinmi
            </p>
          </div>
          <Switch
            checked={form.autoRenewDefault}
            onCheckedChange={(checked) =>
              updateField("autoRenewDefault", checked)
            }
          />
        </div>

        {/* Is Active */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Faol</p>
            <p className="text-xs text-muted-foreground">
              Plan foydalanuvchilarga ko'rinadimi
            </p>
          </div>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => updateField("isActive", checked)}
          />
        </div>

        {/* Features — key/value editor */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Xususiyatlar</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleAddFeature}
            >
              <PlusIcon className="size-3.5" />
              Qo'shish
            </Button>
          </div>

          {form.features.length > 0 ? (
            <div className="flex flex-col gap-3">
              {map(form.features, (feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex flex-1 gap-2">
                    <Input
                      value={get(feature, "key", "")}
                      onChange={(e) =>
                        handleUpdateFeature(index, "key", e.target.value)
                      }
                      placeholder="Kalit"
                      className="flex-1"
                    />
                    <Input
                      value={get(feature, "value", "")}
                      onChange={(e) =>
                        handleUpdateFeature(index, "value", e.target.value)
                      }
                      placeholder="Qiymat"
                      className="flex-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveFeature(index)}
                    className="mt-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Hozircha xususiyatlar yo'q. Yuqoridagi tugma orqali qo'shing.
            </p>
          )}
        </div>
      </div>

      <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {submitLabel}
        </Button>
        <DrawerClose asChild>
          <Button variant="outline">Bekor qilish</Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
};

export { PlanForm, emptyForm };
